# ============================================================
# TROSV backend - FrankenPHP (Caddy + PHP 8.3), Debian 13 "trixie".
# Mot image cho moi vai tro: web (frankenphp), reverb, queue, scheduler,
# test (compose doi lenh). Khong con `php artisan serve` (dev server cua PHP).
# ============================================================
FROM dunglas/frankenphp:1-php8.3-trixie

# pcntl: Laravel Reverb can SIGINT/SIGTERM (reverb:start chet neu thieu).
# install-php-extensions tu cai thu vien he thong (libpq, icu, gd, ...).
RUN install-php-extensions pdo_pgsql pgsql bcmath intl zip gd pcntl opcache \
    && cp "$PHP_INI_DIR/php.ini-production" "$PHP_INI_DIR/php.ini"

COPY docker/php.ini $PHP_INI_DIR/conf.d/zz-trosv.ini
COPY docker/Caddyfile /etc/frankenphp/Caddyfile

COPY --from=composer:2 /usr/bin/composer /usr/bin/composer

WORKDIR /var/www/html

# Dependencies first so they are cached between builds.
ARG COMPOSER_FLAGS="--no-dev"
COPY composer.json composer.lock ./
RUN composer install ${COMPOSER_FLAGS} --no-interaction --prefer-dist --no-scripts

COPY . .

# bootstrap/cache must be empty here: .dockerignore excludes local *.php caches
# (they reference dev packages like laravel/pail and would crash every artisan
# command in a --no-dev image). Without this, artisan cannot even resolve providers.
RUN mkdir -p bootstrap/cache && rm -f bootstrap/cache/*.php

# Relative storage link so /storage URLs work behind APP_URL.
# No "|| true": a failure here must break the build, not hide a broken image.
RUN php artisan storage:link --relative --force

# Chay bang www-data (khong root). Caddy ghi data/config vao /tmp; frankenphp
# bo capability bind port <1024 (khong can: lang nghe 8000).
# Chi thu muc ghi duoc moi chown: code va vendor de root-owned, chi doc.
ENV XDG_DATA_HOME=/tmp/caddy-data \
    XDG_CONFIG_HOME=/tmp/caddy-config
RUN setcap -r /usr/local/bin/frankenphp \
    && mkdir -p storage/app/public storage/framework/cache storage/framework/sessions \
        storage/framework/views storage/logs \
    && chown www-data:www-data /var/www/html \
    && chown -R www-data:www-data storage bootstrap/cache \
    && chown -h www-data:www-data public/storage
USER 33:33

EXPOSE 8000

# Image goc cua FrankenPHP co HEALTHCHECK goi admin API cua Caddy (:2019) - da tat
# (admin off) va cac service khac (queue, scheduler, reverb) khong phai web server.
# Compose khai bao healthcheck rieng cho backend va reverb.
HEALTHCHECK NONE

# Web server. Cac service khac (reverb, queue, scheduler) ghi de bang `command:`.
CMD ["--config", "/etc/frankenphp/Caddyfile", "--adapter", "caddyfile"]
