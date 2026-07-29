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

## Deploying with Dokploy

1. Push this repo to a git remote Dokploy can access.
2. In Dokploy, create a new **Compose** application pointing at this repo, using `docker-compose.yml`.
3. Set environment variables in Dokploy (mirrors `.env.example`): `POSTGRES_USER`, `POSTGRES_PASSWORD`, `POSTGRES_DB`, `CORS_ORIGINS`, `NEXT_PUBLIC_API_URL`.
   - `NEXT_PUBLIC_API_URL` is baked into the frontend at **build time** — set it to the public API domain before deploying, and redeploy the frontend if it changes.
   - `CORS_ORIGINS` must include the frontend's public domain (JSON array, e.g. `["https://app.yourdomain.com"]`).
4. In Dokploy's **Domains** tab, attach your Cloudflare-managed domain to the `frontend` service (container port `3000`) and a subdomain (e.g. `api.yourdomain.com`) to the `backend` service (container port `8000`). Dokploy's Traefik handles routing; the `ports:` entries in `docker-compose.yml` are for local/direct access and aren't required for Dokploy routing.
5. Point the domains at your VPS in Cloudflare (proxied or DNS-only, per your existing Dokploy/Cloudflare setup), then deploy.

The Postgres data lives in the `db_data` named volume — back it up before any destructive redeploys.
