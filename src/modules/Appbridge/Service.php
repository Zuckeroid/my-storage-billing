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
    private const string ACTIVATION_TOKEN_BEAN = 'mod_appbridge_activation_token';
    private const string DEVICE_BEAN = 'mod_appbridge_device';
    private const int ACTIVATION_TOKEN_TTL_MINUTES = 15;
    private const int DEVICE_TOKEN_TTL_DAYS = 30;
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
        $this->expireActivationTokens();
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

    public function createActivationTokenBundleForClient(\Model_Client $client): array
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

        if ($overview['available'] < 1) {
            throw new \FOSSBilling\InformationException('No device slots are available for this account.', [], 409);
        }

        $token = $this->generateToken();
        $now = $this->now();
        $expiresAt = date('Y-m-d H:i:s', strtotime('+' . self::ACTIVATION_TOKEN_TTL_MINUTES . ' minutes'));

        $row = $this->di['db']->dispense(self::ACTIVATION_TOKEN_BEAN);
        $row->client_id = $client->id;
        $row->source_order_id = $overview['primary_order_id'];
        $row->token_hash = $this->hashToken($token);
        $row->status = self::STATUS_PENDING;
        $row->expires_at = $expiresAt;
        $row->created_at = $now;
        $row->updated_at = $now;
        $this->di['db']->store($row);

        $bundle = $this->buildAccessBundle($client);
        $bundle['activation_token'] = [
            'token' => $token,
            'expires_at' => $this->formatDateAtom($expiresAt),
            'created_at' => $this->formatDateAtom($now),
            'ttl_minutes' => self::ACTIVATION_TOKEN_TTL_MINUTES,
        ];

        return $bundle;
    }

    public function rotateTokenForClient(\Model_Client $client): array
    {
        return $this->createActivationTokenBundleForClient($client);
    }

    private function exchangeActivationToken(OODBBean $activationToken, array $deviceData): array
    {
        $client = $this->getClientById((int) $activationToken->client_id);
        if (!$client instanceof \Model_Client || $client->status !== \Model_Client::ACTIVE) {
            throw new \FOSSBilling\InformationException('Application access is not available for this account.', [], 401);
        }

        if (strtotime((string) $activationToken->expires_at) < time()) {
            $this->markActivationTokenExpired($activationToken);
            throw new \FOSSBilling\InformationException('Activation token has expired. Create a new token in the client area.', [], 401);
        }

        $overview = $this->getDeviceOverview($client, (int) $activationToken->id);
        if (!$overview['has_active_access']) {
            throw new \FOSSBilling\InformationException('No active subscription is ready for application access yet.', [], 409);
        }

        if (((int) $overview['active']) + 1 + ((int) $overview['pending_tokens']) > (int) $overview['allowed']) {
            throw new \FOSSBilling\InformationException('No device slots are available for this account.', [], 409);
        }

        $deviceToken = $this->generateToken();
        $now = $this->now();
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

        $activationToken->status = self::STATUS_USED;
        $activationToken->used_at = $now;
        $activationToken->updated_at = $now;
        $this->di['db']->store($activationToken);

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

        $app = [
            'token_expires_at' => $this->formatDateAtom($tokenExpiresAt),
            'token_issued_at' => $this->formatDateAtom($tokenIssuedAt),
            'activation_token_ttl_minutes' => self::ACTIVATION_TOKEN_TTL_MINUTES,
        ];

        if ($appToken !== null) {
            $app['token'] = $appToken;
        }

        if ($device instanceof OODBBean) {
            $app['device'] = $this->mapDeviceRow($device);
        }

        return [
            'client' => [
                'id' => (int) $client->id,
                'email' => (string) $client->email,
                'name' => trim((string) $client->getFullName()),
                'first_name' => (string) ($client->first_name ?? ''),
                'last_name' => (string) ($client->last_name ?? ''),
                'status' => (string) $client->status,
            ],
            'app' => $app,
            'has_active_access' => !empty($activeLinks),
            'active_subscription_links' => array_values($activeLinks),
            'subscriptions' => $subscriptions,
            'devices' => $overview,
            'generated_at' => date(DATE_ATOM),
        ];
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

            $deviceLimit = $this->resolveOrderDeviceLimit($order, $access);
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
                'device_limit' => $deviceLimit,
                'eligible_for_app' => $eligibleForApp,
            ];
        }

        return $subscriptions;
    }

    private function getDeviceOverview(\Model_Client $client, ?int $ignoreActivationTokenId = null): array
    {
        $subscriptions = $this->collectClientSubscriptions($client);
        $eligibleSubscriptions = array_values(array_filter(
            $subscriptions,
            static fn(array $subscription): bool => !empty($subscription['eligible_for_app']),
        ));

        $allowed = 0;
        $primaryOrderId = null;
        foreach ($eligibleSubscriptions as $subscription) {
            $primaryOrderId ??= (int) $subscription['order_id'];
            $allowed += max(0, (int) ($subscription['device_limit'] ?? 0));
        }

        $clientId = (int) $client->id;
        $activeDevices = (int) $this->di['db']->getCell(
            'SELECT COUNT(*) FROM `' . self::DEVICE_BEAN . '` WHERE client_id = :client_id AND status = :status',
            [
                ':client_id' => $clientId,
                ':status' => self::STATUS_ACTIVE,
            ],
        );

        $pendingParams = [
            ':client_id' => $clientId,
            ':status' => self::STATUS_PENDING,
        ];
        $pendingSql = 'SELECT COUNT(*) FROM `' . self::ACTIVATION_TOKEN_BEAN . '` WHERE client_id = :client_id AND status = :status';
        if ($ignoreActivationTokenId !== null) {
            $pendingSql .= ' AND id != :ignore_id';
            $pendingParams[':ignore_id'] = $ignoreActivationTokenId;
        }
        $pendingTokens = (int) $this->di['db']->getCell($pendingSql, $pendingParams);

        $deviceRows = $this->di['db']->find(
            self::DEVICE_BEAN,
            'client_id = :client_id AND status = :status ORDER BY created_at DESC',
            [
                ':client_id' => $clientId,
                ':status' => self::STATUS_ACTIVE,
            ],
        );

        $mappedDevices = [];
        foreach ($deviceRows as $deviceRow) {
            if ($deviceRow instanceof OODBBean) {
                $mappedDevices[] = $this->mapDeviceRow($deviceRow);
            }
        }

        return [
            'allowed' => $allowed,
            'active' => $activeDevices,
            'pending_tokens' => $pendingTokens,
            'available' => max(0, $allowed - $activeDevices - $pendingTokens),
            'primary_order_id' => $primaryOrderId,
            'has_active_access' => !empty($eligibleSubscriptions),
            'eligible_order_count' => count($eligibleSubscriptions),
            'activation_token_ttl_minutes' => self::ACTIVATION_TOKEN_TTL_MINUTES,
            'list' => $mappedDevices,
        ];
    }

    private function resolveOrderDeviceLimit(\Model_ClientOrder $order, array $access): int
    {
        $config = json_decode($order->config ?? '', true);
        if (!is_array($config)) {
            $config = [];
        }

        foreach (['appbridge_device_limit', 'device_limit', 'devices_limit'] as $key) {
            if (isset($config[$key]) && is_numeric($config[$key]) && (int) $config[$key] > 0) {
                return (int) $config[$key];
            }
        }

        if (!empty($order->product_id)) {
            $product = $this->di['db']->findOne('Product', 'id = :id', [':id' => $order->product_id]);
            if ($product instanceof OODBBean) {
                $productConfig = json_decode($product->config ?? '', true);
                if (!is_array($productConfig)) {
                    $productConfig = [];
                }

                foreach (['appbridge_device_limit', 'device_limit', 'devices_limit'] as $key) {
                    if (isset($productConfig[$key]) && is_numeric($productConfig[$key]) && (int) $productConfig[$key] > 0) {
                        return (int) $productConfig[$key];
                    }
                }
            }
        }

        if (
            ($order->status ?? null) === \Model_ClientOrder::STATUS_ACTIVE
            && ($access['status'] ?? null) === self::STATUS_ACTIVE
            && !empty($access['subscription_link'])
        ) {
            return 1;
        }

        return 0;
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
                   SET status = :status_expired, updated_at = :now
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
