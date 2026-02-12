FROM php:8.3-cli

# Install system deps + PDO pgsql
RUN apt-get update && apt-get install -y \
    git unzip libpq-dev \
  && docker-php-ext-install pdo pdo_pgsql \
  && rm -rf /var/lib/apt/lists/*

# Install Composer
COPY --from=composer:2 /usr/bin/composer /usr/bin/composer

WORKDIR /app

# Copy composer files first for layer caching
COPY composer.json composer.lock* /app/
RUN composer install --no-interaction --no-progress || true

# Copy the rest
COPY . /app

# Ensure deps are installed after full copy as well (handles first-run)
RUN composer install --no-interaction --no-progress

EXPOSE 8000

CMD ["php", "-S", "0.0.0.0:8000", "-t", "public"]