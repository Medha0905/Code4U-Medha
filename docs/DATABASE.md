# Database Documentation

PostgreSQL, managed with Prisma ORM. Full schema: `backend/prisma/schema.prisma`.

## Core entities

- **User** — base identity (email, password hash, role). One-to-one with
  exactly one of `Student`, `Vendor`, `Admin`.
- **Student / Vendor / Admin** — role-specific profiles.
- **Shop** — one-to-one with Vendor. Holds status (open/closed/paused),
  seat status tier, auto-pause flag.
- **MenuItem** — belongs to a Shop. Holds price, prep time, availability
  tier (derived automatically from `Inventory`).
- **Inventory** — one-to-one with MenuItem. `quantity` + `lowStockThreshold`.
  Deducted transactionally on every order; drives `MenuItem.availability`.
- **Order / OrderItem** — an order belongs to a Student + Shop, has a
  unique `qrToken` (pickup QR) and `tokenNumber` (per-shop sequential).
  Status machine: PLACED → ACCEPTED → PREPARING → READY → COMPLETED
  (or CANCELLED / NO_SHOW).
- **Payment** — one-to-one with Order. COD starts PENDING, becomes PAID on
  pickup completion; ONLINE is PAID at creation (payment gateway hook is
  the integration seam).
- **QueueEntry** — one-to-one with Order while active (`leftAt = null`).
  Holds live `position` and AI-predicted `estimatedWaitMinutes`,
  recalculated whenever the queue changes.
- **BulkOrder** — one-to-one with Order, adds event details
  (people count, date, serving/eating time).
- **SeatReservation** — optional one-to-one with BulkOrder for group
  seating requests.
- **CodStrike** — unique per `(studentId, shopId)`. Tracks no-show count
  and COD eligibility **scoped to that shop only** — never affects the
  student's other shop relationships or their account as a whole.
- **Notification** — belongs to a User (any role); typed (`NotificationType`).
- **DailyReport** — one per `(shopId, reportDate)`, generated from real
  completed orders; stores `productWiseSales` as JSON for the PDF/report UI.

## Design principles

1. **No fake data.** Every row is created via a real registration, menu
   entry, or order placed through the API — the seed script only creates
   the first Admin account.
2. **Derived state, not duplicated state.** `MenuItem.availability` and
   `Shop.seatStatus` are tiers computed/set from real quantities, never
   free-typed exact numbers shown to students.
3. **Per-shop scoping for penalties.** COD strikes are keyed to
   `(student, shop)`, matching the spec's requirement that no-show
   penalties never block a student's whole account.
4. **Auditable "AI".** Wait-time prediction, kitchen load, and business
   insights are deterministic aggregations over real rows (see
   `backend/src/services/*.js`), not opaque calls — every number can be
   traced back to the orders that produced it.

## ER overview (textual)

```
User 1─1 Student ──< Order >── Shop ─1 Vendor 1─ User
                        │           │
                        │           ├─< MenuItem 1─1 Inventory
                        │           ├─< DailyReport
                        │           └─< CodStrike >─ Student
                        ├─1 Payment
                        ├─1 QueueEntry
                        ├─1 BulkOrder ─1 SeatReservation
                        └─< OrderItem >─ MenuItem
```
