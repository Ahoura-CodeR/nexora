# Architecture notes

## Why a modular monolith

The web client and API are separate deployable apps, while the API is organized by business capability. Catalog, identity, orders, inventory, and admin code can evolve independently without adding network hops or distributed transaction complexity. A service split should be driven by deployment, scaling, or ownership constraints—not by folder names.

## Order creation

1. Validate the payload and require a signed-in session.
2. Check the `(userId, idempotencyKey)` unique constraint for an existing result.
3. Run a serializable database transaction.
4. Load active products and compute prices on the server; never trust client-supplied prices.
5. Decrement stock using conditional updates (`stock >= requested quantity`).
6. Insert the order and immutable order-item price/name snapshots in the same transaction.
7. Return the stored result for a repeated idempotency key.

If a request races with another order, PostgreSQL may abort a serializable transaction. The API should return a retryable conflict rather than silently oversell. Production deployments can add a bounded retry policy for serialization failures.

## Session and trust boundaries

Sessions live in Redis and the browser receives only an HTTP-only cookie. Passwords are bcrypt hashes. Role checks run server-side. Configure `COOKIE_SECURE=true` behind HTTPS, use a long random `SESSION_SECRET`, and restrict `WEB_ORIGIN` to the deployed frontend. The seeded admin credentials are development-only and must be changed or removed before deployment.

## Known scope limits

- Payment is intentionally simulated; there is no payment-provider integration.
- Email verification, password reset, CSRF tokens, tax calculation, and real shipping labels are not implemented.
- The current request logger is intentionally minimal. For production, add OpenTelemetry exporters, metrics, alerts, and a log retention policy.
- Redis is required for sessions in the local environment.
Repository workflow notes are maintained in docs/architecture.md.
