#!/bin/sh
set -eu

mkdir -p /var/www/html/data/cache /var/www/html/data/log /var/www/html/data/uploads
chown -R www-data:www-data /var/www/html/data

# Keep runtime data writable for Apache/PHP and cron even when the named volume
# is recreated with restrictive defaults on the host or inside Docker.
find /var/www/html/data -type d -exec chmod 2775 {} \;
find /var/www/html/data -type f -exec chmod 0664 {} \;

cron &
exec apache2-foreground
