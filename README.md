# Event Planner

Separate `backend/` (Express + Knex + Postgres) and `frontend/` (Next.js) apps.

## Backend

```sh
cd backend
cp .env.example .env
npm install
npm run db:up        # docker compose postgres from .env
npm run db:migrate
npm run dev          # http://localhost:9000
```

Compose reads `DB_USERNAME`, `DB_PASSWORD`, `DB_NAME`, `DB_PORT` from `backend/.env`.

## Frontend

```sh
cd frontend
cp .env.example .env
npm install
npm run dev          # http://localhost:3000
```

`API_URL` should point at the backend (default `http://localhost:9000`).

## Notes

- CI: `.github/workflows/ci.yml` builds backend + frontend separately.