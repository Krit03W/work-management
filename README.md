# Work Management

Personal tool for tracking clients, projects, quotations, requirement docs, and notes across a full-time job, freelance work, and solopreneur ventures.

## Stack

- Frontend: Next.js 16 (App Router) + React + TypeScript, Tailwind CSS
- Backend: FastAPI + SQLAlchemy + Alembic
- Database: PostgreSQL
- Deployment: Docker Compose via Dokploy, domain via Cloudflare

## Project structure

```
backend/    FastAPI app, SQLAlchemy models, Alembic migrations
frontend/   Next.js app
docker-compose.yml   Full stack: db, backend, frontend
```

## Local development

### Backend

Requires [uv](https://docs.astral.sh/uv/).

```bash
cd backend
uv sync
cp .env.example .env   # edit POSTGRES_* to point at a local Postgres
uv run alembic upgrade head
uv run uvicorn app.main:app --reload
```

API docs at http://localhost:8000/docs.

### Frontend

```bash
cd frontend
npm install
cp .env.example .env.local
npm run dev
```

App at http://localhost:3000. Set `NEXT_PUBLIC_API_URL` in `.env.local` to the backend URL.

### Full stack via Docker Compose

```bash
cp .env.example .env   # edit values
docker compose up --build
```

This runs Postgres, the backend (migrations run automatically on container start), and the frontend.

## Data model

- **Client** — contact/company info
- **Project** — belongs to a client (optional), tagged `full_time` / `freelance` / `solopreneur`, tracked through `lead → quoted → in_progress → completed → archived`
- **Quotation** — line items + auto-computed total, belongs to a project
- **RequirementDoc** — versioned markdown doc, belongs to a project
- **Note** — freeform, optionally linked to a project
- **GoogleAccount** — single row storing the connected Google account's OAuth refresh/access token, for calendar sync

## Deploying with Dokploy

1. Push this repo to a git remote Dokploy can access.
2. In Dokploy, create a new **Compose** application pointing at this repo, using `docker-compose.yml`.
3. Set environment variables in Dokploy (mirrors `.env.example`): `POSTGRES_USER`, `POSTGRES_PASSWORD`, `POSTGRES_DB`, `CORS_ORIGINS`, `NEXT_PUBLIC_API_URL`, `FRONTEND_URL`, `GOOGLE_CLIENT_ID`, `GOOGLE_CLIENT_SECRET`, `GOOGLE_REDIRECT_URI`.
   - `NEXT_PUBLIC_API_URL` is baked into the frontend at **build time** — set it to the public API domain before deploying, and redeploy the frontend if it changes.
   - `CORS_ORIGINS` must include the frontend's public domain (JSON array, e.g. `["https://app.yourdomain.com"]`).
   - `FRONTEND_URL` is where the backend redirects the browser back to after Google OAuth — set it to the frontend's public domain.
   - `GOOGLE_CLIENT_ID` / `GOOGLE_CLIENT_SECRET` / `GOOGLE_REDIRECT_URI` — see [Google Calendar sync](#google-calendar-sync) below.
4. In Dokploy's **Domains** tab, attach your Cloudflare-managed domain to the `frontend` service (container port `3000`) and a subdomain (e.g. `api.yourdomain.com`) to the `backend` service (container port `8000`). Dokploy's Traefik routes to these via the internal docker network — `docker-compose.yml` only `expose`s the ports internally, it doesn't publish them to the host.
5. Point the domains at your VPS in Cloudflare (proxied or DNS-only, per your existing Dokploy/Cloudflare setup), then deploy.

The Postgres data lives in the `db_data` named volume — back it up before any destructive redeploys.

## Google Calendar sync

The Calendar page (pull-only: reads your primary Google Calendar, doesn't write to it) needs a Google Cloud OAuth client. One-time setup:

1. Go to [Google Cloud Console](https://console.cloud.google.com/) → create a new project (or reuse one).
2. **APIs & Services → Library** → enable **Google Calendar API**.
3. **APIs & Services → OAuth consent screen**:
   - User type: **External** (fine even for personal use — just add yourself as a test user, or publish it since only you'll ever authorize it).
   - Add the scope `.../auth/calendar.readonly` (and `email`, `openid` if prompted).
   - Add your own Google account under **Test users** if the app stays in "Testing" mode.
4. **APIs & Services → Credentials → Create Credentials → OAuth client ID**:
   - Application type: **Web application**.
   - Authorized redirect URI: `https://api.work.wijak.org/api/v1/calendar/google/callback` (must match `GOOGLE_REDIRECT_URI` exactly, including scheme and path).
5. Copy the generated **Client ID** and **Client secret** into Dokploy's environment variables for the `backend` service:
   ```
   GOOGLE_CLIENT_ID=<client id>.apps.googleusercontent.com
   GOOGLE_CLIENT_SECRET=<client secret>
   GOOGLE_REDIRECT_URI=https://api.work.wijak.org/api/v1/calendar/google/callback
   FRONTEND_URL=https://work.wijak.org
   ```
6. Redeploy the `backend` service so it picks up the new env vars.
7. Open `https://work.wijak.org/calendar` and click **Connect Google Calendar**.

If the connection ever breaks (e.g. you revoke access from your Google Account settings), the Calendar page will show a "connection expired" state — just reconnect.
