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

namespace Box\Mod\Orchestrator;

use Symfony\Component\HttpClient\HttpClient;

class Service implements \FOSSBilling\InjectionAwareInterface
{
    protected ?\Pimple\Container $di = null;

    public function setDi(\Pimple\Container $di): void
    {
        $this->di = $di;
    }

    public function getDi(): ?\Pimple\Container
    {
        return $this->di;
    }

    public function getModulePermissions(): array
    {
        return [
            'manage_settings' => true,
        ];
    }

    public static function onAfterAdminOrderActivate(\Box_Event $event): void
    {
        self::dispatchOrderEvent($event, 'payment_paid');
    }

    public static function onAfterAdminOrderRenew(\Box_Event $event): void
    {
        self::dispatchOrderEvent($event, 'payment_paid');
    }

    public static function onAfterAdminOrderCancel(\Box_Event $event): void
    {
        self::dispatchOrderEvent($event, 'subscription_cancel');
    }

    public static function onAfterAdminOrderSuspend(\Box_Event $event): void
    {
        self::dispatchOrderEvent($event, 'subscription_expired');
    }

    public function assertApiKey(): void
    {
        $config = $this->getConfig();
        $expected = trim((string) ($config['billing_api_key'] ?? ''));
        if ($expected === '') {
            throw new \FOSSBilling\InformationException('Orchestrator billing API key is not configured', null, 503);
        }

        $actual = (string) $this->di['request']->headers->get('X-Api-Key', '');
        if (!hash_equals($expected, $actual)) {
            throw new \FOSSBilling\InformationException('Invalid API key', null, 401);
        }
    }

    public function updateStatus(string $externalSubscriptionId, string $status): bool
    {
        $order = $this->findOrderByExternalSubscriptionId($externalSubscriptionId);
        $this->setOrderMeta($order->id, 'orchestrator_status', $status);
        $this->setOrderMeta($order->id, 'orchestrator_last_sync_at', date('Y-m-d H:i:s'));

        return true;
    }

    public function updateSubscriptionLink(string $externalSubscriptionId, string $subscriptionLink): bool
    {
        $order = $this->findOrderByExternalSubscriptionId($externalSubscriptionId);
        $this->setOrderMeta($order->id, 'orchestrator_subscription_link', $subscriptionLink);
        $this->setOrderMeta($order->id, 'orchestrator_last_sync_at', date('Y-m-d H:i:s'));

        return true;
    }

    public function getConfig(): array
    {
        return $this->di['mod_service']('extension')->getConfig('mod_orchestrator');
    }

    private static function dispatchOrderEvent(\Box_Event $event, string $eventName): void
    {
        $params = $event->getParameters();
        $orderId = isset($params['id']) ? (int) $params['id'] : 0;
        if ($orderId <= 0) {
            return;
        }

        $service = new self();
        $service->setDi($event->getDi());

        try {
            $service->sendOrderEvent($orderId, $eventName);
        } catch (\Throwable $e) {
            $event->getDi()['logger']->error(
                'Failed to deliver Orchestrator webhook for order {order_id}: {message}',
                [
                    'order_id' => $orderId,
                    'message' => $e->getMessage(),
                ]
            );
        }
    }

    private function sendOrderEvent(int $orderId, string $eventName): void
    {
        $config = $this->getConfig();
        $enabled = !empty($config['enabled']);
        if (!$enabled) {
            return;
        }

        $webhookUrl = trim((string) ($config['orchestrator_webhook_url'] ?? ''));
        $apiKey = trim((string) ($config['orchestrator_webhook_api_key'] ?? ''));
        $signingSecret = trim((string) ($config['orchestrator_webhook_signing_secret'] ?? ''));
        if ($webhookUrl === '' || $apiKey === '' || $signingSecret === '') {
            throw new \FOSSBilling\Exception('Orchestrator webhook settings are incomplete');
        }

        $order = $this->di['db']->getExistingModelById('ClientOrder', $orderId, 'Order not found');
        $payload = $this->buildPayload($order, $eventName);
        if ($payload === null) {
            return;
        }

        $body = json_encode($payload, JSON_UNESCAPED_SLASHES | JSON_UNESCAPED_UNICODE);
        if ($body === false) {
            throw new \FOSSBilling\Exception('Could not encode Orchestrator webhook payload');
        }

        $timestamp = (string) time();
        $signature = hash_hmac('sha256', $body, $signingSecret);

        $client = HttpClient::create(['bindto' => BIND_TO]);
        $response = $client->request('POST', $webhookUrl, [
            'headers' => [
                'Content-Type' => 'application/json',
                'X-Api-Key' => $apiKey,
                'X-Timestamp' => $timestamp,
                'X-Signature' => $signature,
            ],
            'body' => $body,
        ]);

        $statusCode = $response->getStatusCode();
        if ($statusCode < 200 || $statusCode >= 300) {
            throw new \FOSSBilling\Exception(
                'Orchestrator webhook returned HTTP :status',
                [':status' => $statusCode]
            );
        }

        $this->setOrderMeta($order->id, 'orchestrator_last_event', $eventName);
        $this->setOrderMeta($order->id, 'orchestrator_last_event_id', (string) $payload['eventId']);
        $this->setOrderMeta($order->id, 'orchestrator_last_webhook_at', date('Y-m-d H:i:s'));
        $this->setOrderMeta($order->id, 'orchestrator_external_subscription_id', (string) $payload['externalSubscriptionId']);
    }

    private function buildPayload(\Model_ClientOrder $order, string $eventName): ?array
    {
        $client = $this->di['db']->getExistingModelById('Client', $order->client_id, 'Client not found');
        $product = $this->di['db']->load('Product', $order->product_id);
        $invoice = $this->findLatestPaidInvoiceForOrder($order);
        $transaction = $invoice ? $this->findLatestTransactionForInvoice($invoice->id) : null;

        $externalSubscriptionId = $this->formatExternalSubscriptionId($order->id);
        $externalUserId = sprintf('client_%d', $client->id);
        $externalOrderId = $invoice ? sprintf('invoice_%d', $invoice->id) : sprintf('order_%d', $order->id);
        $payload = [
            'event' => $eventName,
            'eventId' => $this->buildEventId($eventName, $order, $invoice, $transaction),
            'externalUserId' => $externalUserId,
            'externalSubscriptionId' => $externalSubscriptionId,
            'externalOrderId' => $externalOrderId,
            'email' => (string) $client->email,
        ];

        if ($order->expires_at) {
            $payload['expiresAt'] = date(DATE_ATOM, strtotime($order->expires_at));
        }

        if ($eventName === 'payment_paid') {
            $externalPlanId = $this->resolveExternalPlanId($order, $product instanceof \Model_Product ? $product : null);
            if ($externalPlanId === null) {
                throw new \FOSSBilling\Exception(
                    'Plan mapping is not configured for order :id',
                    [':id' => $order->id]
                );
            }

            $payload['externalPlanId'] = $externalPlanId;
            $payload['status'] = 'paid';
            $payload['externalPaymentId'] = $this->buildExternalPaymentId($order, $invoice, $transaction);
        }

        return $payload;
    }

    private function buildEventId(
        string $eventName,
        \Model_ClientOrder $order,
        ?\Model_Invoice $invoice,
        ?\Model_Transaction $transaction
    ): string {
        if ($eventName === 'payment_paid') {
            return sprintf(
                'fossbilling_%s_%d_%s',
                $eventName,
                $order->id,
                $this->buildExternalPaymentId($order, $invoice, $transaction)
            );
        }

        $stateAt = match ($eventName) {
            'subscription_cancel' => $order->canceled_at ?: $order->updated_at,
            'subscription_expired' => $order->suspended_at ?: $order->updated_at,
            default => $order->updated_at,
        };

        return sprintf(
            'fossbilling_%s_%d_%s',
            $eventName,
            $order->id,
            gmdate('YmdHis', strtotime((string) $stateAt))
        );
    }

    private function buildExternalPaymentId(
        \Model_ClientOrder $order,
        ?\Model_Invoice $invoice,
        ?\Model_Transaction $transaction
    ): string {
        if ($transaction instanceof \Model_Transaction) {
            if (!empty($transaction->txn_id)) {
                return (string) $transaction->txn_id;
            }

            return sprintf('transaction_%d', $transaction->id);
        }

        if ($invoice instanceof \Model_Invoice) {
            return sprintf('invoice_%d_paid', $invoice->id);
        }

        return sprintf('order_%d_free', $order->id);
    }

    private function resolveExternalPlanId(
        \Model_ClientOrder $order,
        ?\Model_Product $product
    ): ?string {
        $config = $this->getConfig();
        $map = $this->parsePlanMap((string) ($config['product_plan_map_json'] ?? ''));

        $orderKey = 'order:' . $order->id;
        if (isset($map[$orderKey]) && is_string($map[$orderKey]) && $map[$orderKey] !== '') {
            return $map[$orderKey];
        }

        if ($product instanceof \Model_Product) {
            $productKey = (string) $product->id;
            if (isset($map[$productKey]) && is_string($map[$productKey]) && $map[$productKey] !== '') {
                return $map[$productKey];
            }
        }

        $default = trim((string) ($config['default_external_plan_id'] ?? ''));

        return $default !== '' ? $default : null;
    }

    private function parsePlanMap(string $json): array
    {
        if (trim($json) === '') {
            return [];
        }

        $decoded = json_decode($json, true);
        if (!is_array($decoded)) {
            return [];
        }

        return $decoded;
    }

    private function findLatestPaidInvoiceForOrder(\Model_ClientOrder $order): ?\Model_Invoice
    {
        return $this->di['db']->findOne(
            'Invoice',
            'id IN (SELECT invoice_id FROM invoice_item WHERE rel_id = :rel_id) AND status = :status ORDER BY paid_at DESC, id DESC',
            [
                ':rel_id' => $order->id,
                ':status' => \Model_Invoice::STATUS_PAID,
            ]
        );
    }

    private function findLatestTransactionForInvoice(int $invoiceId): ?\Model_Transaction
    {
        $transaction = $this->di['db']->findOne(
            'Transaction',
            'invoice_id = :invoice_id AND status = :status ORDER BY id DESC',
            [
                ':invoice_id' => $invoiceId,
                ':status' => \Model_Transaction::STATUS_PROCESSED,
            ]
        );

        if ($transaction instanceof \Model_Transaction) {
            return $transaction;
        }

        $transaction = $this->di['db']->findOne(
            'Transaction',
            'invoice_id = :invoice_id ORDER BY id DESC',
            [
                ':invoice_id' => $invoiceId,
            ]
        );

        return $transaction instanceof \Model_Transaction ? $transaction : null;
    }

    private function findOrderByExternalSubscriptionId(string $externalSubscriptionId): \Model_ClientOrder
    {
        $normalized = preg_replace('/^order_/', '', trim($externalSubscriptionId));
        $orderId = is_numeric($normalized) ? (int) $normalized : 0;
        if ($orderId <= 0) {
            throw new \FOSSBilling\Exception('Unknown external subscription ID');
        }

        return $this->di['db']->getExistingModelById('ClientOrder', $orderId, 'Order not found');
    }

    private function formatExternalSubscriptionId(int $orderId): string
    {
        return sprintf('order_%d', $orderId);
    }

    private function setOrderMeta(int $orderId, string $name, string $value): void
    {
        $meta = $this->di['db']->findOne(
            'ClientOrderMeta',
            'client_order_id = :order_id AND name = :name',
            [
                ':order_id' => $orderId,
                ':name' => $name,
            ]
        );

        if (!$meta) {
            $meta = $this->di['db']->dispense('ClientOrderMeta');
            $meta->client_order_id = $orderId;
            $meta->name = $name;
            $meta->created_at = date('Y-m-d H:i:s');
        }

        $meta->value = $value;
        $meta->updated_at = date('Y-m-d H:i:s');
        $this->di['db']->store($meta);
    }
}
