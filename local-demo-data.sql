INSERT INTO setting (`param`, `value`, `public`, `created_at`, `updated_at`)
VALUES
  ('company_name', 'My Storage', 0, NOW(), NOW()),
  ('company_email', 'support@my-storage.org', 0, NOW(), NOW()),
  ('company_tel', '+7 000 000-00-00', 0, NOW(), NOW()),
  ('company_signature', 'Personal cloud storage for documents, photos, and important files.', 0, NOW(), NOW()),
  ('company_address_1', 'Адрес указывается перед запуском production', 0, NOW(), NOW()),
  ('company_address_2', 'ИП Фамилия Имя Отчество', 0, NOW(), NOW()),
  ('company_address_3', 'Корреспондентский счет указывается перед запуском production', 0, NOW(), NOW()),
  ('company_number', '000000000000000', 0, NOW(), NOW()),
  ('company_vat_number', '000000000000', 0, NOW(), NOW()),
  ('company_note', 'My Storage - личное облачное хранилище для документов, фотографий и важных файлов.', 0, NOW(), NOW()),
  ('company_bank_name', 'Название банка', 0, NOW(), NOW()),
  ('company_bic', '000000000', 0, NOW(), NOW()),
  ('company_account_number', '00000000000000000000', 0, NOW(), NOW()),
  ('company_bank_info_pagebottom', '1', 0, NOW(), NOW()),
  ('hide_company_public', '0', 0, NOW(), NOW()),
  ('company_tos', 'Публичная оферта и пользовательское соглашение опубликованы на сайте My Storage. Услуга предназначена для личного облачного хранения файлов. Инструкции направляются на email клиента после оплаты.', 0, NOW(), NOW()),
  ('company_privacy_policy', 'My Storage обрабатывает email, данные аккаунта, сведения о заказах и платежах для регистрации, приема оплаты, оказания услуги и поддержки клиентов.', 0, NOW(), NOW())
ON DUPLICATE KEY UPDATE `value` = VALUES(`value`), `updated_at` = NOW();
UPDATE currency SET title = 'Russian Ruble', code = 'RUB', format = '{{price}} ₽' WHERE id = 1;
UPDATE extension SET status = 'disabled' WHERE name = 'branding';

DELETE FROM product WHERE id IN (101, 102, 103);
DELETE FROM product_payment WHERE id IN (101, 102, 103);

INSERT INTO product_payment (`id`, `type`, `once_price`, `once_setup_price`, `w_price`, `m_price`, `q_price`, `b_price`, `a_price`, `bia_price`, `tria_price`, `w_setup_price`, `m_setup_price`, `q_setup_price`, `b_setup_price`, `a_setup_price`, `bia_setup_price`, `tria_setup_price`, `w_enabled`, `m_enabled`, `q_enabled`, `b_enabled`, `a_enabled`, `bia_enabled`, `tria_enabled`)
VALUES
  (101, 'recurrent', 0.00, 0.00, 0.00, 290.00, 0.00, 0.00, 0.00, 0.00, 0.00, 0.00, 0.00, 0.00, 0.00, 0.00, 0.00, 0.00, 0, 1, 0, 0, 0, 0, 0),
  (102, 'recurrent', 0.00, 0.00, 0.00, 790.00, 0.00, 0.00, 0.00, 0.00, 0.00, 0.00, 0.00, 0.00, 0.00, 0.00, 0.00, 0.00, 0, 1, 0, 0, 0, 0, 0),
  (103, 'recurrent', 0.00, 0.00, 0.00, 1190.00, 0.00, 0.00, 0.00, 0.00, 0.00, 0.00, 0.00, 0.00, 0.00, 0.00, 0.00, 0.00, 0, 1, 0, 0, 0, 0, 0);

INSERT INTO product (`id`, `product_category_id`, `product_payment_id`, `form_id`, `title`, `slug`, `description`, `unit`, `active`, `status`, `hidden`, `is_addon`, `setup`, `addons`, `icon_url`, `allow_quantity_select`, `stock_control`, `quantity_in_stock`, `plugin`, `plugin_config`, `upgrades`, `priority`, `config`, `created_at`, `updated_at`, `type`)
VALUES
  (101, 1, 101, NULL, 'Storage Start', 'storage-start', '50 GB for personal files. Protected file access for 1 device. Instructions are sent by email after payment.', 'product', 1, 'enabled', 0, 0, 'after_payment', NULL, NULL, 0, 0, 0, NULL, NULL, NULL, 1, NULL, NOW(), NOW(), 'custom'),
  (102, 1, 102, NULL, 'Storage Plus', 'storage-plus', '200 GB for personal files. Protected file access for 3 devices. Instructions are sent by email after payment.', 'product', 1, 'enabled', 0, 0, 'after_payment', NULL, NULL, 0, 0, 0, NULL, NULL, NULL, 2, NULL, NOW(), NOW(), 'custom'),
  (103, 1, 103, NULL, 'Storage Family', 'storage-family', '500 GB for personal files. Protected file access for 5 devices. Instructions are sent by email after payment.', 'product', 1, 'enabled', 0, 0, 'after_payment', NULL, NULL, 0, 0, 0, NULL, NULL, NULL, 3, NULL, NOW(), NOW(), 'custom');

DELETE FROM client WHERE email = 'test@my-storage.org';
INSERT INTO client (`client_group_id`, `role`, `auth_type`, `email`, `pass`, `status`, `email_approved`, `tax_exempt`, `type`, `first_name`, `last_name`, `phone_cc`, `phone`, `currency`, `lang`, `ip`, `created_at`, `updated_at`)
VALUES (1, 'client', 'email', 'test@my-storage.org', '$2y$12$viNoD35ChkPwbOGMnKc30eUXJIB0YPuEyFH8JcJ.iW3AobLP02hOm', 'active', 1, 0, 'individual', 'Test', 'Client', '+7', '9261557792', 'RUB', 'ru_RU', '127.0.0.1', NOW(), NOW());
