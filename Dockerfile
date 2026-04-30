# ============================================================
# Stage 1: Build the React Frontend
# ============================================================
FROM node:20-alpine AS frontend-builder

WORKDIR /app/bus_frontend

# Copy package files first for layer caching
COPY bus_frontend/package.json bus_frontend/package-lock.json ./

# Install all frontend dependencies
RUN npm ci

# Copy frontend source code
COPY bus_frontend/ ./

# Build production bundle (outputs to /app/bus_frontend/dist)
RUN npm run build

# ============================================================
# Stage 2: PHP + Apache Production Server
# ============================================================
FROM php:8.2-apache

# Install system dependencies & required PHP extensions
RUN apt-get update && apt-get install -y \
    libpng-dev \
    libjpeg-dev \
    libfreetype6-dev \
    libonig-dev \
    libzip-dev \
    curl \
    git \
    unzip \
    default-mysql-client \
    && docker-php-ext-configure gd --with-freetype --with-jpeg \
    && docker-php-ext-install pdo pdo_mysql gd mbstring zip \
    && a2enmod rewrite \
    && apt-get clean && rm -rf /var/lib/apt/lists/*

# Install Composer
COPY --from=composer:2 /usr/bin/composer /usr/bin/composer

# Enable Apache mod_rewrite and configure document root
ENV APACHE_DOCUMENT_ROOT /var/www/html

RUN sed -ri -e 's!/var/www/html!${APACHE_DOCUMENT_ROOT}!g' \
        /etc/apache2/sites-available/*.conf \
    && sed -ri -e 's!/var/www/!${APACHE_DOCUMENT_ROOT}!g' \
        /etc/apache2/apache2.conf /etc/apache2/conf-available/*.conf

# Allow .htaccess overrides globally
RUN sed -i '/<Directory \/var\/www\/>/,/<\/Directory>/ s/AllowOverride None/AllowOverride All/' \
    /etc/apache2/apache2.conf

# Set working directory
WORKDIR /var/www/html

# Copy PHP backend files (vendor/ excluded via .dockerignore)
COPY . .

# Install PHP dependencies (PHPMailer etc.)
RUN composer install --no-dev --optimize-autoloader --no-interaction

# Copy the built React frontend from Stage 1
COPY --from=frontend-builder /app/bus_frontend/dist ./bus_frontend/dist

# Set correct permissions
RUN chown -R www-data:www-data /var/www/html \
    && chmod -R 755 /var/www/html

# Copy entrypoint script
COPY docker-entrypoint.sh /usr/local/bin/docker-entrypoint.sh
RUN chmod +x /usr/local/bin/docker-entrypoint.sh

# Expose HTTP port
EXPOSE 80

ENTRYPOINT ["docker-entrypoint.sh"]
CMD ["apache2-foreground"]
