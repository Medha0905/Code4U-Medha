# API Documentation

Base URL: `/api/v1`
Auth: `Authorization: Bearer <accessToken>` (obtained from login/register)
All responses: `{ success, message, data }`

## Auth
| Method | Route | Auth | Description |
|---|---|---|---|
| POST | `/auth/register/student` | – | Register a student |
| POST | `/auth/register/vendor` | – | Register a vendor |
| POST | `/auth/login` | – | Login (any role) |
| POST | `/auth/refresh` | – | Refresh access token |
| GET  | `/auth/me` | ✅ | Current user profile |

## Shops
| Method | Route | Auth | Description |
|---|---|---|---|
| GET | `/shops` | – | List/search approved shops |
| GET | `/shops/:id` | – | Shop detail + active menu |
| POST | `/shops` | Vendor | Register shop (one per vendor) |
| GET | `/shops/me/mine` | Vendor | My shop |
| PATCH | `/shops/me/mine` | Vendor | Update shop profile |
| PATCH | `/shops/me/status` | Vendor | Open / Closed |
| PATCH | `/shops/me/seat-status` | Vendor | Update seat availability tier |

## Menu & Inventory
| Method | Route | Auth | Description |
|---|---|---|---|
| GET | `/menu/shop/:shopId` | – | List menu (search/category/sort) |
| POST | `/menu` | Vendor | Add item + opening stock |
| PATCH | `/menu/:id` | Vendor | Edit item |
| DELETE | `/menu/:id` | Vendor | Remove item |
| POST | `/menu/:id/restock` | Vendor | Add stock instantly |
| PATCH | `/menu/:id/threshold` | Vendor | Configure low-stock threshold |

## Orders
| Method | Route | Auth | Description |
|---|---|---|---|
| POST | `/orders` | Student | Place immediate/scheduled order → returns QR + queue position |
| GET | `/orders/mine` | Student | Order history |
| GET | `/orders/shop` | Vendor | Shop's orders (filter by status) |
| PATCH | `/orders/:id/status` | Vendor | PLACED→ACCEPTED→PREPARING→READY→COMPLETED |
| POST | `/orders/:id/no-show` | Vendor | Record COD no-show (per-shop strike) |
| POST | `/orders/scan` | Vendor | Verify QR (no side effects) |
| POST | `/orders/scan/complete` | Vendor | Verify + complete order (idempotent) |

## Queue
| Method | Route | Auth | Description |
|---|---|---|---|
| GET | `/queue/shop/:shopId` | – | Live queue + kitchen load |
| GET | `/queue/mine` | Student | My current queue position |

## Bulk Orders & Seat Booking
| Method | Route | Auth | Description |
|---|---|---|---|
| POST | `/bulk-orders` | Student | Place bulk order (+ optional seat booking) |
| GET | `/bulk-orders/mine` | Student | My bulk orders |
| GET | `/bulk-orders/shop` | Vendor | Shop's incoming bulk orders |

## Favorites
| Method | Route | Auth |
|---|---|---|
| GET `/favorites` · POST `/favorites` · DELETE `/favorites/:menuItemId` | Student |

## Notifications
| Method | Route | Auth |
|---|---|---|
| GET `/notifications` · PATCH `/notifications/:id/read` · PATCH `/notifications/read-all` | Any |

## AI
| Method | Route | Auth | Description |
|---|---|---|---|
| GET | `/ai/recommendations/:shopId` | Student | Frequently ordered / favorites / popular |
| GET | `/ai/kitchen-assistant` | Vendor | Batch cooking, kitchen load, priority order |
| GET | `/ai/business-insights` | Vendor | Demand patterns mined from real orders |

## Reports & Analytics
| Method | Route | Auth | Description |
|---|---|---|---|
| GET | `/reports/analytics` | Vendor | Revenue, orders, wait time, product sales |
| GET | `/reports/daily?date=` | Vendor | End-of-day report (JSON) |
| GET | `/reports/daily/pdf?date=` | Vendor | End-of-day report (PDF download) |

## Vendor Onboarding
| Method | Route | Auth |
|---|---|---|
| POST `/vendor/tutorial/seen` · POST `/vendor/tutorial/replay` · PATCH `/vendor/auto-pause` | Vendor |

## Admin
| Method | Route | Auth |
|---|---|---|
| GET `/admin/students` · GET `/admin/vendors` · GET `/admin/shops` · GET `/admin/analytics` | Admin |
| PATCH `/admin/users/:userId/active` · PATCH `/admin/shops/:shopId/approve` | Admin |

## Realtime (Socket.io)

Connect with `auth: { token: accessToken }`, then `emit('shop:subscribe', shopId)`.

| Event | Payload |
|---|---|
| `queue:update` | full ordered queue for the shop |
| `inventory:update` | `{ menuItemId, quantity, availability }` |
| `order:status` | updated order object |
| `kitchen:load` | `{ level, pending, preparing }` |
| `seat:status` | new seat status enum |
| `notification:new` | notification object (sent to `user:<id>` room) |
