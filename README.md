# My Storage Billing

Локальный форк FOSSBilling для публичного сайта, личного кабинета и приема оплат My Storage.

Внутри уже зафиксированы:

- публичный сайт в стиле файлового менеджера;
- личный кабинет клиента на базе FOSSBilling;
- тарифы Storage Start, Storage Plus и Storage Family;
- страницы оферты, оплаты, возврата, контактов и политики конфиденциальности;
- русская/английская локализация как целевые языки;
- локальный Docker-стенд для разработки;
- production Docker-сборка и первичный скрипт установки на VPS.

## Локальный запуск

```bash
docker compose -f docker-compose.local.yml up -d --build
```

Локально сайт открывается на `http://localhost:8090`.

Тестовый клиент для демо-стенда:

- email: `test@my-storage.org`
- password: `Test12345!`

## Установка на VPS

1. Склонировать репозиторий на VPS.
2. Скопировать `.env.example` в `.env` или запустить скрипт, он создаст `.env` сам.
3. Проверить в `.env` минимум `APP_URL`, `ADMIN_EMAIL`, `ADMIN_PASSWORD` и блок `COMPANY_*`.
4. Запустить:

```bash
bash scripts/install-vps.sh
```

На чистом Debian/Ubuntu VPS скрипт сам установит Docker Engine, Docker Buildx и Docker Compose plugin. Для этого запуск должен быть от `root` или от пользователя с `sudo`.

По умолчанию приложение слушает только `127.0.0.1:${APP_PORT}`. Снаружи его лучше открывать через Nginx или Caddy с HTTPS.

## Реквизиты

Реальные юридические данные и банковские реквизиты не хранятся в шаблонах. Для production они задаются в `.env`:

- `COMPANY_LEGAL_NAME`
- `COMPANY_INN`
- `COMPANY_OGRNIP`
- `COMPANY_ADDRESS`
- `COMPANY_BANK_NAME`
- `COMPANY_BIC`
- `COMPANY_ACCOUNT_NUMBER`
- `COMPANY_CORRESPONDENT_ACCOUNT`
- `COMPANY_EMAIL`
- `COMPANY_PHONE`

Скрипт `scripts/install-vps.sh` переносит эти значения в настройки FOSSBilling. Публичные страницы читают их из `guest.system_company`.

## Важные файлы

- `Dockerfile.prod` - production image с PHP, Composer-зависимостями и собранными assets.
- `docker-compose.prod.yml` - app + MariaDB для VPS.
- `scripts/install-vps.sh` - первичная установка, импорт схемы, seed тарифов и создание администратора.
- `local-demo-data.sql` - настройки My Storage, тарифы и демо-клиент для локального стенда.
- `src/config.php` - локальный/серверный конфиг, не хранится в git.

## Upstream

Основа проекта - FOSSBilling под лицензией Apache 2.0. Upstream-репозиторий сохраняется отдельным remote `upstream`, чтобы при необходимости забирать обновления вручную.
