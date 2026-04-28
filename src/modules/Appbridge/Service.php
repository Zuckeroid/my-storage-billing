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
    public const string CONTRACT_VERSION = 'appbridge-v2';
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
            return $this->loginWithDeviceToken($device, $appToken, $deviceData);
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
        $installId = $device->install_id ? trim((string) $device->install_id) : '';
        $sourceOrderId = !empty($device->source_order_id) ? (int) $device->source_order_id : null;

        if ($installId !== '') {
            $this->revokeActiveDevicesForInstall(
                (int) $client->id,
                $sourceOrderId,
                $installId,
                $now,
            );
        } else {
            $device->status = self::STATUS_REVOKED;
            $device->expires_at = $now;
            $device->updated_at = $now;
            $this->di['db']->store($device);
        }

        $this->notifyOrchestratorDeviceEvent($client, $device, 'device_revoked');

        return $this->buildAccessBundle($client);
    }

    public function updateDeviceConfigSnapshotFromOrchestrator(string $externalSubscriptionId, array $snapshot): bool
    {
        $this->ensureStorage();

        $orderId = $this->orderIdFromExternalSubscriptionId($externalSubscriptionId);
        $deviceId = isset($snapshot['device_id']) ? (int) $snapshot['device_id'] : 0;
        $installId = isset($snapshot['install_id']) ? trim((string) $snapshot['install_id']) : '';

        if ($orderId < 1 || ($deviceId < 1 && $installId === '')) {
            return false;
        }

        $params = [
            ':source_order_id' => $orderId,
        ];
        $sql = 'source_order_id = :source_order_id';

        if ($deviceId > 0) {
            $sql .= ' AND id = :device_id';
            $params[':device_id'] = $deviceId;
        } else {
            $sql .= ' AND install_id = :install_id';
            $params[':install_id'] = $installId;
        }

        $device = $this->di['db']->findOne(self::DEVICE_BEAN, $sql . ' ORDER BY id DESC LIMIT 1', $params);
        if (!$device instanceof OODBBean) {
            return false;
        }

        $encoded = json_encode($snapshot, JSON_UNESCAPED_SLASHES | JSON_UNESCAPED_UNICODE);
        if ($encoded === false) {
            throw new \FOSSBilling\Exception('Could not encode device config snapshot');
        }

        $now = $this->now();
        $device->config_snapshot = $encoded;
        $device->config_updated_at = $now;
        $device->updated_at = $now;
        $this->di['db']->store($device);

        return true;
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

        $sanitizedDeviceData = $this->sanitizeDeviceData($deviceData);
        $targetOrderId = $activationToken->source_order_id ?: $overview['primary_order_id'];
        $reusableDevice = $this->findMostRecentDeviceForInstall(
            (int) $client->id,
            $targetOrderId ? (int) $targetOrderId : null,
            $sanitizedDeviceData['install_id'],
        );

        if ($sanitizedDeviceData['install_id'] !== null) {
            $this->revokeActiveDevicesForInstall(
                (int) $client->id,
                $targetOrderId ? (int) $targetOrderId : null,
                $sanitizedDeviceData['install_id'],
                $now,
                $reusableDevice instanceof OODBBean && !empty($reusableDevice->id)
                    ? (int) $reusableDevice->id
                    : null,
            );
        }

        $deviceToken = $this->generateToken();
        $expiresAt = date('Y-m-d H:i:s', strtotime('+' . self::DEVICE_TOKEN_TTL_DAYS . ' days'));
        $device = $reusableDevice instanceof OODBBean
            ? $reusableDevice
            : $this->di['db']->dispense(self::DEVICE_BEAN);
        $device->client_id = $client->id;
        $device->source_order_id = $targetOrderId;
        $device->activation_token_id = $activationToken->id;
        $device->device_name = $sanitizedDeviceData['device_name'];
        $device->platform = $sanitizedDeviceData['platform'];
        $device->install_id = $sanitizedDeviceData['install_id'];
        $device->device_token_hash = $this->hashToken($deviceToken);
        $device->status = self::STATUS_ACTIVE;
        $device->expires_at = $expiresAt;
        $device->last_seen_at = $now;
        if (empty($device->created_at)) {
            $device->created_at = $now;
        }
        $device->updated_at = $now;
        $this->di['db']->store($device);

        $this->notifyOrchestratorDeviceEvent($client, $device, 'device_activated');

        return $this->buildAccessBundle($client, $deviceToken, $expiresAt, $now, $device);
    }

    private function loginWithDeviceToken(OODBBean $device, string $rawToken, array $deviceData = []): array
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

        $sanitizedDeviceData = $this->sanitizeDeviceData($deviceData);
        if ($sanitizedDeviceData['install_id'] !== null) {
            $storedInstallId = $device->install_id ? trim((string) $device->install_id) : '';
            if ($storedInstallId === '' || !hash_equals($storedInstallId, $sanitizedDeviceData['install_id'])) {
                $this->markDeviceRevoked($device);
                throw new \FOSSBilling\InformationException('Application token is invalid.', [], 401);
            }
        }

        if ($this->resolveActiveDeviceSubscription($client, $device) === null) {
            $this->markDeviceRevoked($device);
            throw new \FOSSBilling\InformationException('Application token is invalid.', [], 401);
        }

        $now = $this->now();
        $refreshedExpiresAt = date('Y-m-d H:i:s', strtotime('+' . self::DEVICE_TOKEN_TTL_DAYS . ' days'));
        $device->device_name = $sanitizedDeviceData['device_name'] ?? $device->device_name;
        $device->platform = $sanitizedDeviceData['platform'] ?? $device->platform;
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
        $deviceSubscription = $preferredOrderId !== null
            ? $this->findSubscriptionByOrderId($subscriptions, $preferredOrderId)
            : null;
        $activeConnections = [];

        foreach ($subscriptions as $subscription) {
            if (
                $preferredOrderId !== null
                && (int) ($subscription['order_id'] ?? 0) !== $preferredOrderId
            ) {
                continue;
            }

            if (
                ($subscription['order_status'] ?? null) === \Model_ClientOrder::STATUS_ACTIVE
                && ($subscription['provision_status'] ?? null) === self::STATUS_ACTIVE
                && !empty($subscription['connection_ready'])
            ) {
                $activeConnections[] = $subscription;
            }
        }

        $overview = $this->getDeviceOverview($client);
        $primarySubscription = $preferredOrderId !== null
            ? $deviceSubscription
            : $this->resolvePrimarySubscription($subscriptions);
        if ($device instanceof OODBBean && $primarySubscription !== null) {
            $primarySubscription = $this->applyDeviceSnapshotToSubscription($primarySubscription, $device);
        }
        $connection = $this->buildConnectionPayload($subscriptions, $primarySubscription);
        $service = $this->buildPrimaryServicePayload($primarySubscription);
        $hasActiveAccess = $preferredOrderId !== null
            ? (
                $deviceSubscription !== null
                && ($deviceSubscription['order_status'] ?? null) === \Model_ClientOrder::STATUS_ACTIVE
                && ($deviceSubscription['provision_status'] ?? null) === self::STATUS_ACTIVE
            )
            : !empty($activeConnections);

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
                'has_active_access' => $hasActiveAccess,
                'device_binding' => 'per-device-token',
                'connection_mode' => 'runtime-config-snapshot',
                'revoke_scope' => 'application-token',
            ],
            'connection' => $connection,
            'domains' => $connection['domain_bundle'] ?? null,
            'service' => $service,
            'has_active_access' => $hasActiveAccess,
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
                && !empty($subscription['connection_ready']),
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

    private function findSubscriptionByOrderId(array $subscriptions, int $orderId): ?array
    {
        if ($orderId < 1) {
            return null;
        }

        foreach ($subscriptions as $subscription) {
            if ((int) ($subscription['order_id'] ?? 0) === $orderId) {
                return $subscription;
            }
        }

        return null;
    }

    private function resolveActiveDeviceSubscription(\Model_Client $client, OODBBean $device): ?array
    {
        $sourceOrderId = !empty($device->source_order_id)
            ? (int) $device->source_order_id
            : 0;
        if ($sourceOrderId < 1) {
            return null;
        }

        $subscription = $this->findSubscriptionByOrderId(
            $this->collectClientSubscriptions($client),
            $sourceOrderId,
        );

        if ($subscription === null) {
            return null;
        }

        if (($subscription['order_status'] ?? null) !== \Model_ClientOrder::STATUS_ACTIVE) {
            return null;
        }

        if (($subscription['provision_status'] ?? null) !== self::STATUS_ACTIVE) {
            return null;
        }

        return $subscription;
    }

    private function buildConnectionPayload(array $subscriptions, ?array $primarySubscription): array
    {
        $runtimeType = null;
        $protocol = null;
        $xrayConfig = null;
        $configRevision = null;
        $nodeId = null;
        $nodeLabel = null;
        $nodeCountry = null;
        $nodeHost = null;
        $routingPolicy = null;
        $automationPolicy = null;
        $profiles = null;
        $telemetryProfile = null;
        $domainBundle = null;
        if ($primarySubscription !== null) {
            $runtimeType = isset($primarySubscription['runtime_type'])
                ? trim((string) $primarySubscription['runtime_type'])
                : null;
            $protocol = isset($primarySubscription['protocol'])
                ? trim((string) $primarySubscription['protocol'])
                : null;
            $xrayConfig = isset($primarySubscription['xray_config'])
                ? trim((string) $primarySubscription['xray_config'])
                : null;
            $configRevision = isset($primarySubscription['config_revision'])
                ? trim((string) $primarySubscription['config_revision'])
                : null;
            $nodeId = isset($primarySubscription['node_id'])
                ? trim((string) $primarySubscription['node_id'])
                : null;
            $nodeLabel = isset($primarySubscription['node_label'])
                ? trim((string) $primarySubscription['node_label'])
                : null;
            $nodeCountry = isset($primarySubscription['node_country'])
                ? trim((string) $primarySubscription['node_country'])
                : null;
            $nodeHost = isset($primarySubscription['node_host'])
                ? trim((string) $primarySubscription['node_host'])
                : null;
            $routingPolicy = isset($primarySubscription['routing_policy']) && is_array($primarySubscription['routing_policy'])
                ? $primarySubscription['routing_policy']
                : null;
            $automationPolicy = isset($primarySubscription['automation_policy']) && is_array($primarySubscription['automation_policy'])
                ? $primarySubscription['automation_policy']
                : null;
            $profiles = isset($primarySubscription['profiles']) && is_array($primarySubscription['profiles'])
                ? $primarySubscription['profiles']
                : null;
            $telemetryProfile = isset($primarySubscription['telemetry_profile']) && is_array($primarySubscription['telemetry_profile'])
                ? $primarySubscription['telemetry_profile']
                : null;
            $domainBundle = isset($primarySubscription['domain_bundle']) && is_array($primarySubscription['domain_bundle'])
                ? $primarySubscription['domain_bundle']
                : null;

            if ($runtimeType === '') {
                $runtimeType = null;
            }
            if ($protocol === '') {
                $protocol = null;
            }
            if ($xrayConfig === '') {
                $xrayConfig = null;
            }
            if ($configRevision === '') {
                $configRevision = null;
            }
            if ($nodeId === '') {
                $nodeId = null;
            }
            if ($nodeLabel === '') {
                $nodeLabel = null;
            }
            if ($nodeCountry === '') {
                $nodeCountry = null;
            }
            if ($nodeHost === '') {
                $nodeHost = null;
            }
        }

        $type = $runtimeType ?? $protocol;
        $ready = $xrayConfig !== null
            || ($primarySubscription !== null && !empty($primarySubscription['connection_ready']));
        $readyConnectionCount = count(array_filter(
            $subscriptions,
            static fn(array $subscription): bool => !empty($subscription['connection_ready']),
        ));

        return [
            'ready' => $ready,
            'type' => $type,
            'runtime_type' => $runtimeType,
            'protocol' => $protocol,
            'xray_config' => $xrayConfig,
            'payload' => $xrayConfig,
            'node_id' => $nodeId,
            'node_label' => $nodeLabel,
            'node_country' => $nodeCountry,
            'node_host' => $nodeHost,
            'routing_policy' => $routingPolicy,
            'automation_policy' => $automationPolicy,
            'profiles' => $profiles,
            'telemetry_profile' => $telemetryProfile,
            'domain_bundle' => $domainBundle,
            'domains' => $domainBundle,
            'source_order_id' => $primarySubscription['order_id'] ?? null,
            'source_title' => $primarySubscription['title'] ?? null,
            'revision' => $configRevision ?? ($ready ? hash('sha256', (string) $xrayConfig) : null),
            'available_connection_count' => $readyConnectionCount,
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
            'expires_at' => $primarySubscription['expires_at'] ?? null,
            'days_remaining' => $primarySubscription['days_remaining'] ?? null,
            'can_renew' => !empty($primarySubscription['can_renew']),
            'device_limit' => $primarySubscription['device_limit'] ?? 0,
            'device_limit_source' => $primarySubscription['device_limit_source'] ?? null,
            'eligible_for_app' => !empty($primarySubscription['eligible_for_app']),
            'last_sync_at' => $primarySubscription['last_sync_at'] ?? null,
            'access_email_sent_at' => $primarySubscription['access_email_sent_at'] ?? null,
        ];
    }

    private function applyDeviceSnapshotToSubscription(array $subscription, OODBBean $device): array
    {
        $snapshot = $this->getDeviceConfigSnapshot($device);
        if ($snapshot === null) {
            $subscription['connection_ready'] = false;
            $subscription['xray_config'] = null;

            return $subscription;
        }

        $runtimePayload = $this->extractConfigSnapshotPayload($snapshot);
        $subscription['connection_ready'] = $this->isConnectionSnapshotReady($snapshot, $runtimePayload);
        $subscription['runtime_type'] = $this->extractConfigSnapshotString($snapshot, 'runtime_type');
        $subscription['protocol'] = $this->extractConfigSnapshotString($snapshot, 'protocol');
        $subscription['config_revision'] = $this->extractConfigSnapshotString($snapshot, 'config_revision');
        $subscription['xray_config'] = $runtimePayload;
        $subscription['node_id'] = $this->extractConfigSnapshotString($snapshot, 'node_id');
        $subscription['node_label'] = $this->extractConfigSnapshotString($snapshot, 'node_label');
        $subscription['node_country'] = $this->extractConfigSnapshotString($snapshot, 'node_country');
        $subscription['node_host'] = $this->extractConfigSnapshotString($snapshot, 'node_host');
        $subscription['routing_policy'] = $this->extractConfigSnapshotArray($snapshot, 'routing_policy');
        $subscription['automation_policy'] = $this->extractConfigSnapshotArray($snapshot, 'automation_policy');
        $subscription['profiles'] = $this->extractConfigSnapshotArray($snapshot, 'profiles');
        $subscription['telemetry_profile'] = $this->extractConfigSnapshotArray($snapshot, 'telemetry_profile');
        $subscription['domain_bundle'] = $this->extractConfigSnapshotArray($snapshot, 'domain_bundle')
            ?? $this->extractConfigSnapshotArray($snapshot, 'domains');

        return $subscription;
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
            $configSnapshot = isset($access['config_snapshot']) && is_array($access['config_snapshot'])
                ? $access['config_snapshot']
                : null;
            $runtimePayload = $this->extractConfigSnapshotPayload($configSnapshot);
            $runtimeType = $this->extractConfigSnapshotString($configSnapshot, 'runtime_type');
            $protocol = $this->extractConfigSnapshotString($configSnapshot, 'protocol');
            $configRevision = $this->extractConfigSnapshotString($configSnapshot, 'config_revision');
            $nodeId = $this->extractConfigSnapshotString($configSnapshot, 'node_id');
            $nodeLabel = $this->extractConfigSnapshotString($configSnapshot, 'node_label');
            $nodeCountry = $this->extractConfigSnapshotString($configSnapshot, 'node_country');
            $nodeHost = $this->extractConfigSnapshotString($configSnapshot, 'node_host');
            $routingPolicy = $this->extractConfigSnapshotArray($configSnapshot, 'routing_policy');
            $automationPolicy = $this->extractConfigSnapshotArray($configSnapshot, 'automation_policy');
            $profiles = $this->extractConfigSnapshotArray($configSnapshot, 'profiles');
            $telemetryProfile = $this->extractConfigSnapshotArray($configSnapshot, 'telemetry_profile');
            $domainBundle = $this->extractConfigSnapshotArray($configSnapshot, 'domain_bundle')
                ?? $this->extractConfigSnapshotArray($configSnapshot, 'domains');
            $connectionReady = $this->isConnectionSnapshotReady($configSnapshot, $runtimePayload);
            $hasBridgeData =
                !empty($access['status'])
                || $configSnapshot !== null
                || !empty($access['error'])
                || !empty($access['last_sync_at']);

            if (!$hasBridgeData) {
                continue;
            }

            $deviceLimitMeta = $this->resolveOrderDeviceLimitMeta($order, $access);
            $eligibleForApp =
                ($order->status ?? null) === \Model_ClientOrder::STATUS_ACTIVE
                && ($access['status'] ?? null) === self::STATUS_ACTIVE;

            $subscriptions[] = [
                'order_id' => (int) $order->id,
                'title' => trim((string) ($order->title ?? '')),
                'order_status' => (string) $order->status,
                'provision_status' => $access['status'] ?? null,
                'expires_at' => !empty($order->expires_at) ? (string) $order->expires_at : null,
                'days_remaining' => $this->calculateDaysRemaining(!empty($order->expires_at) ? (string) $order->expires_at : null),
                'can_renew' => $this->canRenewOrder($order),
                'connection_ready' => $connectionReady,
                'runtime_type' => $runtimeType,
                'protocol' => $protocol,
                'config_revision' => $configRevision,
                'xray_config' => $runtimePayload,
                'node_id' => $nodeId,
                'node_label' => $nodeLabel,
                'node_country' => $nodeCountry,
                'node_host' => $nodeHost,
                'routing_policy' => $routingPolicy,
                'automation_policy' => $automationPolicy,
                'profiles' => $profiles,
                'telemetry_profile' => $telemetryProfile,
                'domain_bundle' => $domainBundle,
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

    private function extractConfigSnapshotString(?array $snapshot, string $key): ?string
    {
        if (!is_array($snapshot) || !isset($snapshot[$key])) {
            return null;
        }

        $value = trim((string) $snapshot[$key]);

        return $value === '' ? null : $value;
    }

    private function extractConfigSnapshotPayload(?array $snapshot): ?string
    {
        $payload = $this->extractConfigSnapshotString($snapshot, 'runtime_payload');
        if ($payload !== null) {
            return $payload;
        }

        return $this->extractConfigSnapshotString($snapshot, 'xray_config');
    }

    private function extractConfigSnapshotArray(?array $snapshot, string $key): ?array
    {
        if (!is_array($snapshot) || !isset($snapshot[$key])) {
            return null;
        }

        if (is_array($snapshot[$key])) {
            return $snapshot[$key];
        }

        if (is_string($snapshot[$key]) && trim($snapshot[$key]) !== '') {
            $decoded = json_decode($snapshot[$key], true);
            if (is_array($decoded)) {
                return $decoded;
            }
        }

        return null;
    }

    private function isConnectionSnapshotReady(?array $snapshot, ?string $runtimePayload): bool
    {
        if (is_array($snapshot) && !empty($snapshot['ready'])) {
            return true;
        }

        if ($runtimePayload !== null) {
            return true;
        }

        return false;
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
                'expires_at' => $subscription['expires_at'] ?? null,
                'days_remaining' => $subscription['days_remaining'] ?? null,
                'can_renew' => !empty($subscription['can_renew']),
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
            && (
                !empty($access['config_snapshot']['ready'])
                || !empty($access['config_snapshot']['runtime_payload'])
                || !empty($access['config_snapshot']['xray_config'])
            )
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

    private function canRenewOrder(\Model_ClientOrder $order): bool
    {
        if (empty($order->period)) {
            return false;
        }

        if (($order->status ?? null) === \Model_ClientOrder::STATUS_FAILED_RENEW) {
            return false;
        }

        return (float) ($order->price ?? 0) > 0;
    }

    private function calculateDaysRemaining(?string $expiresAt): ?int
    {
        if ($expiresAt === null || trim($expiresAt) === '') {
            return null;
        }

        $timestamp = strtotime($expiresAt);
        if ($timestamp === false) {
            return null;
        }

        return max(0, (int) ceil(($timestamp - time()) / 86400));
    }

    private function getDeviceConfigSnapshot(OODBBean $device): ?array
    {
        $raw = isset($device->config_snapshot) ? trim((string) $device->config_snapshot) : '';
        if ($raw === '') {
            return null;
        }

        $decoded = json_decode($raw, true);

        return is_array($decoded) ? $decoded : null;
    }

    private function notifyOrchestratorDeviceEvent(\Model_Client $client, OODBBean $device, string $eventName): void
    {
        if (!in_array($eventName, ['device_activated', 'device_revoked'], true)) {
            return;
        }

        try {
            $this->di['mod_service']('Orchestrator')->sendDeviceEvent($client, $device, $eventName);
        } catch (\Throwable $e) {
            $this->di['logger']->error(
                'Failed to deliver Orchestrator device event {event} for device {device_id}: {message}',
                [
                    'event' => $eventName,
                    'device_id' => isset($device->id) ? (int) $device->id : 0,
                    'message' => $e->getMessage(),
                ],
            );
        }
    }

    private function orderIdFromExternalSubscriptionId(string $externalSubscriptionId): int
    {
        $normalized = preg_replace('/^order_/', '', trim($externalSubscriptionId));

        return is_numeric($normalized) ? (int) $normalized : 0;
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
                `config_snapshot` longtext DEFAULT NULL,
                `status` varchar(32) NOT NULL DEFAULT \'' . self::STATUS_ACTIVE . '\',
                `expires_at` datetime NOT NULL,
                `last_seen_at` datetime DEFAULT NULL,
                `config_updated_at` datetime DEFAULT NULL,
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

        $this->di['db']->exec(
            'ALTER TABLE `' . self::DEVICE_BEAN . '`
                ADD COLUMN IF NOT EXISTS `config_snapshot` longtext DEFAULT NULL AFTER `device_token_hash`',
        );

        $this->di['db']->exec(
            'ALTER TABLE `' . self::DEVICE_BEAN . '`
                ADD COLUMN IF NOT EXISTS `config_updated_at` datetime DEFAULT NULL AFTER `last_seen_at`',
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

    private function revokeActiveDevicesForInstall(
        int $clientId,
        ?int $sourceOrderId,
        string $installId,
        string $now,
        ?int $exceptDeviceId = null,
    ): void {
        $normalizedInstallId = trim($installId);
        if ($clientId < 1 || $normalizedInstallId === '') {
            return;
        }

        $sql = 'UPDATE `' . self::DEVICE_BEAN . '`
                SET status = :status_revoked, expires_at = :now, updated_at = :now
              WHERE client_id = :client_id
                AND install_id = :install_id
                AND status = :status_active';
        $params = [
            ':status_revoked' => self::STATUS_REVOKED,
            ':status_active' => self::STATUS_ACTIVE,
            ':client_id' => $clientId,
            ':install_id' => $normalizedInstallId,
            ':now' => $now,
        ];

        if ($sourceOrderId !== null) {
            $sql .= ' AND source_order_id = :source_order_id';
            $params[':source_order_id'] = $sourceOrderId;
        }

        if ($exceptDeviceId !== null && $exceptDeviceId > 0) {
            $sql .= ' AND id != :except_device_id';
            $params[':except_device_id'] = $exceptDeviceId;
        }

        $this->di['db']->exec($sql, $params);
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

    private function findMostRecentDeviceForInstall(
        int $clientId,
        ?int $sourceOrderId,
        ?string $installId,
    ): ?OODBBean {
        $normalizedInstallId = $installId !== null ? trim($installId) : '';
        if ($clientId < 1 || $normalizedInstallId === '') {
            return null;
        }

        $sql = 'client_id = :client_id AND install_id = :install_id';
        $params = [
            ':client_id' => $clientId,
            ':install_id' => $normalizedInstallId,
        ];

        if ($sourceOrderId !== null) {
            $sql .= ' AND source_order_id = :source_order_id';
            $params[':source_order_id'] = $sourceOrderId;
        }

        $sql .= ' ORDER BY updated_at DESC, id DESC LIMIT 1';

        $row = $this->di['db']->findOne(self::DEVICE_BEAN, $sql, $params);

        return $row instanceof OODBBean ? $row : null;
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

    private function markDeviceRevoked(OODBBean $device): void
    {
        $now = $this->now();
        $device->status = self::STATUS_REVOKED;
        $device->expires_at = $now;
        $device->updated_at = $now;
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
