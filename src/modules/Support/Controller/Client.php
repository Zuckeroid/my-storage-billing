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

namespace Box\Mod\Support\Controller;

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
        $app->get('/support', 'get_tickets', [], static::class);
        $app->get('/support/ticket/:id', 'get_ticket', [], static::class);
        $app->get('/support/contact-us', 'get_contact_us', [], static::class);
        $app->get('/support/contact-us/conversation/:hash', 'get_contact_us_conversation', ['hash' => '[a-z0-9]+'], static::class);

        if ($this->di['mod']('support')->getService()->kbEnabled()) {
            $app->get('/support/kb', 'get_kb_index', [], static::class);
            $app->get('/support/kb/:category', 'get_kb_category', ['category' => '[a-z0-9-]+'], static::class);
            $app->get('/support/kb/:category/:slug', 'get_kb_article', ['category' => '[a-z0-9-]+', 'slug' => '[a-z0-9-]+'], static::class);
        }
    }

    public function get_tickets(\Box_App $app): never
    {
        $app->redirect('/contacts');
    }

    public function get_ticket(\Box_App $app, $id): never
    {
        $app->redirect('/contacts');
    }

    public function get_contact_us(\Box_App $app): never
    {
        $app->redirect('/contacts');
    }

    public function get_contact_us_conversation(\Box_App $app, $hash): never
    {
        $app->redirect('/contacts');
    }

    /*
    * Support Knowledge Base.
    */
    public function get_kb_index(\Box_App $app): never
    {
        $app->redirect('/contacts');
    }

    public function get_kb_category(\Box_App $app, $category): never
    {
        $app->redirect('/contacts');
    }

    public function get_kb_article(\Box_App $app, $category, $slug): never
    {
        $app->redirect('/contacts');
    }
}
