#!/bin/bash
set -e

echo "======================================"
echo "  Bus Reservation System - Starting"
echo "======================================"

# ── Wait for MySQL to be ready ──────────────────────────────
echo "[1/3] Waiting for MySQL at ${DB_HOST}:3306..."
max_tries=30
count=0
until mysqladmin ping -h"${DB_HOST}" -u"${DB_USER}" -p"${DB_PASS}" --silent 2>/dev/null; do
    count=$((count + 1))
    if [ "$count" -ge "$max_tries" ]; then
        echo "ERROR: MySQL did not become ready in time. Exiting."
        exit 1
    fi
    echo "  ...still waiting ($count/$max_tries)"
    sleep 2
done
echo "  MySQL is ready!"

# ── Import database dump if DB is empty ─────────────────────
echo "[2/3] Checking database..."
TABLE_COUNT=$(mysql -h"${DB_HOST}" -u"${DB_USER}" -p"${DB_PASS}" "${DB_NAME}" \
    -se "SELECT COUNT(*) FROM information_schema.tables WHERE table_schema='${DB_NAME}';" 2>/dev/null || echo "0")

if [ "$TABLE_COUNT" -eq "0" ]; then
    echo "  Database is empty. Importing schema from db_dump.sql..."
    mysql -h"${DB_HOST}" -u"${DB_USER}" -p"${DB_PASS}" "${DB_NAME}" < /var/www/html/db_dump.sql
    echo "  Database imported successfully!"
else
    echo "  Database already has $TABLE_COUNT tables. Skipping import."
fi

# ── Write runtime .env from Docker environment variables ─────
echo "[3/3] Writing runtime .env file..."
cat > /var/www/html/.env <<EOF
APP_ENV=${APP_ENV:-production}
ALLOWED_ORIGIN=${ALLOWED_ORIGIN:-http://localhost:8080}
JWT_SECRET_KEY=${JWT_SECRET_KEY}
JWT_ALGORITHM=${JWT_ALGORITHM:-HS256}
JWT_EXPIRY=${JWT_EXPIRY:-900}
REFRESH_TOKEN_EXPIRY=${REFRESH_TOKEN_EXPIRY:-604800}
ADMIN_CREATION_SECRET=${ADMIN_CREATION_SECRET}
DB_HOST=${DB_HOST}
DB_NAME=${DB_NAME}
DB_USER=${DB_USER}
DB_PASS=${DB_PASS}
SMTP_HOST=${SMTP_HOST:-smtp.gmail.com}
SMTP_PORT=${SMTP_PORT:-587}
SMTP_USER=${SMTP_USER}
SMTP_PASS=${SMTP_PASS}
SMTP_FROM=${SMTP_FROM}
SMTP_FROM_NAME=${SMTP_FROM_NAME:-Bus Reservation System}
API_BASE_URL=${API_BASE_URL:-http://localhost:8080/api}
EOF

chown www-data:www-data /var/www/html/.env
chmod 600 /var/www/html/.env

echo "======================================"
echo "  All checks passed! Starting Apache."
echo "======================================"

# Hand off to Apache
exec "$@"
