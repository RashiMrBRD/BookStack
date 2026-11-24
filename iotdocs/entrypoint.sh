#!/bin/sh
# IoTLab Docs container bootstrap.
# APP_KEY and all secrets arrive via environment (compose env_file) — nothing
# deployment-specific is baked into this image.
set -e
cd /var/www/html

mkdir -p storage/framework/{cache,sessions,views} bootstrap/cache public/uploads
chown -R www-data:www-data storage bootstrap/cache public/uploads

# DB schema is managed here so `compose up` alone is sufficient after rebuilds.
php artisan migrate --force --no-interaction
php artisan config:cache

exec "$@"
