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

namespace Box\Mod\Redirect\Controller;

class Client implements \FOSSBilling\InjectionAwareInterface
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

    public function register(\Box_App &$app): void
    {
        $app->get('/me', 'redirect_profile', [], static::class);
        $app->get('/balance', 'redirect_balance', [], static::class);
        $app->get('/reset-password-confirm/:hash', 'get_reset_password_confirm', ['hash' => '[a-z0-9]+'], '\\' . \Box\Mod\Client\Controller\Client::class);
        $app->get('/emails', 'get_emails', [], '\\' . \Box\Mod\Email\Controller\Client::class);
        $app->get('/banklink/:hash/:id', 'get_banklink', ['id' => '[0-9]+', 'hash' => '[a-z0-9]+'], '\\' . \Box\Mod\Invoice\Controller\Client::class);
        $app->get('/pricing', 'redirect_plans', [], static::class);
        $app->get('/blog', 'redirect_home', [], static::class);
        $app->get('/blog/:slug', 'redirect_home', ['slug' => '[a-z0-9-]+'], static::class);
        $app->get('/service', 'get_orders', [], '\\' . \Box\Mod\Order\Controller\Client::class);
        $app->get('/service/manage/:id', 'get_order', ['id' => '[0-9]+'], '\\' . \Box\Mod\Order\Controller\Client::class);
        $app->get('/contact-us', 'redirect_contacts', [], static::class);
        $app->get('/contact-us/conversation/:hash', 'redirect_contacts', ['hash' => '[a-z0-9]+'], static::class);

        $service = $this->di['mod_service']('redirect');
        $redirects = $service->getRedirects();
        foreach ($redirects as $redirect) {
            $app->get('/' . $redirect['path'], 'do_redirect', [], static::class);
        }
    }

    public function do_redirect(\Box_App $app): never
    {
        $service = $this->di['mod_service']('redirect');
        $target = $service->getRedirectByPath($app->uri);
        header('HTTP/1.1 301 Moved Permanently');
        header('Location: ' . $target);
        exit;
    }

    public function redirect_home(\Box_App $app, ...$args): never
    {
        $app->redirect('/');
    }

    public function redirect_contacts(\Box_App $app, ...$args): never
    {
        $app->redirect('/contacts');
    }

    public function redirect_plans(\Box_App $app): never
    {
        $app->redirect('/#plans');
    }

    public function redirect_profile(\Box_App $app): never
    {
        $app->redirect('/client/profile');
    }

    public function redirect_balance(\Box_App $app): never
    {
        $app->redirect('/client/balance');
    }
}
