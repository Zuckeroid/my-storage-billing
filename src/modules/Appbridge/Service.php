<?php

declare(strict_types=1);
/**
 * Copyright 2022-2025 FOSSBilling
 * Copyright 2011-2021 BoxBilling, Inc.
 * SPDX-License-Identifier: Apache-2.0.
 *
 * @copyright FOSSBilling (https://www.fossbilling.org)
 * @license http://www.apache.org/licenses/LICENSE-2.0 Apache-2.0
 */

namespace Box\Mod\Appbridge;

use RedBeanPHP\OODBBean;

class Service implements \FOSSBilling\InjectionAwareInterface
{
    public const string CONTRACT_VERSION = 'appbridge-v1';
    private const string ACTIVATION_TOKEN_BEAN = 'mod_appbridge_activation_token';
    private const string DEVICE_BEAN = 'mod_appbridge_device';
    private const string PRIMARY_DEVICE_LIMIT_KEY = 'appbridge_device_limit';
    private const array DEVICE_LIMIT_KEYS = [
        'appbridge_device_limit',
        'device_limit',
        'devices_limit',
        'ip_limit',
        'ipLimit',
        'max_devices',
        'maxDevices',
    ];
    private const int DEVICE_TOKEN_TTL_DAYS = 30;
    private const bool UNLIMITED_DEVICE_TEST_MODE = false;
    private const int UNLIMITED_DEVICE_SENTINEL = 9999;
    private const string STATUS_PENDING = 'pending';
    private const string STATUS_USED = 'used';
    private const string STATUS_ACTIVE = 'active';
    private const string STATUS_REVOKED = 'revoked';
    private const string STATUS_EXPIRED = 'expired';

    protected ?\Pimple\Container $di = null;
    private bool $storageEnsured = false;

    public function setDi(\Pimple\Container $di): void
    {
        $this->di = $di;
    }

    public function getDi(): ?\Pimple\Container
    {
        return $this->di;
    }

    public static function onAfterAdminOrderDelete(\Box_Event $event): void
    {
        $params = $event->getParameters();
        $orderId = isset($params['id']) ? (int) $params['id'] : 0;
        if ($orderId <= 0) {
            return;
        }

        $service = new self();
        $service->setDi($event->getDi());
        $service->cleanupArtifactsForOrder($orderId);
    }

    public function install(): bool
    {
        $this->ensureStorage();

        return true;
    }

    public function uninstall(): bool
    {
        $this->di['db']->exec('DROP TABLE IF EXISTS `' . self::ACTIVATION_TOKEN_BEAN . '`');
        $this->di['db']->exec('DROP TABLE IF EXISTS `' . self::DEVICE_BEAN . '`');
        $this->storageEnsured = false;

        return true;
    }

    public function loginWithPassword(string $email, string $password): array
    {
        unset($email, $password);

        throw new \FOSSBilling\InformationException(
            'Create an activation token in the client area and use it in the application.',
            [],
            403,
        );
    }

    public function loginWithToken(string $appToken, array $deviceData = []): array
    {
        $this->ensureStorage();
        $this->expireDeviceTokens();

        $activationToken = $this->findPendingActivationTokenByToken($appToken);
        if ($activationToken instanceof OODBBean) {
            return $this->exchangeActivationToken($activationToken, $deviceData);
        }

        $device = $this->findActiveDeviceByToken($appToken);
        if ($device instanceof OODBBean) {
            return $this->loginWithDeviceToken($device, $appToken);
        }

        throw new \FOSSBilling\InformationException('Application token is invalid.', [], 401);
    }

    public function getBundleForClient(\Model_Client $client): array
    {
        $this->ensureStorage();
        $this->expireActivationTokens((int) $client->id);
        $this->expireDeviceTokens((int) $client->id);

        return $this->buildAccessBundle($client);
    }

    public function createActivationTokenBundleForClient(\Model_Client $client, ?int $orderId = null, bool $forceRotate = false): array
    {
        $this->ensureStorage();
        $this->expireActivationTokens((int) $client->id);
        $this->expireDeviceTokens((int) $client->id);

        if ($client->status !== \Model_Client::ACTIVE) {
            throw new \FOSSBilling\InformationException('Application access is not available for this account.', [], 401);
        }

        $overview = $this->getDeviceOverview($client);
        if (!$overview['has_active_access']) {
            throw new \FOSSBilling\InformationException('No active subscription is ready for application access yet.', [], 409);
        }

        $selectedGroup = $this->resolveActivationTargetGroup($overview, $orderId);
        if ($selectedGroup === null) {
            throw new \FOSSBilling\InformationException('Selected service is not ready for device activation.', [], 409);
        }

        $selectedOrderId = (int) $selectedGroup['order_id'];
        $existingPendingToken = $this->findPendingActivationTokenForOrder((int) $client->id, $selectedOrderId);
        if (!$forceRotate && $existingPendingToken instanceof OODBBean) {
            $existingTokenValue = trim((string) ($existingPendingToken->token_value ?? ''));
            if ($existingTokenValue !== '') {
                return $this->buildActivationTokenBundle(
                    $client,
                    $selectedGroup,
                    $existingTokenValue,
                    (string) ($existingPendingToken->created_at ?? $this->now()),
                    false,
                );
            }
        }

        $this->revokePendingActivationTokens((int) $client->id, $selectedOrderId);

        $overview = $this->getDeviceOverview($client);
        $selectedGroup = $this->resolveActivationTargetGroup($overview, $selectedOrderId);
        if ($selectedGroup === null) {
            throw new \FOSSBilling\InformationException('Selected service is not ready for device activation.', [], 409);
        }

        if (!self::UNLIMITED_DEVICE_TEST_MODE && (int) ($selectedGroup['available'] ?? 0) < 1) {
            throw new \FOSSBilling\InformationException('No device slots are available for this service.', [], 409);
        }

        $token = $this->generateToken();
        $now = $this->now();

        $row = $this->di['db']->dispense(self::ACTIVATION_TOKEN_BEAN);
        $row->client_id = $client->id;
        $row->source_order_id = $selectedOrderId;
        $row->token_hash = $this->hashToken($token);
        $row->token_value = $token;
        $row->status = self::STATUS_PENDING;
        $row->expires_at = '2999-12-31 23:59:59';
        $row->created_at = $now;
        $row->updated_at = $now;
        $this->di['db']->store($row);

        return $this->buildActivationTokenBundle($client, $selectedGroup, $token, $now, true);
    }

    public function rotateTokenForClient(\Model_Client $client, ?int $orderId = null): array
    {
        return $this->createActivationTokenBundleForClient($client, $orderId, true);
    }

    public function resolveProvisioningDeviceLimitForOrder(\Model_ClientOrder $order): int
    {
        return $this->resolveConfiguredPositiveOrderDeviceLimitMeta($order)['value'] ?? 1;
    }

    public function revokeDeviceForClient(\Model_Client $client, int $deviceId): array
    {
        $this->ensureStorage();
        $this->expireDeviceTokens((int) $client->id);

        if ($deviceId < 1) {
            throw new \FOSSBilling\InformationException('Device not found.', [], 404);
        }

        $device = $this->di['db']->findOne(
            self::DEVICE_BEAN,
            'id = :id AND client_id = :client_id AND status = :status LIMIT 1',
            [
                ':id' => $deviceId,
                ':client_id' => $client->id,
                ':status' => self::STATUS_ACTIVE,
            ],
        );

        if (!$device instanceof OODBBean) {
            throw new \FOSSBilling\InformationException('Device not found.', [], 404);
        }

        $now = $this->now();
        $device->status = self::STATUS_REVOKED;
        $device->expires_at = $now;
        $device->updated_at = $now;
        $this->di['db']->store($device);

        return $this->buildAccessBundle($client);
    }

    private function exchangeActivationToken(OODBBean $activationToken, array $deviceData): array
    {
        $client = $this->getClientById((int) $activationToken->client_id);
        if (!$client instanceof \Model_Client || $client->status !== \Model_Client::ACTIVE) {
            throw new \FOSSBilling\InformationException('Application access is not available for this account.', [], 401);
        }

        $now = $this->now();
        $activationToken->status = self::STATUS_USED;
        $activationToken->token_value = null;
        $activationToken->used_at = $now;
        $activationToken->updated_at = $now;
        $this->di['db']->store($activationToken);

        $overview = $this->getDeviceOverview($client);
        if (!$overview['has_active_access']) {
            throw new \FOSSBilling\InformationException('No active subscription is ready for application access yet.', [], 409);
        }

        $selectedGroup = $this->resolveActivationTargetGroup(
            $overview,
            !empty($activationToken->source_order_id) ? (int) $activationToken->source_order_id : null,
        );
        if ($selectedGroup === null) {
            throw new \FOSSBilling\InformationException('Selected service is not ready for device activation.', [], 409);
        }

        if (
            !self::UNLIMITED_DEVICE_TEST_MODE
            && (((int) ($selectedGroup['active'] ?? 0)) + 1 + ((int) ($selectedGroup['pending_tokens'] ?? 0)) > (int) ($selectedGroup['device_limit'] ?? 0))
        ) {
            throw new \FOSSBilling\InformationException('No device slots are available for this service.', [], 409);
        }

        $deviceToken = $this->generateToken();
        $expiresAt = date('Y-m-d H:i:s', strtotime('+' . self::DEVICE_TOKEN_TTL_DAYS . ' days'));
        $sanitizedDeviceData = $this->sanitizeDeviceData($deviceData);

        $device = $this->di['db']->dispense(self::DEVICE_BEAN);
        $device->client_id = $client->id;
        $device->source_order_id = $activationToken->source_order_id ?: $overview['primary_order_id'];
        $device->activation_token_id = $activationToken->id;
        $device->device_name = $sanitizedDeviceData['device_name'];
        $device->platform = $sanitizedDeviceData['platform'];
        $device->install_id = $sanitizedDeviceData['install_id'];
        $device->device_token_hash = $this->hashToken($deviceToken);
        $device->status = self::STATUS_ACTIVE;
        $device->expires_at = $expiresAt;
        $device->last_seen_at = $now;
        $device->created_at = $now;
        $device->updated_at = $now;
        $this->di['db']->store($device);

        return $this->buildAccessBundle($client, $deviceToken, $expiresAt, $now, $device);
    }

    private function loginWithDeviceToken(OODBBean $device, string $rawToken): array
    {
        $client = $this->getClientById((int) $device->client_id);
        if (!$client instanceof \Model_Client || $client->status !== \Model_Client::ACTIVE) {
            throw new \FOSSBilling\InformationException('Application access is not available for this account.', [], 401);
        }

        if (!hash_equals((string) $device->device_token_hash, $this->hashToken($rawToken))) {
            throw new \FOSSBilling\InformationException('Application token is invalid.', [], 401);
        }

        if (strtotime((string) $device->expires_at) < time()) {
            $this->markDeviceExpired($device);
            throw new \FOSSBilling\InformationException('Application token has expired. Create a new token in the client area.', [], 401);
        }

        $now = $this->now();
        $refreshedExpiresAt = date('Y-m-d H:i:s', strtotime('+' . self::DEVICE_TOKEN_TTL_DAYS . ' days'));
        $device->last_seen_at = $now;
        $device->expires_at = $refreshedExpiresAt;
        $device->updated_at = $now;
        $this->di['db']->store($device);

        return $this->buildAccessBundle($client, null, $refreshedExpiresAt, (string) $device->created_at, $device);
    }

    private function buildAccessBundle(
        \Model_Client $client,
        ?string $appToken = null,
        ?string $tokenExpiresAt = null,
        ?string $tokenIssuedAt = null,
        ?OODBBean $device = null,
    ): array {
        $subscriptions = $this->collectClientSubscriptions($client);
        $preferredOrderId = $device instanceof OODBBean && !empty($device->source_order_id)
            ? (int) $device->source_order_id
            : null;
        $subscriptions = $this->prioritizeSubscriptionsByOrder($subscriptions, $preferredOrderId);
        $activeLinks = [];

        foreach ($subscriptions as $subscription) {
            if (
                ($subscription['order_status'] ?? null) === \Model_ClientOrder::STATUS_ACTIVE
                && ($subscription['provision_status'] ?? null) === self::STATUS_ACTIVE
                && !empty($subscription['subscription_link'])
            ) {
                $activeLinks[] = $subscription['subscription_link'];
            }
        }

        $overview = $this->getDeviceOverview($client);
        $primarySubscription = $this->resolvePrimarySubscription($subscriptions);
        $connection = $this->buildConnectionPayload($subscriptions, $activeLinks, $primarySubscription);
        $service = $this->buildPrimaryServicePayload($primarySubscription);

        $app = [
            'token_expires_at' => $this->formatDateAtom($tokenExpiresAt),
            'token_issued_at' => $this->formatDateAtom($tokenIssuedAt),
        ];

        if ($appToken !== null) {
            $app['token'] = $appToken;
        }

        if ($device instanceof OODBBean) {
            $app['device'] = $this->mapDeviceRow($device);
        }

        return [
            'contract_version' => self::CONTRACT_VERSION,
            'client' => [
                'id' => (int) $client->id,
                'email' => (string) $client->email,
                'name' => trim((string) $client->getFullName()),
                'first_name' => (string) ($client->first_name ?? ''),
                'last_name' => (string) ($client->last_name ?? ''),
                'status' => (string) $client->status,
            ],
            'app' => $app,
            'access' => [
                'has_active_access' => !empty($activeLinks),
                'device_binding' => 'per-device-token',
                'connection_mode' => 'shared-subscription-link',
                'revoke_scope' => 'application-token',
            ],
            'connection' => $connection,
            'service' => $service,
            'has_active_access' => !empty($activeLinks),
            'active_subscription_links' => array_values($activeLinks),
            'subscriptions' => $subscriptions,
            'devices' => $overview,
            'generated_at' => date(DATE_ATOM),
        ];
    }

    private function buildActivationTokenBundle(
        \Model_Client $client,
        array $selectedGroup,
        string $token,
        string $createdAt,
        bool $createdNew,
    ): array {
        $bundle = $this->buildAccessBundle($client);
        $bundle['activation_token'] = [
            'token' => $token,
            'created_at' => $this->formatDateAtom($createdAt),
            'single_use' => true,
            'source_order_id' => (int) ($selectedGroup['order_id'] ?? 0),
            'source_title' => $selectedGroup['title'] ?? null,
            'created_new' => $createdNew,
            'reused' => !$createdNew,
        ];

        return $bundle;
    }

    private function resolvePrimarySubscription(array $subscriptions): ?array
    {
        $activeReady = array_values(array_filter(
            $subscriptions,
            static fn(array $subscription): bool =>
                ($subscription['order_status'] ?? null) === \Model_ClientOrder::STATUS_ACTIVE
                && ($subscription['provision_status'] ?? null) === self::STATUS_ACTIVE
                && !empty($subscription['subscription_link']),
        ));

        if (!empty($activeReady)) {
            return $activeReady[0];
        }

        return $subscriptions[0] ?? null;
    }

    private function prioritizeSubscriptionsByOrder(array $subscriptions, ?int $preferredOrderId): array
    {
        if ($preferredOrderId === null || $preferredOrderId < 1 || count($subscriptions) < 2) {
            return $subscriptions;
        }

        $preferred = [];
        $rest = [];

        foreach ($subscriptions as $subscription) {
            $subscriptionOrderId = (int) ($subscription['order_id'] ?? 0);
            if ($subscriptionOrderId === $preferredOrderId) {
                $preferred[] = $subscription;
                continue;
            }

            $rest[] = $subscription;
        }

        if (empty($preferred)) {
            return $subscriptions;
        }

        return array_merge($preferred, $rest);
    }

    private function buildConnectionPayload(array $subscriptions, array $activeLinks, ?array $primarySubscription): array
    {
        $primaryLink = null;
        if ($primarySubscription !== null) {
            $primaryLink = isset($primarySubscription['subscription_link'])
                ? trim((string) $primarySubscription['subscription_link'])
                : null;

            if ($primaryLink === '') {
                $primaryLink = null;
            }
        }

        $primaryLink ??= $activeLinks[0] ?? null;
        $type = $this->detectConnectionType($primaryLink);
        $ready = $primaryLink !== null;

        return [
            'ready' => $ready,
            'type' => $type,
            'link' => $primaryLink,
            'links' => array_values($activeLinks),
            'xray_config' => null,
            'source_order_id' => $primarySubscription['order_id'] ?? null,
            'source_title' => $primarySubscription['title'] ?? null,
            'revision' => $ready ? hash('sha256', (string) $primaryLink) : null,
            'available_connection_count' => count($activeLinks),
            'service_count' => count($subscriptions),
        ];
    }

    private function buildPrimaryServicePayload(?array $primarySubscription): ?array
    {
        if ($primarySubscription === null) {
            return null;
        }

        return [
            'order_id' => $primarySubscription['order_id'] ?? null,
            'title' => $primarySubscription['title'] ?? null,
            'order_status' => $primarySubscription['order_status'] ?? null,
            'provision_status' => $primarySubscription['provision_status'] ?? null,
            'device_limit' => $primarySubscription['device_limit'] ?? 0,
            'device_limit_source' => $primarySubscription['device_limit_source'] ?? null,
            'eligible_for_app' => !empty($primarySubscription['eligible_for_app']),
            'last_sync_at' => $primarySubscription['last_sync_at'] ?? null,
            'access_email_sent_at' => $primarySubscription['access_email_sent_at'] ?? null,
        ];
    }

    private function detectConnectionType(?string $link): ?string
    {
        if ($link === null || trim($link) === '') {
            return null;
        }

        $normalized = strtolower(trim($link));
        foreach (['vless://', 'vmess://', 'trojan://', 'ss://', 'ssr://'] as $prefix) {
            if (str_starts_with($normalized, $prefix)) {
                return rtrim($prefix, ':/');
            }
        }

        return 'link';
    }

    private function collectClientSubscriptions(\Model_Client $client): array
    {
        $orchestratorService = $this->di['mod_service']('Orchestrator');
        $orders = $this->di['db']->find(
            'ClientOrder',
            'client_id = :client_id ORDER BY created_at DESC',
            [':client_id' => $client->id],
        );

        $subscriptions = [];
        foreach ($orders as $order) {
            if (!$order instanceof \Model_ClientOrder) {
                continue;
            }

            $access = $orchestratorService->getClientOrderAccess($client, (int) $order->id);
            $hasBridgeData =
                !empty($access['status'])
                || !empty($access['subscription_link'])
                || !empty($access['error'])
                || !empty($access['last_sync_at']);

            if (!$hasBridgeData) {
                continue;
            }

            $deviceLimitMeta = $this->resolveOrderDeviceLimitMeta($order, $access);
            $eligibleForApp =
                ($order->status ?? null) === \Model_ClientOrder::STATUS_ACTIVE
                && ($access['status'] ?? null) === self::STATUS_ACTIVE
                && !empty($access['subscription_link']);

            $subscriptions[] = [
                'order_id' => (int) $order->id,
                'title' => trim((string) ($order->title ?? '')),
                'order_status' => (string) $order->status,
                'provision_status' => $access['status'] ?? null,
                'subscription_link' => $access['subscription_link'] ?? null,
                'error' => $access['error'] ?? null,
                'last_sync_at' => $this->formatDateAtom($access['last_sync_at'] ?? null),
                'access_email_sent_at' => $this->formatDateAtom($access['access_email_sent_at'] ?? null),
                'device_limit' => $deviceLimitMeta['value'],
                'device_limit_source' => $deviceLimitMeta['source'],
                'eligible_for_app' => $eligibleForApp,
            ];
        }

        return $subscriptions;
    }

    private function getDeviceOverview(\Model_Client $client, ?int $ignoreActivationTokenId = null): array
    {
        $subscriptions = $this->collectClientSubscriptions($client);
        $clientId = (int) $client->id;
        $groupMap = [];
        $eligibleOrderCount = 0;
        $primaryOrderId = null;

        foreach ($subscriptions as $subscription) {
            $orderId = (int) ($subscription['order_id'] ?? 0);
            if ($orderId < 1) {
                continue;
            }

            if (!empty($subscription['eligible_for_app'])) {
                ++$eligibleOrderCount;
                $primaryOrderId ??= $orderId;
            }

            $groupMap[$orderId] = [
                'order_id' => $orderId,
                'title' => $subscription['title'] ?? null,
                'order_status' => $subscription['order_status'] ?? null,
                'provision_status' => $subscription['provision_status'] ?? null,
                'device_limit' => max(0, (int) ($subscription['device_limit'] ?? 0)),
                'device_limit_source' => $subscription['device_limit_source'] ?? null,
                'eligible_for_app' => !empty($subscription['eligible_for_app']),
                'active' => 0,
                'pending_tokens' => 0,
                'latest_pending_created_at' => null,
                'available' => 0,
                'is_primary' => false,
                'devices' => [],
            ];
        }

        if ($primaryOrderId === null && !empty($groupMap)) {
            $primaryOrderId = (int) array_key_first($groupMap);
        }

        $activeDeviceRows = $this->di['db']->find(
            self::DEVICE_BEAN,
            'client_id = :client_id AND status = :status ORDER BY created_at DESC',
            [
                ':client_id' => $clientId,
                ':status' => self::STATUS_ACTIVE,
            ],
        );

        $pendingParams = [
            ':client_id' => $clientId,
            ':status' => self::STATUS_PENDING,
        ];
        $pendingSql = 'client_id = :client_id AND status = :status';
        if ($ignoreActivationTokenId !== null) {
            $pendingSql .= ' AND id != :ignore_id';
            $pendingParams[':ignore_id'] = $ignoreActivationTokenId;
        }
        $pendingTokenRows = $this->di['db']->find(
            self::ACTIVATION_TOKEN_BEAN,
            $pendingSql . ' ORDER BY created_at DESC',
            $pendingParams,
        );

        $groupOrderIds = array_map('intval', array_keys($groupMap));
        $mappedDevices = [];
        $activeDevices = 0;
        foreach ($activeDeviceRows as $deviceRow) {
            if (!$deviceRow instanceof OODBBean) {
                continue;
            }

            $resolvedOrderId = $this->resolveOverviewOrderId(
                isset($deviceRow->source_order_id) ? (int) $deviceRow->source_order_id : 0,
                $primaryOrderId,
                $groupOrderIds,
            );

            if ($resolvedOrderId !== null && isset($groupMap[$resolvedOrderId])) {
                ++$activeDevices;
                $mappedDevice = $this->mapDeviceRow($deviceRow);
                $mappedDevices[] = $mappedDevice;
                ++$groupMap[$resolvedOrderId]['active'];
                $groupMap[$resolvedOrderId]['devices'][] = $mappedDevice;
            }
        }

        $pendingTokens = 0;
        foreach ($pendingTokenRows as $pendingTokenRow) {
            if (!$pendingTokenRow instanceof OODBBean) {
                continue;
            }

            $resolvedOrderId = $this->resolveOverviewOrderId(
                isset($pendingTokenRow->source_order_id) ? (int) $pendingTokenRow->source_order_id : 0,
                $primaryOrderId,
                $groupOrderIds,
            );

            if ($resolvedOrderId !== null && isset($groupMap[$resolvedOrderId])) {
                ++$pendingTokens;
                ++$groupMap[$resolvedOrderId]['pending_tokens'];
                if ($groupMap[$resolvedOrderId]['latest_pending_created_at'] === null) {
                    $groupMap[$resolvedOrderId]['latest_pending_created_at'] = $this->formatDateAtom($pendingTokenRow->created_at ?? null);
                }
            }
        }

        $allowed = 0;
        $available = 0;
        foreach ($groupMap as $orderId => &$group) {
            $group['is_primary'] = $primaryOrderId !== null && $orderId === $primaryOrderId;
            $groupAllowed = $group['eligible_for_app'] ? max(0, (int) $group['device_limit']) : 0;

            if (self::UNLIMITED_DEVICE_TEST_MODE && $group['eligible_for_app']) {
                $groupAllowed = max($groupAllowed, self::UNLIMITED_DEVICE_SENTINEL);
            }

            if ($group['eligible_for_app']) {
                $allowed += $groupAllowed;
            }

            $group['available'] = self::UNLIMITED_DEVICE_TEST_MODE && $group['eligible_for_app']
                ? self::UNLIMITED_DEVICE_SENTINEL
                : max(0, $groupAllowed - (int) $group['active'] - (int) $group['pending_tokens']);

            if ($group['eligible_for_app']) {
                $available += (int) $group['available'];
            }
        }
        unset($group);

        if (self::UNLIMITED_DEVICE_TEST_MODE && $eligibleOrderCount > 0) {
            $allowed = max($allowed, self::UNLIMITED_DEVICE_SENTINEL);
            $available = self::UNLIMITED_DEVICE_SENTINEL;
        }

        $hasActiveAccess = $eligibleOrderCount > 0;

        return [
            'allowed' => $allowed,
            'active' => $activeDevices,
            'pending_tokens' => $pendingTokens,
            'available' => $available,
            'primary_order_id' => $primaryOrderId,
            'has_active_access' => $hasActiveAccess,
            'eligible_order_count' => $eligibleOrderCount,
            'is_unlimited_test_mode' => self::UNLIMITED_DEVICE_TEST_MODE,
            'list' => $mappedDevices,
            'groups' => array_values($groupMap),
        ];
    }

    private function resolveActivationTargetGroup(array $overview, ?int $orderId): ?array
    {
        $groups = [];
        foreach ($overview['groups'] ?? [] as $group) {
            $groupId = (int) ($group['order_id'] ?? 0);
            if ($groupId < 1 || empty($group['eligible_for_app'])) {
                continue;
            }

            $groups[$groupId] = $group;
        }

        if (empty($groups)) {
            return null;
        }

        if ($orderId !== null) {
            return $groups[$orderId] ?? null;
        }

        $primaryOrderId = isset($overview['primary_order_id']) ? (int) $overview['primary_order_id'] : 0;
        if ($primaryOrderId > 0 && isset($groups[$primaryOrderId])) {
            return $groups[$primaryOrderId];
        }

        return reset($groups) ?: null;
    }

    private function resolveOverviewOrderId(int $sourceOrderId, ?int $primaryOrderId, array $knownOrderIds): ?int
    {
        if ($sourceOrderId > 0) {
            return in_array($sourceOrderId, $knownOrderIds, true)
                ? $sourceOrderId
                : null;
        }

        if ($primaryOrderId !== null && in_array($primaryOrderId, $knownOrderIds, true)) {
            return $primaryOrderId;
        }

        if (!empty($knownOrderIds)) {
            return (int) $knownOrderIds[0];
        }

        return null;
    }

    private function resolveOrderDeviceLimitMeta(\Model_ClientOrder $order, array $access): array
    {
        $configuredLimitMeta = $this->resolveConfiguredPositiveOrderDeviceLimitMeta($order);
        if ($configuredLimitMeta['value'] !== null) {
            return $configuredLimitMeta;
        }

        if (
            ($order->status ?? null) === \Model_ClientOrder::STATUS_ACTIVE
            && ($access['status'] ?? null) === self::STATUS_ACTIVE
            && !empty($access['subscription_link'])
        ) {
            return [
                'value' => 1,
                'source' => 'fallback.active_access',
            ];
        }

        return [
            'value' => 0,
            'source' => 'fallback.inactive',
        ];
    }

    private function resolveConfiguredPositiveOrderDeviceLimit(\Model_ClientOrder $order): ?int
    {
        return $this->resolveConfiguredPositiveOrderDeviceLimitMeta($order)['value'];
    }

    private function resolveConfiguredPositiveOrderDeviceLimitMeta(\Model_ClientOrder $order): array
    {
        $orderConfig = json_decode($order->config ?? '', true);
        if (!is_array($orderConfig)) {
            $orderConfig = [];
        }

        $productConfig = [];
        if (!empty($order->product_id)) {
            $product = $this->di['db']->findOne('Product', 'id = :id', [':id' => $order->product_id]);
            if ($product instanceof \Model_Product || $product instanceof OODBBean) {
                $productConfig = json_decode($product->config ?? '', true);
                if (!is_array($productConfig)) {
                    $productConfig = [];
                }
            }
        }

        $primaryKey = self::PRIMARY_DEVICE_LIMIT_KEY;
        if (isset($orderConfig[$primaryKey]) && is_numeric($orderConfig[$primaryKey]) && (int) $orderConfig[$primaryKey] > 0) {
            return [
                'value' => (int) $orderConfig[$primaryKey],
                'source' => 'order.' . $primaryKey,
            ];
        }

        if (isset($productConfig[$primaryKey]) && is_numeric($productConfig[$primaryKey]) && (int) $productConfig[$primaryKey] > 0) {
            return [
                'value' => (int) $productConfig[$primaryKey],
                'source' => 'product.' . $primaryKey,
            ];
        }

        foreach (self::DEVICE_LIMIT_KEYS as $key) {
            if ($key === $primaryKey) {
                continue;
            }

            if (isset($productConfig[$key]) && is_numeric($productConfig[$key]) && (int) $productConfig[$key] > 0) {
                return [
                    'value' => (int) $productConfig[$key],
                    'source' => 'product.' . $key,
                ];
            }
        }

        foreach (self::DEVICE_LIMIT_KEYS as $key) {
            if ($key === $primaryKey) {
                continue;
            }

            if (isset($orderConfig[$key]) && is_numeric($orderConfig[$key]) && (int) $orderConfig[$key] > 0) {
                return [
                    'value' => (int) $orderConfig[$key],
                    'source' => 'order.' . $key,
                ];
            }
        }

        return [
            'value' => null,
            'source' => null,
        ];
    }

    private function sanitizeDeviceData(array $deviceData): array
    {
        $clean = [];
        foreach (['device_name', 'platform', 'install_id'] as $field) {
            $value = isset($deviceData[$field]) ? trim((string) $deviceData[$field]) : '';
            $clean[$field] = $value !== '' ? mb_substr($value, 0, 255) : null;
        }

        return $clean;
    }

    private function ensureStorage(): void
    {
        if ($this->storageEnsured) {
            return;
        }

        $this->di['db']->exec(
            '
            CREATE TABLE IF NOT EXISTS `' . self::ACTIVATION_TOKEN_BEAN . '` (
                `id` bigint(20) NOT NULL AUTO_INCREMENT,
                `client_id` bigint(20) NOT NULL,
                `source_order_id` bigint(20) DEFAULT NULL,
                `token_hash` varchar(64) NOT NULL,
                `token_value` varchar(255) DEFAULT NULL,
                `status` varchar(32) NOT NULL DEFAULT \'' . self::STATUS_PENDING . '\',
                `expires_at` datetime NOT NULL,
                `used_at` datetime DEFAULT NULL,
                `created_at` datetime DEFAULT NULL,
                `updated_at` datetime DEFAULT NULL,
                PRIMARY KEY (`id`),
                UNIQUE KEY `uniq_token_hash` (`token_hash`),
                KEY `idx_client_status` (`client_id`, `status`),
                KEY `idx_expires_at` (`expires_at`)
            ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;
            ',
        );

        $this->di['db']->exec(
            'ALTER TABLE `' . self::ACTIVATION_TOKEN_BEAN . '`
                ADD COLUMN IF NOT EXISTS `token_value` varchar(255) DEFAULT NULL AFTER `token_hash`',
        );

        $this->di['db']->exec(
            '
            CREATE TABLE IF NOT EXISTS `' . self::DEVICE_BEAN . '` (
                `id` bigint(20) NOT NULL AUTO_INCREMENT,
                `client_id` bigint(20) NOT NULL,
                `source_order_id` bigint(20) DEFAULT NULL,
                `activation_token_id` bigint(20) DEFAULT NULL,
                `device_name` varchar(255) DEFAULT NULL,
                `platform` varchar(255) DEFAULT NULL,
                `install_id` varchar(255) DEFAULT NULL,
                `device_token_hash` varchar(64) NOT NULL,
                `status` varchar(32) NOT NULL DEFAULT \'' . self::STATUS_ACTIVE . '\',
                `expires_at` datetime NOT NULL,
                `last_seen_at` datetime DEFAULT NULL,
                `created_at` datetime DEFAULT NULL,
                `updated_at` datetime DEFAULT NULL,
                PRIMARY KEY (`id`),
                UNIQUE KEY `uniq_device_token_hash` (`device_token_hash`),
                KEY `idx_client_status` (`client_id`, `status`),
                KEY `idx_expires_at` (`expires_at`),
                KEY `idx_install_id` (`install_id`)
            ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;
            ',
        );

        $this->storageEnsured = true;
    }

    private function expireActivationTokens(?int $clientId = null): void
    {
        $params = [
            ':status_pending' => self::STATUS_PENDING,
            ':status_expired' => self::STATUS_EXPIRED,
            ':now' => $this->now(),
        ];

        $sql = 'UPDATE `' . self::ACTIVATION_TOKEN_BEAN . '`
                   SET status = :status_expired, token_value = NULL, updated_at = :now
                 WHERE status = :status_pending
                   AND expires_at < :now';

        if ($clientId !== null) {
            $sql .= ' AND client_id = :client_id';
            $params[':client_id'] = $clientId;
        }

        $this->di['db']->exec($sql, $params);
    }

    private function expireDeviceTokens(?int $clientId = null): void
    {
        $params = [
            ':status_active' => self::STATUS_ACTIVE,
            ':status_expired' => self::STATUS_EXPIRED,
            ':now' => $this->now(),
        ];

        $sql = 'UPDATE `' . self::DEVICE_BEAN . '`
                   SET status = :status_expired, updated_at = :now
                 WHERE status = :status_active
                   AND expires_at < :now';

        if ($clientId !== null) {
            $sql .= ' AND client_id = :client_id';
            $params[':client_id'] = $clientId;
        }

        $this->di['db']->exec($sql, $params);
    }

    private function revokePendingActivationTokens(int $clientId, ?int $sourceOrderId = null): void
    {
        $sql = 'UPDATE `' . self::ACTIVATION_TOKEN_BEAN . '`
                SET status = :status_revoked, token_value = NULL, updated_at = :now
              WHERE client_id = :client_id
                AND status = :status_pending';
        $params = [
            ':status_revoked' => self::STATUS_REVOKED,
            ':status_pending' => self::STATUS_PENDING,
            ':client_id' => $clientId,
            ':now' => $this->now(),
        ];
        if ($sourceOrderId !== null) {
            $sql .= ' AND source_order_id = :source_order_id';
            $params[':source_order_id'] = $sourceOrderId;
        }

        $this->di['db']->exec(
            $sql,
            $params,
        );
    }

    private function cleanupArtifactsForOrder(int $orderId): void
    {
        if ($orderId < 1) {
            return;
        }

        $now = $this->now();
        $this->di['db']->exec(
            'UPDATE `' . self::ACTIVATION_TOKEN_BEAN . '`
                SET status = :status_revoked, token_value = NULL, updated_at = :now
              WHERE source_order_id = :source_order_id
                AND status = :status_pending',
            [
                ':status_revoked' => self::STATUS_REVOKED,
                ':status_pending' => self::STATUS_PENDING,
                ':source_order_id' => $orderId,
                ':now' => $now,
            ],
        );

        $this->di['db']->exec(
            'UPDATE `' . self::DEVICE_BEAN . '`
                SET status = :status_revoked, expires_at = :now, updated_at = :now
              WHERE source_order_id = :source_order_id
                AND status = :status_active',
            [
                ':status_revoked' => self::STATUS_REVOKED,
                ':status_active' => self::STATUS_ACTIVE,
                ':source_order_id' => $orderId,
                ':now' => $now,
            ],
        );
    }

    private function findPendingActivationTokenForOrder(int $clientId, int $sourceOrderId): ?OODBBean
    {
        if ($clientId < 1 || $sourceOrderId < 1) {
            return null;
        }

        $row = $this->di['db']->findOne(
            self::ACTIVATION_TOKEN_BEAN,
            'client_id = :client_id AND source_order_id = :source_order_id AND status = :status ORDER BY created_at DESC LIMIT 1',
            [
                ':client_id' => $clientId,
                ':source_order_id' => $sourceOrderId,
                ':status' => self::STATUS_PENDING,
            ],
        );

        return $row instanceof OODBBean ? $row : null;
    }

    private function findPendingActivationTokenByToken(string $token): ?OODBBean
    {
        $normalizedToken = trim($token);
        if ($normalizedToken === '') {
            return null;
        }

        $row = $this->di['db']->findOne(
            self::ACTIVATION_TOKEN_BEAN,
            'token_hash = :token_hash AND status = :status LIMIT 1',
            [
                ':token_hash' => $this->hashToken($normalizedToken),
                ':status' => self::STATUS_PENDING,
            ],
        );

        return $row instanceof OODBBean ? $row : null;
    }

    private function findActiveDeviceByToken(string $token): ?OODBBean
    {
        $normalizedToken = trim($token);
        if ($normalizedToken === '') {
            return null;
        }

        $row = $this->di['db']->findOne(
            self::DEVICE_BEAN,
            'device_token_hash = :token_hash AND status = :status LIMIT 1',
            [
                ':token_hash' => $this->hashToken($normalizedToken),
                ':status' => self::STATUS_ACTIVE,
            ],
        );

        return $row instanceof OODBBean ? $row : null;
    }

    private function getClientById(int $clientId): ?\Model_Client
    {
        $client = $this->di['db']->findOne('Client', 'id = :id', [':id' => $clientId]);

        return $client instanceof \Model_Client ? $client : null;
    }

    private function mapDeviceRow(OODBBean $device): array
    {
        return [
            'id' => (int) $device->id,
            'name' => $device->device_name ? (string) $device->device_name : null,
            'platform' => $device->platform ? (string) $device->platform : null,
            'install_id' => $device->install_id ? (string) $device->install_id : null,
            'status' => (string) $device->status,
            'source_order_id' => $device->source_order_id ? (int) $device->source_order_id : null,
            'expires_at' => $this->formatDateAtom((string) $device->expires_at),
            'last_seen_at' => $this->formatDateAtom($device->last_seen_at ? (string) $device->last_seen_at : null),
            'created_at' => $this->formatDateAtom($device->created_at ? (string) $device->created_at : null),
        ];
    }

    private function markActivationTokenExpired(OODBBean $activationToken): void
    {
        $activationToken->status = self::STATUS_EXPIRED;
        $activationToken->updated_at = $this->now();
        $this->di['db']->store($activationToken);
    }

    private function markDeviceExpired(OODBBean $device): void
    {
        $device->status = self::STATUS_EXPIRED;
        $device->updated_at = $this->now();
        $this->di['db']->store($device);
    }

    private function generateToken(): string
    {
        return strtr(base64_encode(random_bytes(24)), '+/', '-_');
    }

    private function hashToken(string $token): string
    {
        return hash('sha256', $token);
    }

    private function now(): string
    {
        return date('Y-m-d H:i:s');
    }

    private function formatDateAtom(?string $date): ?string
    {
        if ($date === null || trim($date) === '') {
            return null;
        }

        $timestamp = strtotime($date);
        if ($timestamp === false) {
            return null;
        }

        return date(DATE_ATOM, $timestamp);
    }
}
