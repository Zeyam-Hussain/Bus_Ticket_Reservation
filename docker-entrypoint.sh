#!/bin/sh
set -eu

echo "Waiting for PostgreSQL at ${DB_HOST}:${DB_PORT:-5432}..."
attempt=0
until php -r '
$dsn = sprintf(
    "pgsql:host=%s;port=%s;dbname=%s",
    getenv("DB_HOST"),
    getenv("DB_PORT") ?: "5432",
    getenv("DB_NAME")
);
try {
    new PDO($dsn, getenv("DB_USER"), getenv("DB_PASS"), [
        PDO::ATTR_ERRMODE => PDO::ERRMODE_EXCEPTION,
    ]);
    exit(0);
} catch (PDOException $error) {
    exit(1);
}
'; do
    attempt=$((attempt + 1))
    if [ "$attempt" -ge 30 ]; then
        echo "ERROR: PostgreSQL did not become ready in time." >&2
        exit 1
    fi
    sleep 2
done

exec "$@"
