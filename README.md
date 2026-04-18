# VITals

Internal hospital utility for VIT University students and faculty: OPD booking, lab test ordering, and encrypted medical records vault.

## What You Will Run

- Web app on port 3000
- API on port 8000
- PostgreSQL on port 5432
- Redis on port 6379
- MinIO API on port 9000 and console on port 9001

## Tech Stack

- Frontend: Next.js 14 (App Router), Tailwind CSS
- Backend: FastAPI, SQLAlchemy (async), Alembic
- Data: PostgreSQL, Redis, MinIO (S3-compatible)
- Monorepo: pnpm workspaces + Turbo

## Prerequisites

- Node.js 18+
- pnpm 9+
- Python 3.11+
- Docker Desktop (or Docker Engine)

### Verify prerequisites

```powershell
node -v
pnpm -v
python --version
docker --version
docker compose version
```

If pnpm is missing:

```powershell
npm i -g pnpm
```

## 1. Install Dependencies

From the repository root:

```powershell
pnpm install
```

## 2. Configure Authentication (Google OAuth)

This project uses Google login through NextAuth.

1. Go to Google Cloud Console.
2. Create a project (or reuse an existing one).
3. Enable OAuth consent screen.
4. Create OAuth client credentials of type Web application.
5. Add these Authorized redirect URIs:
	- http://localhost:3000/api/auth/callback/google
6. Copy Client ID and Client Secret for env setup.

## 3. Configure Environment Files

Create these files from the examples.

### Web env

Create `apps/web/.env.local` from `apps/web/.env.example`.

Minimum values to set:

- NEXTAUTH_SECRET: any long random string
- NEXTAUTH_URL: http://localhost:3000
- GOOGLE_CLIENT_ID: from Google Cloud
- GOOGLE_CLIENT_SECRET: from Google Cloud
- API_URL: http://localhost:8000
- ADMIN_EMAILS: comma-separated admin emails

Example:

```env
NEXTAUTH_SECRET=replace-with-long-random-value
NEXTAUTH_URL=http://localhost:3000
GOOGLE_CLIENT_ID=your-google-client-id
GOOGLE_CLIENT_SECRET=your-google-client-secret
API_URL=http://localhost:8000
ADMIN_EMAILS=robomaneet@gmail.com
```

### API env

Create `apps/api/.env` from `apps/api/.env.example`.

Recommended local values:

```env
DATABASE_URL=postgresql+asyncpg://vitals:password@localhost:5432/vitals
REDIS_URL=redis://localhost:6379
MINIO_ENDPOINT=localhost:9000
MINIO_ACCESS_KEY=minioadmin
MINIO_SECRET_KEY=minioadmin
MINIO_BUCKET=vitals-records
JWT_SECRET=replace-with-same-value-as-nextauth-secret
FERNET_KEY=
FRONTEND_URL=http://localhost:3000
ADMIN_EMAILS=robomaneet@gmail.com
```

Note:
- Keep JWT_SECRET aligned with your web auth secret for local consistency.
- FERNET_KEY can remain blank for local scaffold mode.

## 4. Start Local Infrastructure

From the repository root:

```powershell
docker compose up -d
```

This starts:

- PostgreSQL on `localhost:5432`
- Redis on `localhost:6379`
- MinIO API on `localhost:9000` and console on `localhost:9001`

Optional: verify containers are healthy.

```powershell
docker compose ps
```

## 5. Start Backend (FastAPI)

In a new terminal:

```powershell
cd apps/api
python -m venv .venv
.\.venv\Scripts\Activate.ps1
pip install -r requirements.txt
alembic upgrade head
uvicorn main:app --reload --host 0.0.0.0 --port 8000
```

API health check:

Open in browser or curl:

```powershell
curl http://localhost:8000/health
```

Expected response:

```json
{"status":"ok"}
```

## 6. Start Frontend (Next.js)

In another terminal from repository root:

```powershell
pnpm --filter @vitals/web dev
```

Open:

`http://localhost:3000`

## 7. First Login and Role Behavior

1. Sign in using a Google account that matches the allowed domain logic.
2. API creates or updates your user profile on first login.
3. If your email is in ADMIN_EMAILS, you get ADMIN role and can access /admin.

Default admin email in this codebase is:

- robomaneet@gmail.com

## 8. Typical Development Workflow

Run infra once:

```powershell
docker compose up -d
```

Then use two terminals:

Terminal A (API):

```powershell
cd apps/api
.\.venv\Scripts\Activate.ps1
uvicorn main:app --reload --host 0.0.0.0 --port 8000
```

Terminal B (Web):

```powershell
pnpm --filter @vitals/web dev
```

## Useful Commands

From repository root:

```powershell
pnpm typecheck
pnpm --filter @vitals/web build
```

Backend migration commands:

```powershell
cd apps/api
alembic upgrade head
alembic revision --autogenerate -m "describe change"
```

Populate local database with random doctors, slots, users, bookings, lab orders, and records:

```powershell
cd apps/api
.\.venv\Scripts\Activate.ps1
python scripts/seeder.py --reset
```

Useful options:

```powershell
python scripts/seeder.py --reset --doctors 30 --students 100 --days 14
python scripts/seeder.py --skip-records
```

## 9. Smoke Test Checklist

- Web opens at http://localhost:3000
- API health is OK at /health
- Login redirects to dashboard
- OPD, Lab, Records pages render
- Admin pages are blocked for non-admin users

## 10. Troubleshooting

### Port already in use

- Stop conflicting process or change port mappings.
- Check running containers with:

```powershell
docker compose ps
```

### OAuth login fails

- Ensure redirect URI is exactly:
	- http://localhost:3000/api/auth/callback/google
- Ensure NEXTAUTH_URL is http://localhost:3000
- Ensure GOOGLE_CLIENT_ID and GOOGLE_CLIENT_SECRET are valid.

### API cannot connect to database

- Confirm postgres container is running.
- Confirm DATABASE_URL in apps/api/.env matches docker-compose credentials.
- Re-run migrations:

```powershell
cd apps/api
alembic upgrade head
```

### MinIO upload issues

- Open MinIO console at http://localhost:9001 and verify credentials.
- Ensure MINIO_ENDPOINT and keys in apps/api/.env are correct.

### Admin page redirects unexpectedly

- Ensure your email is in ADMIN_EMAILS in both web and api env files.
- Sign out and sign in again after changing admin env values.

## Notes

- Admin route access is role-protected.
- Google OAuth is required for full auth flow.
- This repo currently contains scaffold and sample UI data in several pages.

## 11. Deploy on Render and Vercel

Recommended setup:

- API on Render
- Web on Vercel
- Managed PostgreSQL and Redis on Render
- S3-compatible object storage for records/QR images (AWS S3, Cloudflare R2, or MinIO endpoint)

### A. Deploy API to Render

1. In Render, create a new Web Service from this repository.
2. Set Root Directory to:

```text
apps/api
```

3. Set Build Command:

```bash
pip install -r requirements.txt && alembic upgrade head
```

4. Set Start Command:

```bash
uvicorn main:app --host 0.0.0.0 --port $PORT
```

5. Set environment variables for the API service:

- DATABASE_URL: Render Postgres URL converted to async SQLAlchemy form.
If Render gives `postgresql://...`, change it to `postgresql+asyncpg://...`
- REDIS_URL: from Render Redis
- MINIO_ENDPOINT: your S3-compatible endpoint
- MINIO_ACCESS_KEY
- MINIO_SECRET_KEY
- MINIO_BUCKET
- JWT_SECRET
- FRONTEND_URL: your Vercel domain, for example `https://your-app.vercel.app`
- ADMIN_EMAILS: `robomaneet@gmail.com` (or comma-separated list)

6. Deploy and verify API health:

```text
https://<your-render-service>/health
```

Expected:

```json
{"status":"ok"}
```

### B. Deploy Web to Vercel

1. Import the same repository in Vercel.
2. Set project Root Directory to:

```text
apps/web
```

3. Configure environment variables in Vercel:

- NEXTAUTH_SECRET: long random string
- NEXTAUTH_URL: your Vercel production URL
- GOOGLE_CLIENT_ID
- GOOGLE_CLIENT_SECRET
- API_URL: your Render API URL (example `https://<your-render-service>.onrender.com`)
- ADMIN_EMAILS: `robomaneet@gmail.com`

4. In Google Cloud OAuth client, add authorized redirect URIs:

- Production:
`https://<your-vercel-domain>/api/auth/callback/google`
- Optional preview domains if needed.

5. Deploy and verify:

- Open the Vercel app URL.
- Sign in with Google.
- Confirm dashboard routes are protected and redirect to `/login` when signed out.
- Confirm checkout, OPD slots, and records load correctly.

### C. Production Tips

- Keep API and web `ADMIN_EMAILS` aligned.
- Run `alembic upgrade head` on every API deploy.
- Use strong secrets for NEXTAUTH_SECRET and JWT_SECRET.
- Ensure CORS `FRONTEND_URL` exactly matches deployed Vercel domain.

## Stopping Services

To stop containers:

```powershell
docker compose down
```

To remove local volumes too (fresh reset):

```powershell
docker compose down -v
```
