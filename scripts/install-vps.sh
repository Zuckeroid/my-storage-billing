#!/usr/bin/env bash
set -euo pipefail

cd "$(dirname "$0")/.."

SUDO=""
if [ "$(id -u)" -ne 0 ]; then
  if command -v sudo >/dev/null 2>&1; then
    SUDO="sudo"
  else
    echo "Run this script as root or install sudo first."
    exit 1
  fi
fi

install_docker_stack() {
  if command -v docker >/dev/null 2>&1 && docker compose version >/dev/null 2>&1; then
    return
  fi

  if [ ! -r /etc/os-release ]; then
    echo "Cannot detect Linux distribution. Install Docker and Docker Compose plugin manually."
    exit 1
  fi

  # shellcheck disable=SC1091
  . /etc/os-release

  DOCKER_OS=""
  case "${ID:-}" in
    debian)
      DOCKER_OS="debian"
      ;;
    ubuntu)
      DOCKER_OS="ubuntu"
      ;;
    *)
      if echo "${ID_LIKE:-}" | grep -Eq '(^| )debian( |$)'; then
        DOCKER_OS="debian"
      else
        echo "Automatic Docker install is supported for Debian/Ubuntu VPS only."
        exit 1
      fi
      ;;
  esac

  if [ -z "${VERSION_CODENAME:-}" ]; then
    echo "Cannot detect distribution codename. Install Docker manually."
    exit 1
  fi

  echo "Installing Docker Engine and Docker Compose plugin..."
  ${SUDO} apt-get update
  ${SUDO} apt-get install -y ca-certificates curl git gnupg openssl
  ${SUDO} install -m 0755 -d /etc/apt/keyrings

  if [ ! -f /etc/apt/keyrings/docker.gpg ]; then
    curl -fsSL "https://download.docker.com/linux/${DOCKER_OS}/gpg" | ${SUDO} gpg --dearmor -o /etc/apt/keyrings/docker.gpg
    ${SUDO} chmod a+r /etc/apt/keyrings/docker.gpg
  fi

  ARCH="$(dpkg --print-architecture)"
  echo "deb [arch=${ARCH} signed-by=/etc/apt/keyrings/docker.gpg] https://download.docker.com/linux/${DOCKER_OS} ${VERSION_CODENAME} stable" | ${SUDO} tee /etc/apt/sources.list.d/docker.list >/dev/null

  ${SUDO} apt-get update
  ${SUDO} apt-get install -y docker-ce docker-ce-cli containerd.io docker-buildx-plugin docker-compose-plugin
  ${SUDO} systemctl enable --now docker >/dev/null 2>&1 || true
}

install_docker_stack

DOCKER_CMD=(docker)
if ! docker info >/dev/null 2>&1; then
  if [ -n "${SUDO}" ] && ${SUDO} docker info >/dev/null 2>&1; then
    DOCKER_CMD=(${SUDO} docker)
  else
    echo "Docker is installed, but the current user cannot access it. Run as root or add the user to the docker group."
    exit 1
  fi
fi

docker_compose() {
  "${DOCKER_CMD[@]}" compose "$@"
}

if ! docker_compose version >/dev/null 2>&1; then
  echo "Docker Compose plugin is not available."
  exit 1
fi

random_hex() {
  if command -v openssl >/dev/null 2>&1; then
    openssl rand -hex "$1"
  else
    date +%s%N | sha256sum | cut -c1-"$(( $1 * 2 ))"
  fi
}

replace_env_value() {
  local key="$1"
  local value="$2"
  sed -i "s|^${key}=.*|${key}=${value}|" .env
}

sql_escape() {
  printf "%s" "${1:-}" | sed "s/'/''/g"
}

if [ ! -f .env ]; then
  cp .env.example .env
  replace_env_value "DB_PASSWORD" "$(random_hex 24)"
  replace_env_value "DB_ROOT_PASSWORD" "$(random_hex 24)"
  replace_env_value "INFO_SALT" "$(random_hex 32)"
  replace_env_value "INSTANCE_ID" "$(random_hex 16)"
  replace_env_value "ADMIN_PASSWORD" "$(random_hex 12)"
  echo "Created .env with generated secrets. Check APP_URL and ADMIN_EMAIL before public launch."
fi

set -a
# shellcheck disable=SC1091
. ./.env
set +a

COMPANY_EMAIL="${COMPANY_EMAIL:-support@my-storage.org}"
COMPANY_PHONE="${COMPANY_PHONE:-+7 000 000-00-00}"
COMPANY_LEGAL_NAME="${COMPANY_LEGAL_NAME:-ИП Фамилия Имя Отчество}"
COMPANY_INN="${COMPANY_INN:-000000000000}"
COMPANY_OGRNIP="${COMPANY_OGRNIP:-000000000000000}"
COMPANY_ADDRESS="${COMPANY_ADDRESS:-Адрес указывается перед запуском production}"
COMPANY_BANK_NAME="${COMPANY_BANK_NAME:-Название банка}"
COMPANY_BIC="${COMPANY_BIC:-000000000}"
COMPANY_ACCOUNT_NUMBER="${COMPANY_ACCOUNT_NUMBER:-00000000000000000000}"
COMPANY_CORRESPONDENT_ACCOUNT="${COMPANY_CORRESPONDENT_ACCOUNT:-00000000000000000000}"

mkdir -p src/data/cache src/data/log src/data/uploads

cat > src/config.php <<PHP
<?php

declare(strict_types=1);

return [
    'security' => [
        'mode' => 'strict',
        'force_https' => true,
        'session_lifespan' => 7200,
        'perform_session_fingerprinting' => true,
        'debug_fingerprint' => false,
    ],
    'debug_and_monitoring' => [
        'debug' => false,
        'log_stacktrace' => true,
        'stacktrace_length' => 25,
        'report_errors' => false,
    ],
    'info' => [
        'salt' => '${INFO_SALT}',
        'instance_id' => '${INSTANCE_ID}',
    ],
    'url' => '${APP_URL}',
    'admin_area_prefix' => '/admin',
    'update_branch' => 'release',
    'maintenance_mode' => [
        'enabled' => false,
        'allowed_urls' => [],
        'allowed_ips' => [],
    ],
    'api' => [
        'allowed_ips' => [],
        'CSRFPrevention' => true,
        'require_referrer_header' => false,
        'rate_limit_whitelist' => [],
        'rate_span' => 60,
        'rate_limit' => 100,
        'rate_span_login' => 60,
        'rate_limit_login' => 20,
        'throttle_delay' => 2,
    ],
    'disable_auto_cron' => true,
    'i18n' => [
        'locale' => 'ru_RU',
        'enabled_locales' => ['en_US', 'ru_RU'],
        'timezone' => 'Europe/Moscow',
        'date_format' => 'medium',
        'time_format' => 'short',
        'datetime_pattern' => '',
    ],
    'path_data' => __DIR__ . '/data',
    'db' => [
        'driver' => 'pdo_mysql',
        'host' => 'db',
        'name' => '${DB_NAME}',
        'user' => '${DB_USER}',
        'password' => '${DB_PASSWORD}',
        'port' => '3306',
    ],
    'twig' => [
        'debug' => false,
        'auto_reload' => false,
        'cache' => __DIR__ . '/data/cache',
    ],
];
PHP

docker_compose -f docker-compose.prod.yml up -d --build

echo "Waiting for database..."
until docker_compose -f docker-compose.prod.yml exec -T db mariadb -u"${DB_USER}" -p"${DB_PASSWORD}" "${DB_NAME}" -Nse "SELECT 1" >/dev/null 2>&1; do
  sleep 2
done

TABLE_EXISTS="$(docker_compose -f docker-compose.prod.yml exec -T db mariadb -u"${DB_USER}" -p"${DB_PASSWORD}" "${DB_NAME}" -Nse "SHOW TABLES LIKE 'setting';" | tr -d '\r' || true)"

if [ -z "${TABLE_EXISTS}" ]; then
  echo "Importing FOSSBilling schema..."
  docker_compose -f docker-compose.prod.yml exec -T db mariadb --default-character-set=utf8mb4 -u"${DB_USER}" -p"${DB_PASSWORD}" "${DB_NAME}" < src/install/sql/structure.sql
  docker_compose -f docker-compose.prod.yml exec -T db mariadb --default-character-set=utf8mb4 -u"${DB_USER}" -p"${DB_PASSWORD}" "${DB_NAME}" < src/install/sql/content.sql
fi

STORAGE_PRODUCT_COUNT="$(docker_compose -f docker-compose.prod.yml exec -T db mariadb -u"${DB_USER}" -p"${DB_PASSWORD}" "${DB_NAME}" -Nse "SELECT COUNT(*) FROM product WHERE slug IN ('storage-start', 'storage-plus', 'storage-family');" | tr -d '\r')"

if [ "${STORAGE_PRODUCT_COUNT}" = "0" ]; then
  echo "Applying initial My Storage seed data..."
  docker_compose -f docker-compose.prod.yml exec -T db mariadb --default-character-set=utf8mb4 -u"${DB_USER}" -p"${DB_PASSWORD}" "${DB_NAME}" < local-demo-data.sql
else
  echo "Skipping product seed because My Storage products already exist. Existing prices and product edits are preserved."
fi

COMPANY_EMAIL_ESC="$(sql_escape "${COMPANY_EMAIL}")"
COMPANY_PHONE_ESC="$(sql_escape "${COMPANY_PHONE}")"
COMPANY_LEGAL_NAME_ESC="$(sql_escape "${COMPANY_LEGAL_NAME}")"
COMPANY_INN_ESC="$(sql_escape "${COMPANY_INN}")"
COMPANY_OGRNIP_ESC="$(sql_escape "${COMPANY_OGRNIP}")"
COMPANY_ADDRESS_ESC="$(sql_escape "${COMPANY_ADDRESS}")"
COMPANY_BANK_NAME_ESC="$(sql_escape "${COMPANY_BANK_NAME}")"
COMPANY_BIC_ESC="$(sql_escape "${COMPANY_BIC}")"
COMPANY_ACCOUNT_NUMBER_ESC="$(sql_escape "${COMPANY_ACCOUNT_NUMBER}")"
COMPANY_CORRESPONDENT_ACCOUNT_ESC="$(sql_escape "${COMPANY_CORRESPONDENT_ACCOUNT}")"

docker_compose -f docker-compose.prod.yml exec -T db mariadb --default-character-set=utf8mb4 -u"${DB_USER}" -p"${DB_PASSWORD}" "${DB_NAME}" <<SQL
INSERT INTO setting (param, value, public, created_at, updated_at)
VALUES
  ('company_email', '${COMPANY_EMAIL_ESC}', 0, NOW(), NOW()),
  ('company_tel', '${COMPANY_PHONE_ESC}', 0, NOW(), NOW()),
  ('company_address_1', '${COMPANY_ADDRESS_ESC}', 0, NOW(), NOW()),
  ('company_address_2', '${COMPANY_LEGAL_NAME_ESC}', 0, NOW(), NOW()),
  ('company_address_3', 'Корреспондентский счет: ${COMPANY_CORRESPONDENT_ACCOUNT_ESC}', 0, NOW(), NOW()),
  ('company_number', '${COMPANY_OGRNIP_ESC}', 0, NOW(), NOW()),
  ('company_vat_number', '${COMPANY_INN_ESC}', 0, NOW(), NOW()),
  ('company_bank_name', '${COMPANY_BANK_NAME_ESC}', 0, NOW(), NOW()),
  ('company_bic', '${COMPANY_BIC_ESC}', 0, NOW(), NOW()),
  ('company_account_number', '${COMPANY_ACCOUNT_NUMBER_ESC}', 0, NOW(), NOW()),
  ('hide_company_public', '0', 0, NOW(), NOW())
ON DUPLICATE KEY UPDATE value = VALUES(value), updated_at = NOW();
SQL

if [ "${INSTALL_DEMO_USER:-false}" != "true" ]; then
  docker_compose -f docker-compose.prod.yml exec -T db mariadb --default-character-set=utf8mb4 -u"${DB_USER}" -p"${DB_PASSWORD}" "${DB_NAME}" -e "DELETE FROM client WHERE email = 'test@my-storage.org';"
fi

ADMIN_COUNT="$(docker_compose -f docker-compose.prod.yml exec -T db mariadb -u"${DB_USER}" -p"${DB_PASSWORD}" "${DB_NAME}" -Nse "SELECT COUNT(*) FROM admin;" | tr -d '\r')"

if [ "${ADMIN_COUNT}" = "0" ]; then
  ADMIN_HASH="$(docker_compose -f docker-compose.prod.yml exec -T -e ADMIN_PASSWORD="${ADMIN_PASSWORD}" app php -r 'echo password_hash(getenv("ADMIN_PASSWORD"), PASSWORD_DEFAULT);')"
  ADMIN_TOKEN="$(docker_compose -f docker-compose.prod.yml exec -T app php -r 'echo bin2hex(random_bytes(32));')"
  ADMIN_EMAIL_ESC="$(printf "%s" "${ADMIN_EMAIL}" | sed "s/'/''/g")"
  ADMIN_NAME_ESC="$(printf "%s" "${ADMIN_NAME}" | sed "s/'/''/g")"

  docker_compose -f docker-compose.prod.yml exec -T db mariadb --default-character-set=utf8mb4 -u"${DB_USER}" -p"${DB_PASSWORD}" "${DB_NAME}" <<SQL
INSERT INTO admin (role, name, email, pass, protected, status, created_at, updated_at, api_token)
VALUES ('admin', '${ADMIN_NAME_ESC}', '${ADMIN_EMAIL_ESC}', '${ADMIN_HASH}', 1, 'active', NOW(), NOW(), '${ADMIN_TOKEN}');
SQL
fi

echo
echo "My Storage billing is running on local port ${APP_PORT:-8080}."
echo "Admin URL: ${APP_URL%/}/admin"
echo "Admin login: ${ADMIN_EMAIL}"
echo "Admin password is stored in .env as ADMIN_PASSWORD."
