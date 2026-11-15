# AI Integration Plan

## Dynamic-pricing implementation scope

The current implementation work covers **dynamic pricing only**: the internal
FastAPI pricing service, PostgreSQL fare configuration/quote/audit schema,
PHP admin and quote APIs, server-authoritative booking/payment fares, and the
React admin/customer surfaces. The support chatbot and EfficientNet sections
below remain roadmap items and are not part of this rollout.

The first model is deliberately labeled as a synthetic-data demonstration.
Pricing defaults to `shadow`, and route bounds are starter values that an
administrator must review before choosing `live`. It is not a production
forecast trained on real booking history.

## 1. Goal and scope

Integrate the three AI capabilities in the supplied proposal into the existing Bus Ticket Reservation System:

1. Demand-informed ticket pricing.
2. Reservation-specific AI customer support using retrieval-augmented generation (RAG).
3. EfficientNet image classification for a bus-operations workflow.

Deliver them incrementally. The AI service must not replace the PHP API, directly access the browser, or become the source of truth for bookings, payments, refunds, or operational safety decisions.

## 2. Current project baseline

- **Frontend:** React 19 and Vite in `bus_frontend/`; the app is routed from `bus_frontend/src/App.jsx`.
- **Application API:** PHP 8.3 endpoints in `api/`, using JWT validation from `config/validate_token.php`.
- **Database:** PostgreSQL. The canonical fresh-install schema is `database/schema.sql`; existing deployments need explicit SQL migrations because the schema init script is only run when the database volume is first created.
- **Deployment:** Docker Compose runs the PHP/Apache application and PostgreSQL. The root `Dockerfile` builds the frontend into the PHP image.
- **Booking and fares:** `route.base_fare` is the current route fare. `api/booking/book.php` creates one booking per seat, and `api/payment/process.php` records the amount sent by the client. A fare must therefore be captured and validated server-side before enabling dynamic pricing.
- **Existing UI surfaces:** route search/results (`BookResult.jsx`), seat selection (`SeatSelection.jsx`), checkout (`Payment.jsx`), and the admin dashboard (`Dashboard.jsx`).

Use PostgreSQL-specific SQL and preserve the current PHP/React stack. Do not copy MySQL-specific assumptions from the proposal.

## 3. Target architecture and boundaries

```text
React frontend
    | same-origin, authenticated application requests
PHP API (auth, authorization, business rules, database access)
    | authenticated internal HTTP calls; bounded timeouts
Python FastAPI AI service (models, RAG, inference only)
    | least-privilege data access through PHP or approved internal interfaces
PostgreSQL + approved private document/image storage
```

- Browser requests go only to the PHP API. The browser never receives an AI-provider key or calls the FastAPI service directly.
- PHP remains authoritative for identity, route availability, price quotes, seat reservations, payment records, support-ticket creation, and admin permissions.
- The AI service returns typed predictions or draft responses; it does not run arbitrary SQL, approve refunds, confirm bookings, or mark a bus safe/unsafe.
- Keep each capability behind an independently configurable feature flag. Use explicit timeouts, bounded retries where safe, request-size limits, rate limits, structured error logging, and health checks.
- Keep model artifacts and secrets out of Git. Pass credentials through deployment secrets/environment variables and document only variable names in `.env.example`.

## 4. Decisions and gates before implementation

Resolve these as product decisions during Step 1; do not infer them from model output:

1. **Dynamic-fare policy:** permitted minimum/maximum fare, maximum change per update, when prices may change, whether decreases are permitted, who can enable the feature, and the customer notice/refund policy. Start with recommendations only; do not activate automatic fare changes until these limits are approved.
2. **Pricing evidence:** inspect the amount, quality, and retention of historical bookings. Search counts and time-series availability snapshots do not currently appear in the schema and cannot be reconstructed reliably from completed bookings alone.
3. **Support model/provider:** select an LLM provider or self-hosted model, define allowed data sent to it, and approve the booking, cancellation, refund, and escalation policies used as source documents.
4. **Image-classification task:** choose one bounded task (for example, bus exterior condition, bus type, or seat condition), its labels, who uploads images, and who reviews results. EfficientNet cannot be scoped accurately until this is decided. The initial result must be advisory and human-reviewed.
5. **Operations and privacy:** set retention/deletion rules for chats, search aggregates, support issues, uploaded images, and model logs; identify a human escalation owner and an operator for model releases.

## 5. Step-by-step implementation

### Step 1 — Baseline and product decisions

1. Record the current production/development topology, route/booking volume, existing historical data range, and how migrations are applied to deployed databases.
2. Inspect `route`, `booking`, and `payment` records for completeness and consistency; do not export customer-level data to external tools or model providers for this assessment.
3. Agree on the five decisions in Section 4. Mark pricing as recommendation-only until the pricing policy and data-readiness gate pass.
4. Define acceptance criteria for each capability, including service-unavailable behavior, privacy, accessibility, and human escalation.

**Exit criteria:** approved pricing guardrails; chosen support deployment/provider and data policy; selected or explicitly deferred image task; documented data and retention constraints.

### Step 2 — Add the AI service and deployment boundary

1. Add an isolated `ai_service/` FastAPI application with separate modules for pricing, support/RAG, and image inference; start with health/readiness endpoints and typed request/response schemas.
2. Add it as a Compose service. Keep it on the internal service network and do not publish its inference port to the public host by default.
3. Add AI-service URL, internal authentication secret, and per-feature configuration to environment handling. Update `.env.example` with placeholders only.
4. Add authenticated PHP-to-AI calls with short connection/read timeouts, input validation, response validation, and error logging that excludes secrets and message/image contents.
5. Establish dependency pinning, model artifact loading/versioning, and a documented local setup. Avoid loading large ML dependencies into the PHP container.

**Exit criteria:** service health checks pass in Compose; the browser cannot call the internal service; PHP receives explicit success/error responses from a stub AI endpoint.

### Step 3 — Create database migrations and event foundations

Create ordered, repeatable PostgreSQL migration files and document how to apply them to both new and existing deployments. Keep `database/schema.sql` aligned with the migrations for fresh installs. Do not rely on editing the init SQL alone to update existing volumes.

Proposed schema additions, finalized against the actual data needs in Step 1:

- **Pricing data:** route-level availability/demand snapshots with `route_id`, capture time, capacity, active bookings, available seats, fare, and aggregate recent booking/search counts; indexes on route and capture time. Record only aggregate search events, not unnecessary searcher identity.
- **Pricing audit:** recommendations with route, generated time, feature/model version, predicted demand, recommended fare, configured bounds, and status (for example shadow/accepted/rejected). Store the fare actually agreed for each booked seat as an immutable booking/payment snapshot or reference, so later model updates cannot change historical charges.
- **Support:** conversations, messages, and structured support issues with user ownership where applicable, intent/category, priority, status, timestamps, and resolution metadata. Add ownership and admin queue indexes. Store only necessary content and honor retention/deletion policy.
- **Image workflow (after task selection):** inspection/prediction metadata including bus, storage key, model version, predicted class/confidence, review status, reviewer, and timestamps. Store image files in private file/object storage, not as database blobs; never make storage objects public by default.

Use foreign keys, `CHECK` constraints, appropriate uniqueness rules, and indexes. Define a migration rollback or forward-recovery strategy. Ensure development/test migrations can be safely re-applied and confirm that backups exist before production changes.

**Exit criteria:** migration applies to an existing test database and a fresh database; the schema and migration result agree; rollback/recovery and backup steps are documented.

### Step 4 — Build trustworthy pricing data collection

1. Implement a scheduled/server-side snapshot process using PostgreSQL data and route capacity. Do not depend on frontend-submitted seat counts.
2. Add privacy-preserving aggregate search-event capture with a defined time window and retention period. Exclude bots and duplicate/repeated activity according to a documented rule.
3. Record bookings, cancellations, completed payments, departure lead time, route, base fare, and fare actually charged. Define treatment of pending/expired bookings and refunds.
4. Backfill only fields that can be derived truthfully from existing data. Label unavailable historical features as unavailable; do not fabricate snapshots or search demand.
5. Add data-quality checks and an admin-readable status for snapshot freshness and missing/insufficient history.

**Exit criteria:** snapshots are consistently produced, reconciled against booking/seat totals, and sufficient for an offline data-readiness assessment.

### Step 5 — Train and evaluate demand/pricing models offline

1. Create a reproducible training/evaluation workflow in `ai_service/` separate from request-time PHP code. Keep datasets private and prevent accidental inclusion in Git.
2. Establish a transparent baseline (for example, historical route/time-window averages) before comparing a tabular model such as CatBoost or XGBoost. Use a time-based train/validation/test split to avoid future-data leakage.
3. Predict near-term demand first. Evaluate with agreed forecasting metrics and route/time-segment error analysis; document performance against the baseline.
4. Calculate a candidate fare in a separate pricing policy layer using approved bounds and explainable inputs. Optimize against a measured objective and business constraints, not just model fit.
5. Version model artifacts and record training-data range, feature definitions, metrics, and approval status. Do not deploy a model that fails the baseline or data-quality gate.

**Exit criteria:** reproducible evaluation meets agreed thresholds; pricing policy is approved; model and training metadata are versioned and reviewable.

### Step 6 — Integrate pricing in shadow mode, then customer flow

1. Add an internal PHP integration and an authenticated admin endpoint to request/view recommendations. The FastAPI pricing endpoint accepts server-assembled route features and returns a versioned prediction with timestamp and confidence/quality metadata.
2. Run recommendations in **shadow mode** first: save and compare recommendations with the existing `route.base_fare`; do not change customer-facing fares. Admins can inspect outliers and stale predictions.
3. Expose a PHP route-quote endpoint for `BookResult.jsx`/`SeatSelection.jsx`. PHP validates route status and departure, fetches current authoritative availability, obtains a usable recommendation, applies the approved fare bounds, and returns a quote with a short expiry and unique quote/version identifier.
4. Show the quote, currency, expiry, and clear dynamic-pricing notice in route results and checkout. Handle expired quotes with a refresh/confirmation step rather than silently changing the displayed price.
5. At booking, verify the quote, ownership, route, seat availability, and selected seat count inside a database transaction; bind the accepted per-seat fare to the booking. Reject stale or altered client-submitted amounts.
6. In `api/payment/process.php`, derive/verify the payable amount from the persisted booking fare and enforce that the payment record matches it. Do not accept the frontend's `total_amount` as authoritative. Keep fare capture and seat booking consistent under concurrent requests.
7. Roll out only behind an admin-controlled feature flag, initially to a limited route set. If inference is unavailable, use the pre-approved behavior (initially the existing base fare or disable quote purchase as product policy specifies); report the condition, never show an unverified AI fare as a successful prediction.

**Exit criteria:** shadow results are reviewed; quote/booking/payment amounts reconcile; stale quotes, service outages, duplicate requests, and concurrent seat selection are tested; a rollback switch restores base-fare behavior.

### Step 7 — Build support knowledge and guarded AI responses

1. Gather and approve authoritative booking, cancellation, payment, refund, ticket, and travel-policy documents. Assign owners and revision dates.
2. Build an ingestion pipeline that versions source documents, chunks them with provenance, creates embeddings, and supports re-indexing when policies change. Select a vector store (for example, a local/private Chroma deployment) only after confirming its operational fit.
3. Implement a restricted `/ai/chat` inference flow: retrieve approved relevant passages, use a constrained prompt, include source references internally, and decline or escalate unsupported questions. Keep the bot focused on reservation support.
4. Define structured intents, priority categories, and escalation thresholds. Treat payment deducted/ticket missing, duplicate payment, safety, and other urgent reports as human-review cases; never promise or issue refunds automatically.
5. Add narrowly scoped tools only when needed. Any private booking lookup must be authorized by PHP for the authenticated owner; the LLM must not supply SQL or bypass PHP authorization.
6. Redact/tokenize sensitive data before sending any text to an external provider, according to the approved provider/data policy. Never send credentials, payment-card details, or unrelated account data.

**Exit criteria:** policy answers are grounded in current approved documents; unsupported/high-risk queries escalate; provider/data handling and retention are approved.

### Step 8 — Expose support APIs and deliver the support UI

1. Add PHP endpoints for chat, history, feedback, and admin flagged issues/resolution. Suggested routes: `/api/support/chat.php`, `/api/support/history.php`, `/api/support/feedback.php`, and admin-only support issue endpoints. Keep FastAPI routes internal.
2. Require JWT authentication for private conversations; enforce user ownership on every history/message lookup and admin role checks on issue queues/resolution.
3. Add request/message limits, rate limits, CSRF/CORS policy consistent with existing endpoints, abuse controls, and safe handling for provider timeouts.
4. Add a reusable React chat widget accessible from the customer-facing app, with loading/error states, retry controls, source/policy links where appropriate, feedback, and a clear human-support path.
5. Add an admin dashboard tab/section to review flagged issues, priority, conversation summary, status, and resolution/assignment. Keep the AI summary visibly distinct from verified user/payment facts.
6. Show a graceful service-unavailable notice and contact route when AI is down; do not lose an unsent message or imply it was delivered.

**Exit criteria:** customer conversations are private and owner-scoped; admin actions are role-protected and auditable; urgent cases reach the agreed human workflow.

### Step 9 — Add EfficientNet only after its task is selected

1. Define the image labels, image capture instructions, consent/retention, reviewer workflow, and the error cost for each class. Confirm that classification is appropriate; use object detection instead if the requirement is to locate damage within an image.
2. Build a consented, labeled, representative dataset with train/validation/test separation by bus or capture session to avoid near-duplicate leakage. Document class imbalance and image provenance.
3. Start with pretrained EfficientNetB0 and transfer learning; evaluate per-class precision/recall, confusion matrix, and failure cases. Set a minimum confidence/review threshold approved by operations.
4. Add authenticated, admin/operator-only upload and prediction endpoints through PHP. Validate type, size, dimensions, and content; store private images outside the web root and persist only metadata/storage keys in PostgreSQL.
5. Display predicted label, confidence, image, model version, and review controls in an admin UI. Require a human decision for maintenance/safety classification; never automatically remove a bus from service or declare it safe.
6. Keep the feature disabled until dataset quality, evaluation, storage privacy, and review ownership pass acceptance.

**Exit criteria:** a reviewed model meets agreed per-class thresholds on held-out data; uploaded images are access-controlled and retained/deleted according to policy; human review is recorded.

### Step 10 — Test, deploy, monitor, and operate

1. Add PHP endpoint tests for authorization, validation, ownership, service errors, quote expiry, fare consistency, and support escalation.
2. Add FastAPI unit/contract tests for request schemas, model loading/versioning, policy boundaries, retrieval grounding, and file validation. Add frontend lint/build and UI coverage for quote changes and chat errors.
3. Add end-to-end tests for: route quote → seat booking → payment amount; authenticated support chat/history and admin resolution; image upload → prediction → reviewer action (if enabled).
4. Test missing model/artifact, database/service outage, provider timeout/rate limit, malformed model output, expired quote, concurrent seat booking, and feature-flag rollback.
5. Deploy migrations before dependent API code. Deploy the AI service privately, verify health/readiness, then enable each capability independently in shadow/limited rollout.
6. Monitor API latency/error rate, stale snapshots, pricing changes/bounds, model versions, chat escalation and provider usage, and image-review outcomes. Logs must not contain secrets, full sensitive prompts, or raw image bytes.
7. Establish an owner, alert thresholds, model rollback procedure, feature kill switch, backup/restore test, and periodic policy/document/model review.

**Release gates:** no critical authorization or privacy failures; pricing remains within approved limits and reconciles exactly with charged amounts; support responses are grounded or escalated; image output remains advisory and reviewable.

## 6. Suggested delivery order

1. **Foundation:** decisions, service boundary, migrations, privacy and operational controls (Steps 1–3).
2. **Pricing data and safe pilot:** event capture, offline evaluation, shadow recommendations, then bounded fare quotes (Steps 4–6). Stop at shadow mode if historical data is inadequate.
3. **Customer support:** knowledge base, protected APIs, chat widget, and admin escalation queue (Steps 7–8).
4. **Image classification:** only after the classification task and dataset are approved (Step 9).
5. **Production readiness:** full integration tests, staged rollout, monitoring, and rollback (Step 10).

Each phase can be disabled or rolled back without disabling core reservations. Do not launch all three capabilities simultaneously.

## 7. Repository files expected to change during later implementation

This plan is the only file created for the planning request. When implementation begins, likely integration points include:

- `database/schema.sql` and new ordered files under `migrations/`.
- `docker-compose.yml`, `Dockerfile` or a dedicated AI-service Dockerfile, and `.env.example`.
- New `ai_service/` application, pinned dependencies, model/data handling, and tests.
- New PHP endpoints and shared internal-AI client code under `api/`, plus updates to `api/booking/book.php` and `api/payment/process.php` for authoritative fare handling.
- `bus_frontend/src/App.jsx`, `BookResult.jsx`, `SeatSelection.jsx`, `Payment.jsx`, and `Dashboard.jsx`, plus focused reusable components and tests.
- `README.md` or focused operational documentation for migration, local development, deployment, secrets, and rollback.

Do not treat this list as approval to change these files now; implement only after the relevant decision gates and phase acceptance criteria are met.
