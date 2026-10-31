# API reference

All endpoints are prefixed with `/api`. JSON errors use `{ "error": { "code": string, "message": string } }`.

| Method | Endpoint | Access | Purpose |
|---|---|---|---|
| GET | `/health` | Public | Liveness check |
| GET | `/products` | Public | Search, filter, sort, paginate catalog |
| GET | `/products/:slug` | Public | Product detail |
| POST | `/auth/register` | Public | Create customer account |
| POST | `/auth/login` | Public | Start session |
| POST | `/auth/logout` | Signed in | End session |
| GET | `/auth/me` | Signed in | Current user |
| POST | `/orders` | Signed in | Create order; requires `idempotencyKey` |
| GET | `/orders` | Signed in | Current user's latest 50 orders |
| GET | `/admin/summary` | Admin | Operational counts and revenue |
| GET | `/admin/orders` | Admin | Latest 50 orders with customer and item details |
| POST | `/admin/products` | Admin | Create product |
| PATCH | `/admin/products/:id` | Admin | Update product |
| PATCH | `/admin/orders/:id/status` | Admin | Transition order status |

Product price filters are expressed in dollars and converted to integer cents. Order payloads contain product IDs and quantities only; the API calculates totals using current database prices.
