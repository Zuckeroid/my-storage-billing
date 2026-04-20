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

class Client extends \Api_Abstract
{
    #[RequiredParams(['order_id' => 'Order ID is required'])]
    public function access(array $data): array
    {
        return $this->getService()->getClientOrderAccess($this->getIdentity(), (int) $data['order_id']);
    }
}
