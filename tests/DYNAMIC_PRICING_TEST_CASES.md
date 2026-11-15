# Dynamic Pricing Test Cases

These are the acceptance cases for the dynamic-pricing-only integration. Write and
review these before application implementation, then validate each case after
the feature is integrated.

## AI service

| ID | Scenario | Expected result |
|---|---|---|
| AI-01 | Health/readiness check with model artifact loaded | Healthy status and model version are reported. |
| AI-02 | Recommendation request without internal secret | HTTP 401; no prediction is returned. |
| AI-03 | Recommendation request with wrong internal secret | HTTP 401; no prediction is returned. |
| AI-04 | Valid recommendation request with all supported inputs | Demand is in `[0, 1]`; fare is an integer within configured fare bounds; response includes version and generation time. |
| AI-05 | Invalid capacity, negative counts/hours, invalid day, or min fare above max fare | Request is rejected; no uncaught server error. |
| AI-06 | Bookings exceed capacity or demand inputs exceed their sensible upper bound | Features are safely capped; prediction remains finite and within `[0, 1]`. |
| AI-07 | Model artifact unavailable | Explicit rule-model fallback works and reports the fallback model version. |
| AI-08 | Recommendation at minimum/maximum guardrail | Returned fare never escapes the configured bounds. |

## PostgreSQL and PHP API

| ID | Scenario | Expected result |
|---|---|---|
| DB-01 | Apply pricing migration to existing database | New columns/tables/indexes/constraints exist and existing paid fares are captured from completed payments; unpaid bookings use the route base fare. |
| DB-02 | Apply migration a second time | Succeeds without duplicate objects or changing existing fare history. |
| API-01 | Customer requests quote without authentication | HTTP 401. |
| API-02 | Non-admin requests admin pricing settings | HTTP 403. |
| API-03 | Admin reads pricing panel | Returns current mode, route fare bounds, seat/demand summary, and latest recommendation without failing on routes with no model output yet. |
| API-04 | Admin sets invalid mode or `min > base` / `base > max` | HTTP 400; database values remain unchanged. |
| API-05 | `off` mode | Quote returns base fare; no AI fare is represented as live. |
| API-06 | `shadow` mode | Quote returns base fare while recommendation is logged for admin review. |
| API-07 | `live` mode with available AI | Authenticated customer receives a quote inside admin fare bounds and with an expiry. |
| API-08 | Repeat quote for same user/route while active | Same quote ID and fare are returned; model/demand changes do not reprice it. |
| API-08a | Admin changes pricing mode while a customer holds a valid quote | The existing quote remains honored until expiry/use; the mode change affects newly created quotes only. |
| API-09 | Expired quote | New quote can be issued; old quote cannot be used to book. |
| API-10 | Quote belonging to another user or route | Cannot be read or used for booking. |
| API-11 | Inactive, departed, or nonexistent route | No fare quote is issued and booking is rejected. |
| API-12 | AI service unavailable in live mode | Base-fare fallback is explicit, bounded, and bookable only according to the agreed fallback behavior; no false AI result is shown. |
| API-13 | Invalid/tampered route, quote, seat list, or client amount | Server rejects invalid booking/quote; client-supplied amount never determines the stored/paid fare. |
| API-14 | Multi-seat booking with one quote | Every seat booking stores the same per-seat fare and quote reference; quote use and booking are atomic. |
| API-15 | Two booking/payment requests race for the same quote/seat | At most one succeeds; no duplicate completed payment or oversold seat. |
| API-16 | Payment amount omitted or tampered | Server derives amount from the persisted per-seat fare; payment/email amount agrees with it. |

## Frontend and admin dashboard

| ID | Scenario | Expected result |
|---|---|---|
| UI-01 | Admin opens Dynamic Pricing tab | Mode, route bounds, latest recommendations, demand, loading/error/empty states, and refresh control render. |
| UI-02 | Admin changes valid route bounds | Server persists them; refreshed panel reflects the new values. |
| UI-03 | Admin submits invalid fare bounds | UI shows server validation error and does not present the change as saved. |
| UI-04 | Pricing mode is `off` or `shadow` | Search results and checkout show base fare. |
| UI-05 | Pricing mode is `live` | Search result clearly identifies a locked quote, per-seat amount, currency, and expiry; checkout carries the quote ID. |
| UI-06 | Quote expires before booking | Booking returns a clear refresh-price error; frontend does not charge or show success. |
| UI-07 | AI/API unavailable | User sees an explicit safe fallback/error state; existing route search and base-fare reservation behavior remain available. |
| UI-08 | Multi-seat booking | Total shown is per-seat fare multiplied by selected seats; API persists and charges the same per-seat amount for each booking. |

## Release checks

- Run the AI-service unit tests and HTTP smoke tests.
- Run the frontend production build and focused lint for touched components.
- Apply the SQL migration twice against a disposable PostgreSQL database and test its schema/data effects.
- Run authenticated API integration checks against the Compose stack.
- Verify admin dashboard and customer quote/booking/payment flows in the browser or equivalent API integration tests.
- Confirm AI-service port is internal-only, secrets are not in Git or logs, and the feature can be switched to `off`.

## Validation results

Validated against the local Compose stack after implementation:

- **Passed:** AI-01 through AI-04 and AI-06 through AI-08 by unit tests and health checks; the live PHP-to-AI request also returned a bounded recommendation.
- **Passed:** DB-01 and DB-02; migration ran twice, the existing paid fares matched the saved booking fares, and no existing fare was overwritten on the second run.
- **Passed:** API-01 through API-08 and API-08a; unauthenticated access returned 401, passenger admin access returned 403, invalid admin changes returned 400, all three modes were exercised, and live quotes were bounded, reused, and preserved across a mode change.
- **Passed:** API-10 ownership check; a different user could not use the test quote.
- **Passed:** API-14 multi-seat booking snapshot; two bookings shared the same locked per-seat fare and quote ID. An extra client-supplied `total_amount` did not alter the persisted fare. Temporary bookings and quote were deleted without processing payment.
- **Partially verified:** API-13 client amount authority was checked at booking creation; malformed seat payloads and tampered payment requests were not sent to avoid touching real payment/email handling.
- **Passed:** Frontend production build, PHP syntax checks, focused ESLint for `AdminPricing.jsx`, `BookResult.jsx`, `Payment.jsx`, and `Dashboard.jsx`, and Compose configuration validation.
- **Pre-existing lint debt:** `Dashboard.jsx` reports two React hook dependency warnings; `SeatSelection.jsx` reports five unused-variable errors and one dependency warning. These diagnostics are outside the pricing changes.
- **Not run end-to-end:** expired quote, outage fallback, multi-seat booking/payment race, payment/email delivery, and authenticated browser workflows. These require additional disposable booking identities and/or a safe mail sink; no live payment or email was triggered.

The local pricing mode was restored to `shadow` after API checks. The model artifact is synthetic demo data and is not production-validated.
