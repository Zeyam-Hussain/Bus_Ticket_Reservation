# Bus Ticket Reservation System

## Requirements

- Docker Engine with Docker Compose
- Node.js 22 or newer and npm (only needed to run the frontend in Vite development mode)

The supplied Docker image builds the PHP 8.3/Apache API, installs its Composer dependencies and PostgreSQL PDO extension, and builds the React frontend. PostgreSQL runs as a separate Compose service; OTP email is sent through the SMTP provider configured in `.env`.

## Project layout

- `api/` — PHP API endpoints
- `bus_frontend/` — React frontend
- `config/` — shared PHP configuration
- `database/schema.sql` and `migrations/` — database schema and upgrades
- `docs/otp-upgrade.md` — OTP setup and migration guide
- `scripts/` — project maintenance scripts
- `tests/` — acceptance test script

## First-time setup

1. Copy `.env.example` to `.env`.
2. Replace `DB_PASS`, `JWT_SECRET_KEY`, and `ADMIN_CREATION_SECRET` with long random values. Keep `.env` private; it is ignored by Git.
3. Build and start the services:

   ```sh
   docker compose up --build -d
   ```

4. Open the app at <http://localhost:8080>.
5. Register an administrator from the app using the value of `ADMIN_CREATION_SECRET` in `.env`. Check the configured email inbox for the OTP and verify the address.

For Gmail, use a Google App Password in `SMTP_PASS` (not your normal account password). The Compose configuration requires real SMTP settings and does not provide a mock inbox.

The database schema is loaded automatically when PostgreSQL initializes its data volume for the first time. It includes the application tables, indexes, constraints, and route/revenue views.

## Dynamic pricing

The private FastAPI pricing service is started with Docker Compose and is not
published to the host. Set `AI_SERVICE_SECRET` to a long random value in `.env`
before starting the stack. The PHP API uses it for authenticated internal
requests; do not expose it to the frontend or commit it to Git.

For an existing PostgreSQL volume, apply the dynamic-pricing migration once
(it is safe to re-run):

```sh
docker compose exec -T db sh -lc 'psql -U "$POSTGRES_USER" -d "$POSTGRES_DB"' < migrations/002_dynamic_pricing.sql
```

New databases receive the same schema from `database/schema.sql`. The admin
dashboard includes **Dynamic Pricing** with `off`, `shadow`, and `live` modes:

- `off`: customers see and pay the base fare.
- `shadow` (default): customers pay the base fare while recommendations are
  recorded for review.
- `live`: authenticated customers receive a per-route fare quote locked for
  30 minutes. The quote is revalidated during booking, and payment amounts are
  derived from the stored per-seat fare, never from a browser-submitted amount.

New routes receive starter bounds of 80%–150% of the base fare; admins should
review and set real route-specific bounds before enabling live pricing. The
included model is trained on synthetic demonstration data, not historical
customer data. Treat its output as experimental until a model has been trained
and evaluated using representative, privacy-reviewed booking history.

If the AI service is unavailable, the quote API reports a base-fare fallback
and reservations can continue at the base fare. To stop dynamic quotes, switch
the dashboard mode to `off`; core booking and payment continue using base fares.

Run the AI-service tests in its image with:

```sh
docker compose exec -T ai_service python -m unittest discover -s tests -v
```

## Frontend development

The production frontend is served by Apache at port 8080. For Vite hot reload, start the API and database with `docker compose up -d db app`, then run:

```sh
npm ci --prefix bus_frontend
npm run dev --prefix bus_frontend
```

Open the Vite URL printed in the terminal. API requests are proxied to `http://localhost:8080`; override this with `VITE_API_PROXY_TARGET` if needed.

## Database access

PostgreSQL is published on `localhost:5433` to avoid colliding with an existing local PostgreSQL service. The app connects to the Compose database internally at `db:5432`. Connection settings are in `.env`.

Useful commands:

```sh
docker compose ps
docker compose logs -f app db
docker compose exec db sh -lc 'psql -U "$POSTGRES_USER" -d "$POSTGRES_DB"'
docker compose down
```

`docker compose down` preserves database data. **Do not use `docker compose down -v` unless you intend to permanently delete the application database.**

## Dependencies and checks

- PHP dependencies are installed during the Docker image build from `composer.lock`.
- Frontend dependencies are installed during the image build from `bus_frontend/package-lock.json`.
- Run the frontend checks locally with `npm run lint --prefix bus_frontend` and `npm run build --prefix bus_frontend`.
