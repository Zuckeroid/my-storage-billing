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

namespace Box\Mod\Orchestrator\Api;

use FOSSBilling\Validation\Api\RequiredParams;

class Guest extends \Api_Abstract
{
    public function ping(array $data): array
    {
        $this->getService()->assertApiKey();

        return [
            'status' => 'ok',
            'service' => 'fossbilling',
            'module' => 'orchestrator',
            'checked_at' => date(DATE_ATOM),
        ];
    }

    #[RequiredParams([
        'external_subscription_id' => 'External subscription ID is required',
        'status' => 'Status is required',
    ])]
    public function update_status(array $data): bool
    {
        $this->getService()->assertApiKey();

        return $this->getService()->updateStatus(
            (string) $data['external_subscription_id'],
            (string) $data['status'],
            isset($data['error']) ? (string) $data['error'] : null,
        );
    }

    #[RequiredParams([
        'external_subscription_id' => 'External subscription ID is required',
        'subscription_link' => 'Subscription link is required',
    ])]
    public function update_subscription(array $data): bool
    {
        $this->getService()->assertApiKey();

        return $this->getService()->updateSubscriptionLink(
            (string) $data['external_subscription_id'],
            (string) $data['subscription_link'],
        );
    }

    #[RequiredParams([
        'external_subscription_id' => 'External subscription ID is required',
        'config_snapshot' => 'Config snapshot is required',
    ])]
    public function update_device_config(array $data): bool
    {
        $this->getService()->assertApiKey();

        if (!is_array($data['config_snapshot'])) {
            throw new \FOSSBilling\InformationException('Config snapshot must be an object', null, 400);
        }

        return $this->getService()->updateDeviceConfig(
            (string) $data['external_subscription_id'],
            $data['config_snapshot'],
        );
    }
}
