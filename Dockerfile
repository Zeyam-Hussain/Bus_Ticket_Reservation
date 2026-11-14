FROM node:22-alpine AS frontend

WORKDIR /app/bus_frontend
COPY bus_frontend/package.json bus_frontend/package-lock.json ./
RUN npm ci
COPY bus_frontend/ ./
RUN npm run build

FROM composer:2 AS dependencies

WORKDIR /app
COPY composer.json composer.lock ./
RUN composer install --no-dev --no-interaction --prefer-dist --optimize-autoloader

FROM php:8.3-apache-bookworm

RUN apt-get update \
    && apt-get install -y --no-install-recommends libpq-dev \
    && docker-php-ext-install pdo_pgsql \
    && a2enmod rewrite \
    && rm -rf /var/lib/apt/lists/*

WORKDIR /var/www/html
COPY . /var/www/html/
COPY --from=dependencies /app/vendor/ /var/www/html/vendor/
COPY --from=frontend /app/bus_frontend/dist/ /var/www/html/
COPY --chmod=755 docker-entrypoint.sh /usr/local/bin/docker-entrypoint.sh

ENTRYPOINT ["docker-entrypoint.sh"]
CMD ["apache2-foreground"]
EXPOSE 80
