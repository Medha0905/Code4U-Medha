# Smart Canteen Queue & AI Pre-Order System

A production-grade SaaS platform that digitizes college canteen operations:
virtual queues, AI wait-time prediction, QR pickup, automatic inventory,
vendor analytics, bulk ordering, seat booking, and COD no-show protection.

No fake data anywhere — every student, vendor, shop, menu item, order, and
analytic figure is created and computed from real usage of the running app.

## Monorepo layout

```
smart-canteen-ai/
├── backend/     Node.js + Express + Prisma + PostgreSQL + Socket.io API
├── frontend/    React + Vite + Tailwind + Framer Motion SPA (in progress)
├── database/    ER diagram / schema notes
├── docs/        API, database, setup & deployment docs
└── docker-compose.yml
```

## Status

- ✅ **Backend** — complete: auth (Student/Vendor/Admin JWT), shop & menu
  management, automatic inventory + sold-out, virtual queue with AI wait-time
  prediction, QR pickup token generation & scan verification, bulk orders +
  seat booking, COD no-show protection (per-shop), vendor analytics + PDF
  end-of-day reports, AI kitchen assistant & business insights, admin
  platform management, Socket.io real-time layer, cron jobs (delay
  detection, auto-pause, nightly reports).
- 🔜 **Frontend** — scaffold next: pastel premium UI for Student, Vendor,
  and Admin dashboards, wired to the API above.

## Quick start (backend)

```bash
cd backend
cp .env.example .env        # fill in DATABASE_URL + JWT secrets
npm install
npx prisma migrate dev      # creates all tables
npm run seed                # creates ONLY the first admin account
npm run dev                 # http://localhost:5000
```

Or with Docker:

```bash
docker compose up --build
```

See `docs/SETUP.md` for full setup, `docs/API.md` for endpoint reference,
and `docs/DATABASE.md` for the schema breakdown.

## Deployment targets

| Layer     | Target                |
|-----------|------------------------|
| Frontend  | Vercel                 |
| Backend   | Render                 |
| Database  | Supabase PostgreSQL    |

## Tech stack

**Frontend:** React, Vite, TailwindCSS, Framer Motion, React Router, React Query, Axios
**Backend:** Node.js, Express, Prisma ORM, PostgreSQL, Socket.io, JWT
**AI features:** deterministic, explainable models computed live from real
order/queue data (wait-time prediction, kitchen load, business insights,
recommendations) — no black-box calls, no fake outputs.
