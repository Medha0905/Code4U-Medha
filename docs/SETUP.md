# Setup Guide

## Prerequisites
- Node.js 18+
- PostgreSQL 14+ (local, Docker, or Supabase)

## 1. Backend

```bash
cd backend
cp .env.example .env
```

Fill in `.env`:
- `DATABASE_URL` — your PostgreSQL connection string (Supabase: Project
  Settings → Database → Connection string → URI, use the **pooled**
  connection for `DATABASE_URL` at runtime).
- `JWT_ACCESS_SECRET` / `JWT_REFRESH_SECRET` — any long random strings.
- `ADMIN_SEED_EMAIL` / `ADMIN_SEED_PASSWORD` — credentials for the one
  real admin account the seed script creates.

```bash
npm install
npx prisma migrate dev --name init   # creates every table
npm run seed                         # creates the first admin account only
npm run dev                          # http://localhost:5000
```

Health check: `GET http://localhost:5000/api/v1/health`

## 2. Frontend (once scaffolded)

```bash
cd frontend
cp .env.example .env   # VITE_API_URL, VITE_SOCKET_URL
npm install
npm run dev             # http://localhost:5173
```

## 3. Docker (all-in-one local dev)

```bash
docker compose up --build
```

Spins up Postgres, backend, and frontend together.

## 4. First-run walkthrough

1. Register a vendor → `POST /auth/register/vendor`
2. Register the shop → `POST /shops` (as that vendor)
3. Add menu items with opening stock → `POST /menu`
4. Open the shop → `PATCH /shops/me/status { "status": "OPEN" }`
5. Register a student → `POST /auth/register/student`
6. Place an order → `POST /orders`
7. Vendor progresses the order → `PATCH /orders/:id/status`
8. Vendor scans the QR at pickup → `POST /orders/scan/complete`

Every number you see afterward (queue, inventory, analytics, reports) is
computed from these real rows.
