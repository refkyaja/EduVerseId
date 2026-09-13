#!/bin/bash
set -e

# Update Apache port if Render provides dynamic PORT env
if [ -n "$PORT" ]; then
    sed -i "s/80/$PORT/g" /etc/apache2/sites-available/000-default.conf /etc/apache2/ports.conf
fi

# Ensure storage link exists
php artisan storage:link || true

# If using sqlite and file does not exist, create it
if [ "$DB_CONNECTION" = "sqlite" ]; then
    touch /var/www/html/database/database.sqlite
    chown -R www-data:www-data /var/www/html/database
    chmod -R 775 /var/www/html/database
fi

# Run database migrations and seed
echo "Running migrations..."
php artisan config:clear
php artisan migrate --force

echo "Running seeders..."
php artisan db:seed --force || true

# Cache configurations for maximum performance in production
php artisan config:cache
php artisan route:cache
php artisan view:cache

echo "Starting Apache server..."
exec apache2-foreground