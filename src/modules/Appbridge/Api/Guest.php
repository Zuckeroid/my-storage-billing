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

namespace Box\Mod\AppBridge\Api;

use FOSSBilling\Validation\Api\RequiredParams;

class Guest extends \Api_Abstract
{
    #[RequiredParams(['email' => 'Email required', 'password' => 'Password required'])]
    public function login(array $data): array
    {
        return $this->getService()->loginWithPassword(
            (string) $data['email'],
            (string) $data['password'],
        );
    }

    #[RequiredParams(['app_code' => 'App code required', 'app_token' => 'App token required'])]
    public function token_login(array $data): array
    {
        return $this->getService()->loginWithToken(
            (string) $data['app_code'],
            (string) $data['app_token'],
        );
    }
}
