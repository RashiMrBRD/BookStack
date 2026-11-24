# IoTLab Docs — BookStack fork, built from this repository's source.
# Release-branch assets are prebuilt (public/dist), so no Node stage is needed.

# --- Composer dependencies ---
FROM composer:2 AS vendor
WORKDIR /app
COPY composer.json composer.lock ./
RUN composer install --no-dev --no-scripts --no-interaction --prefer-dist --ignore-platform-reqs
COPY . .
RUN composer dump-autoload --optimize --no-dev

# --- Runtime ---
FROM php:8.3-apache-bookworm

# BookStack-required extensions: gd, zip, pdo_mysql, exif, opcache.
# (curl/dom/fileinfo/mbstring/xml are compiled into the base image.)
RUN apt-get update \
    && apt-get install -y --no-install-recommends \
        curl \
        libpng-dev libjpeg62-turbo-dev libfreetype6-dev libzip-dev \
    && docker-php-ext-configure gd --with-freetype --with-jpeg \
    && docker-php-ext-install -j"$(nproc)" gd zip pdo_mysql exif opcache \
    && a2enmod rewrite headers \
    && rm -rf /var/lib/apt/lists/*

# Serve the app from public/
ENV APACHE_DOCUMENT_ROOT=/var/www/html/public
RUN sed -ri -e 's!/var/www/html!${APACHE_DOCUMENT_ROOT}!g' /etc/apache2/sites-available/*.conf \
    && sed -ri -e 's!/var/www/!${APACHE_DOCUMENT_ROOT}!g' /etc/apache2/apache2.conf /etc/apache2/conf-available/*.conf

WORKDIR /var/www/html
COPY --from=vendor /app/vendor ./vendor
COPY . .

COPY iotdocs/entrypoint.sh /usr/local/bin/iotdocs-entrypoint.sh
RUN chmod +x /usr/local/bin/iotdocs-entrypoint.sh \
    && mkdir -p storage/framework/cache storage/framework/sessions storage/framework/views bootstrap/cache public/uploads \
    && chown -R www-data:www-data storage bootstrap/cache public/uploads

EXPOSE 80
ENTRYPOINT ["iotdocs-entrypoint.sh"]
CMD ["apache2-foreground"]
