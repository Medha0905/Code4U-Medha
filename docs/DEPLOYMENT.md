# Deployment Guide

## Database — Supabase PostgreSQL
1. Create a Supabase project.
2. Copy the pooled connection string into `DATABASE_URL` (backend `.env`
   and your Render environment variables).
3. Run `npx prisma migrate deploy` once against it (locally, pointed at
   Supabase, or as a Render pre-deploy command).

## Backend — Render
1. New Web Service → connect the repo → root directory `backend`.
2. Build command: `npm install && npx prisma generate`
3. Start command: `npm start`
4. Environment variables: everything from `backend/.env.example`, with
   `DATABASE_URL` pointing at Supabase and `CORS_ORIGIN` set to your
   deployed frontend URL.
5. Render's URL becomes `VITE_API_URL` / `VITE_SOCKET_URL` for the frontend.

## Frontend — Vercel
1. New Project → root directory `frontend`.
2. Framework preset: Vite.
3. Environment variables: `VITE_API_URL=https://<render-app>.onrender.com/api/v1`,
   `VITE_SOCKET_URL=https://<render-app>.onrender.com`.
4. Deploy.

## Post-deploy checklist
- [ ] `GET /api/v1/health` returns 200 on the Render URL
- [ ] Socket.io connects from the deployed frontend (check browser console)
- [ ] Register a real vendor + student and walk through one full order
- [ ] Confirm PDF report download works (`/reports/daily/pdf`)
