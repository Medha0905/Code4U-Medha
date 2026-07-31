# 🍽️ Smart Canteen--Skip The Line
🔗 **Live Demo:** [ smartcanteen-pi.vercel.app]( https://smartcanteen-pi.vercel.app)  
🖥️ **Backend API:** [smart-canteen-xa2r.onrender.com](https://smart-canteen-xa2r.onrender.com)

A production-grade SaaS platform that digitizes college canteen operations — replacing physical queues with virtual queues, real-time order tracking, two genuine AI features, and direct student-vendor communication.

No fake data anywhere. Every student, vendor, shop, menu item, order, review, and analytics figure is created and computed from real usage of the running app — nothing is hardcoded or mocked.

---

## 📖 Table of Contents
- [Features](#-features)
- [Tech Stack](#-tech-stack)
- [AI Features — How They Work](#-ai-features--how-they-work)
- [Project Structure](#-project-structure)
- [Getting Started](#-getting-started)
- [Environment Variables](#-environment-variables)
- [API Reference](#-api-reference)
- [Real-Time Events](#-real-time-events-socketio)
- [Deployment](#-deployment)
- [Design Principles](#-design-principles)

---

## ✨ Features

### For Students
- Browse open canteens with live shop status, seat availability, and ratings
- Real-time menu with live stock tiers: 🟢 Available · 🟡 Limited · 🟠 Almost Finished · 🔴 Sold Out
- Item customization (vendor-priced add-ons, e.g. "Extra cheese +₹20")
- Place immediate or scheduled orders, pay Online or Cash on Pickup
- QR-based pickup ticket with live queue position
- Vendor-set wait-time promise ("under 20 min" / "20+ min") shown instantly on Accept
- **Order Messaging** — a lightweight 2-way chat per order (e.g. "running 30 min late")
- Bulk ordering for clubs/events, with optional group seat booking
- Favorites & quick reorder
- Full order history, live order status tracking
- Ratings & reviews on completed orders
- Real-time notifications (order accepted/preparing/ready/delayed)

### For Vendors
- Shop registration & profile management (hours, location, contact, seat capacity)
- **AI Menu Photo Extraction** — upload one photo of a physical menu card; OCR extracts item names & prices automatically, vendor fills in prep time/stock/photo/category before confirming
- Manual menu management — add/edit/delete items, per-item photo upload, customization builder
- Automatic inventory deduction on every order — no manual stock updates
- Automatic sold-out detection & configurable low-stock alerts
- One-tap restock
- Live order pipeline: Accept → Preparing → Ready, with wait-time promise set on Accept
- Camera-based QR pickup scanning (with manual fallback) and duplicate-scan prevention
- **Computer-Vision Seat Occupancy Detection** — camera + object detection counts people in real time and auto-updates the seat availability tier, replacing manual guessing
- COD no-show tracking with escalating per-shop strikes (never blocks a student's whole account)
- AI Kitchen Assistant — batch cooking suggestions, priority orders, kitchen load indicator
- AI Business Insights — demand patterns computed from real order history
- Vendor analytics dashboard — revenue, orders, product-wise sales, average wait
- Downloadable end-of-day PDF reports
- Spotlight coach-mark onboarding tour on first login (highlights real dashboard buttons)
- Auto-pause ordering during heavy kitchen load
- Bulk order & seat booking request management
- Shop removal (soft-delete — preserves order history)

### For Admins
- Platform-wide analytics (students, vendors, shops, total revenue)
- Student management — view, deactivate/reactivate accounts (misuse handling)
- Vendor & shop management — approve, deactivate, remove/restore shops

---

## 🛠️ Tech Stack

**Frontend:** React 18, Vite, TailwindCSS, Framer Motion, React Router, React Query, Axios, Socket.io-client, TensorFlow.js, react-qr-code, html5-qrcode

**Backend:** Node.js, Express.js, Prisma ORM, PostgreSQL (Supabase), Socket.io, JWT Authentication, bcryptjs, Multer, PDFKit, node-cron, Tesseract.js

**Database:** PostgreSQL — 16+ relational tables with proper foreign keys (Users, Students, Vendors, Shops, MenuItems, Inventory, Orders, OrderItems, Payments, QueueEntries, BulkOrders, SeatReservations, CodStrikes, Notifications, DailyReports, Reviews, Messages)

**Deployment:** Frontend → Vercel · Backend → Render · Database → Supabase PostgreSQL

---

## 🤖 AI Features — How They Work

This project deliberately uses **two genuine AI capabilities that require zero external API keys and zero per-request cost**, keeping the whole platform self-hostable and free to run:

### 1. AI Menu Photo Extraction
Vendor uploads one photo of their physical menu → **Tesseract.js** (open-source OCR, runs locally) extracts raw text → a heuristic parser detects item names and prices → vendor reviews and fills in prep time, stock, category, and a photo for each item before anything is saved. Human-in-the-loop by design, since OCR on real-world photos is never perfect.

### 2. Computer-Vision Seat Occupancy Detection
**TensorFlow.js + COCO-SSD** (a pretrained object-detection model, loaded from CDN, running entirely in the browser) analyzes the vendor's camera feed, counts "person" detections, and automatically updates the shop's seat-availability tier based on occupied-vs-capacity ratio — replacing a manual vendor guess with a live, camera-verified count.

---

## 📂 Project Structure

```
smart-canteen-ai/
├── backend/
│   ├── prisma/            schema.prisma, migrations, seed.js
│   └── src/
│       ├── config/         db, upload (multer) config
│       ├── controllers/    business logic per resource
│       ├── routes/         Express route definitions
│       ├── middlewares/    auth, error handling, validation
│       ├── services/       inventory, queue, AI, OCR, reports, COD logic
│       ├── sockets/        Socket.io real-time layer
│       ├── jobs/           cron jobs (delay detection, auto-pause, reports)
│       └── utils/          JWT, QR generation, API response helpers
├── frontend/
│   └── src/
│       ├── components/     reusable UI (Ticket, FoodCard, OrderChat, CoachTour, SeatOccupancyMonitor…)
│       ├── pages/           student/, vendor/, admin/, auth/, shared/
│       ├── layouts/         DashboardLayout, AuthLayout
│       ├── context/         Auth, Notifications
│       └── services/        API client modules per resource
├── docs/                    API.md, DATABASE.md, SETUP.md
├── docker-compose.yml
└── README.md
```

---

## 🚀 Getting Started

### Prerequisites
- Node.js 18+
- PostgreSQL 14+ (local, Docker, or Supabase)

### Backend
```bash
cd backend
cp .env.example .env      # fill in DATABASE_URL, DIRECT_URL, JWT secrets
npm install
npx prisma migrate dev    # creates all tables
npm run seed               # creates ONLY the first real admin account
npm run dev                 # http://localhost:5000
```

### Frontend
```bash
cd frontend
cp .env.example .env       # VITE_API_URL, VITE_SOCKET_URL
npm install
npm run dev                 # http://localhost:5173
```

### Docker (all-in-one local dev)
```bash
docker compose up --build
```

Full walkthrough in `docs/SETUP.md`.

---

## 🔐 Environment Variables

**Backend** (`backend/.env`):
```env
PORT=5000
DATABASE_URL=            # Supabase pooled connection (port 6543)
DIRECT_URL=               # Supabase direct connection (port 5432) — needed for migrations
JWT_ACCESS_SECRET=
JWT_REFRESH_SECRET=
JWT_ACCESS_EXPIRY=2h
CORS_ORIGIN=http://localhost:5173
ADMIN_SEED_EMAIL=
ADMIN_SEED_PASSWORD=
```

**Frontend** (`frontend/.env`):
```env
VITE_API_URL=http://localhost:5000/api/v1
VITE_SOCKET_URL=http://localhost:5000
```

---

## 📡 API Reference
Full endpoint list in `docs/API.md` — covers Auth, Shops, Menu, Orders, Queue, Bulk Orders, Favorites, Notifications, Reviews, Messages, AI, Reports, Vendor, Admin.

## ⚡ Real-Time Events (Socket.io)
| Event | Description |
|---|---|
| `queue:update` | Live queue position changes |
| `inventory:update` | Stock/availability tier changes |
| `order:status` | Order status transitions |
| `kitchen:load` | Kitchen load level (Low/Medium/Heavy) |
| `seat:status` | Seat availability tier changes |
| `message:new` | New order-chat message |
| `notification:new` | Personal notification |

Clients must `emit('shop:subscribe', shopId)` or `emit('order:subscribe', orderId)` to join the relevant room before these events arrive.

---

## ☁️ Deployment

| Layer | Platform |
|---|---|
| Frontend | Vercel (Root Directory: `frontend`) |
| Backend | Render (Root Directory: `backend`, Start: `npx prisma migrate deploy && node src/server.js`) |
| Database | Supabase PostgreSQL |

⚠️ Camera-based features (QR scan, seat monitor) require HTTPS or `localhost` — this works automatically once deployed on Vercel/Render, both HTTPS by default.

---

## 🧭 Design Principles

1. **No fake data, ever.** Every row is created via real registration, menu entry, or order placed through the running app — the seed script only creates the first Admin account.
2. **Derived state, not duplicated state.** Stock tiers and seat status are computed/verified from real quantities and camera counts, never free-typed exact numbers.
3. **Vendor judgment over algorithmic guessing where it matters.** Wait-time is a vendor-set promise (not a formula) because the vendor has real visibility into kitchen parallelism and walk-in orders that no algorithm can see.
4. **Human-in-the-loop AI.** Both AI features assist but never auto-commit — extracted menu items are reviewed before saving; seat detection only automates a decision a vendor could already make manually.
5. **Soft-delete over hard-delete.** Shops and menu items are deactivated, not destroyed, preserving order history and analytics integrity.
6. **Per-shop scoping for penalties.** COD no-show strikes are scoped to (student, shop) — never a student's whole account.
7. **Zero external AI API cost.** Both AI features (OCR, computer vision) run locally/in-browser — no API keys, no per-request billing, fully self-hostable.
