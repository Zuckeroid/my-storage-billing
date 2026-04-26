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

class Service implements \FOSSBilling\InjectionAwareInterface
{
    private const string EXTENSION_NAME = 'mod_appbridge';
    private const string META_APP_CODE = 'app_code';
    private const string META_TOKEN_HASH = 'app_token_hash';
    private const string META_TOKEN_EXPIRES_AT = 'app_token_expires_at';
    private const string META_TOKEN_LAST_ISSUED_AT = 'app_token_last_issued_at';
    private const int TOKEN_TTL_DAYS = 30;
    private const string CODE_ALPHABET = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789';

    protected ?\Pimple\Container $di = null;

    public function setDi(\Pimple\Container $di): void
    {
        $this->di = $di;
    }

    public function getDi(): ?\Pimple\Container
    {
        return $this->di;
    }

    public function loginWithPassword(string $email, string $password): array
    {
        $clientService = $this->di['mod_service']('Client');
        $email = strtolower(trim($this->di['tools']->validateAndSanitizeEmail($email, true, false)));
        $client = $clientService->authorizeClient($email, $password);

        if (!$client instanceof \Model_Client) {
            throw new \FOSSBilling\InformationException('Please check your login details.', [], 401);
        }

        $bundle = $this->rotateTokenForClient($client);
        $this->di['logger']->info('App bridge issued token for client #%s', $client->id);

        return $bundle;
    }

    public function loginWithToken(string $appToken): array
    {
        $client = $this->findClientByToken($appToken);
        if (!$client instanceof \Model_Client || $client->status !== \Model_Client::ACTIVE) {
            throw new \FOSSBilling\InformationException('Application access is not available for this account.', [], 401);
        }

        $storedHash = $this->getClientMetaValue((int) $client->id, self::META_TOKEN_HASH);
        $expiresAt = $this->getClientMetaValue((int) $client->id, self::META_TOKEN_EXPIRES_AT);
        if ($storedHash === null || $expiresAt === null) {
            throw new \FOSSBilling\InformationException('Application token is not initialized. Please log in again.', [], 401);
        }

        if (!hash_equals($storedHash, $this->hashToken($appToken))) {
            throw new \FOSSBilling\InformationException('Application token is invalid.', [], 401);
        }

        if (strtotime($expiresAt) < time()) {
            throw new \FOSSBilling\InformationException('Application token has expired. Please log in again.', [], 401);
        }

        $refreshedExpiresAt = $this->refreshTokenExpiry((int) $client->id);

        return $this->buildAccessBundle($client, null, $refreshedExpiresAt);
    }

    public function getBundleForClient(\Model_Client $client): array
    {
        $appCode = $this->ensureAppCode((int) $client->id);
        $expiresAt = $this->getClientMetaValue((int) $client->id, self::META_TOKEN_EXPIRES_AT);

        return $this->buildAccessBundle($client, null, $expiresAt, $appCode);
    }

    public function rotateTokenForClient(\Model_Client $client): array
    {
        [$appCode, $token, $expiresAt] = $this->issueClientToken((int) $client->id);

        return $this->buildAccessBundle($client, $token, $expiresAt, $appCode);
    }

    private function buildAccessBundle(
        \Model_Client $client,
        ?string $appToken = null,
        ?string $tokenExpiresAt = null,
        ?string $appCode = null,
    ): array {
        $appCode = $appCode ?? $this->ensureAppCode((int) $client->id);
        $subscriptions = $this->collectClientSubscriptions($client);
        $activeLinks = [];

        foreach ($subscriptions as $subscription) {
            if (
                ($subscription['order_status'] ?? null) === \Model_ClientOrder::STATUS_ACTIVE
                && ($subscription['provision_status'] ?? null) === 'active'
                && !empty($subscription['subscription_link'])
            ) {
                $activeLinks[] = $subscription['subscription_link'];
            }
        }

        $app = [
            'code' => $appCode,
            'token_expires_at' => $this->formatDateAtom($tokenExpiresAt),
            'token_issued_at' => $this->formatDateAtom(
                $this->getClientMetaValue((int) $client->id, self::META_TOKEN_LAST_ISSUED_AT),
            ),
        ];

        if ($appToken !== null) {
            $app['token'] = $appToken;
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

            $subscriptions[] = [
                'order_id' => (int) $order->id,
                'title' => trim((string) ($order->title ?? '')),
                'order_status' => (string) $order->status,
                'provision_status' => $access['status'] ?? null,
                'subscription_link' => $access['subscription_link'] ?? null,
                'error' => $access['error'] ?? null,
                'last_sync_at' => $this->formatDateAtom($access['last_sync_at'] ?? null),
                'access_email_sent_at' => $this->formatDateAtom($access['access_email_sent_at'] ?? null),
            ];
        }

        return $subscriptions;
    }

    private function issueClientToken(int $clientId): array
    {
        $appCode = $this->ensureAppCode($clientId);
        $token = $this->generateAccessToken();
        $expiresAt = date('Y-m-d H:i:s', strtotime('+' . self::TOKEN_TTL_DAYS . ' days'));
        $issuedAt = date('Y-m-d H:i:s');

        $this->setClientMeta($clientId, self::META_TOKEN_HASH, $this->hashToken($token));
        $this->setClientMeta($clientId, self::META_TOKEN_EXPIRES_AT, $expiresAt);
        $this->setClientMeta($clientId, self::META_TOKEN_LAST_ISSUED_AT, $issuedAt);

        return [$appCode, $token, $expiresAt];
    }

    private function refreshTokenExpiry(int $clientId): string
    {
        $expiresAt = date('Y-m-d H:i:s', strtotime('+' . self::TOKEN_TTL_DAYS . ' days'));
        $this->setClientMeta($clientId, self::META_TOKEN_EXPIRES_AT, $expiresAt);

        return $expiresAt;
    }

    private function ensureAppCode(int $clientId): string
    {
        $existing = $this->getClientMetaValue($clientId, self::META_APP_CODE);
        if ($existing !== null) {
            return $existing;
        }

        for ($attempt = 0; $attempt < 20; $attempt++) {
            $code = $this->generatePublicCode();
            if ($this->findClientIdByAppCode($code) === null) {
                $this->setClientMeta($clientId, self::META_APP_CODE, $code);

                return $code;
            }
        }

        throw new \FOSSBilling\Exception('Unable to generate a unique application code');
    }

    private function findClientByAppCode(string $appCode): ?\Model_Client
    {
        $clientId = $this->findClientIdByAppCode($appCode);
        if ($clientId === null) {
            return null;
        }

        $client = $this->di['db']->findOne('Client', 'id = :id', [':id' => $clientId]);

        return $client instanceof \Model_Client ? $client : null;
    }

    private function findClientByToken(string $appToken): ?\Model_Client
    {
        $clientId = $this->findClientIdByToken($appToken);
        if ($clientId === null) {
            return null;
        }

        $client = $this->di['db']->findOne('Client', 'id = :id', [':id' => $clientId]);

        return $client instanceof \Model_Client ? $client : null;
    }

    private function findClientIdByAppCode(string $appCode): ?int
    {
        $normalizedCode = strtoupper(trim($appCode));
        if ($normalizedCode === '') {
            return null;
        }

        $row = $this->di['db']->getRow(
            'SELECT client_id
               FROM extension_meta
              WHERE extension = :extension
                AND meta_key = :meta_key
                AND meta_value = :meta_value
              LIMIT 1',
            [
                ':extension' => self::EXTENSION_NAME,
                ':meta_key' => self::META_APP_CODE,
                ':meta_value' => $normalizedCode,
            ],
        );

        if (!is_array($row) || empty($row['client_id'])) {
            return null;
        }

        return (int) $row['client_id'];
    }

    private function findClientIdByToken(string $appToken): ?int
    {
        $normalizedToken = trim($appToken);
        if ($normalizedToken === '') {
            return null;
        }

        $row = $this->di['db']->getRow(
            'SELECT client_id
               FROM extension_meta
              WHERE extension = :extension
                AND meta_key = :meta_key
                AND meta_value = :meta_value
              LIMIT 1',
            [
                ':extension' => self::EXTENSION_NAME,
                ':meta_key' => self::META_TOKEN_HASH,
                ':meta_value' => $this->hashToken($normalizedToken),
            ],
        );

        if (!is_array($row) || empty($row['client_id'])) {
            return null;
        }

        return (int) $row['client_id'];
    }

    private function setClientMeta(int $clientId, string $key, string $value): void
    {
        $meta = $this->di['db']->findOne(
            'ExtensionMeta',
            'extension = :extension AND client_id = :client_id AND meta_key = :meta_key',
            [
                ':extension' => self::EXTENSION_NAME,
                ':client_id' => $clientId,
                ':meta_key' => $key,
            ],
        );

        if (!$meta) {
            $meta = $this->di['db']->dispense('ExtensionMeta');
            $meta->extension = self::EXTENSION_NAME;
            $meta->client_id = $clientId;
            $meta->meta_key = $key;
            $meta->created_at = date('Y-m-d H:i:s');
        }

        $meta->meta_value = $value;
        $meta->updated_at = date('Y-m-d H:i:s');
        $this->di['db']->store($meta);
    }

    private function getClientMetaValue(int $clientId, string $key): ?string
    {
        $meta = $this->di['db']->findOne(
            'ExtensionMeta',
            'extension = :extension AND client_id = :client_id AND meta_key = :meta_key',
            [
                ':extension' => self::EXTENSION_NAME,
                ':client_id' => $clientId,
                ':meta_key' => $key,
            ],
        );

        if (!$meta || !isset($meta->meta_value)) {
            return null;
        }

        $value = trim((string) $meta->meta_value);

        return $value !== '' ? $value : null;
    }

    private function generatePublicCode(): string
    {
        $chars = [];
        $alphabetLength = strlen(self::CODE_ALPHABET);

        for ($index = 0; $index < 12; $index++) {
            $chars[] = self::CODE_ALPHABET[random_int(0, $alphabetLength - 1)];
        }

        return implode('-', [
            implode('', array_slice($chars, 0, 4)),
            implode('', array_slice($chars, 4, 4)),
            implode('', array_slice($chars, 8, 4)),
        ]);
    }

    private function generateAccessToken(): string
    {
        return strtr(base64_encode(random_bytes(24)), '+/', '-_');
    }

    private function hashToken(string $token): string
    {
        return hash('sha256', $token);
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
