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

namespace Box\Mod\Appbridge\Api;

use FOSSBilling\Validation\Api\RequiredParams;

class Client extends \Api_Abstract
{
    public function bundle(array $data): array
    {
        return $this->getService()->getBundleForClient($this->getIdentity());
    }

    public function token_rotate(array $data): array
    {
        return $this->getService()->createActivationTokenBundleForClient($this->getIdentity());
    }

    public function activation_token_create(array $data): array
    {
        return $this->getService()->createActivationTokenBundleForClient($this->getIdentity());
    }

    #[RequiredParams(['id' => 'Device id required'])]
    public function device_revoke(array $data): array
    {
        return $this->getService()->revokeDeviceForClient(
            $this->getIdentity(),
            (int) $data['id'],
        );
    }
}
