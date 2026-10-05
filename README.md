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

- API docs (Swagger): http://localhost:9000/api/docs
- OpenAPI JSON: http://localhost:9000/api/openapi.json
- Unit tests: `npm test`

Compose reads `DB_USERNAME`, `DB_PASSWORD`, `DB_NAME`, `DB_PORT` from `backend/.env`.

### Auth extras

- **Email verification** — 6-digit OTP, 10 min expiry (logged to server console in development)
- **Refresh tokens** — short access JWT + long refresh JWT; FE retries once on 401
- **2FA** — TOTP + backup codes; login returns `{ requires2FA, userId }` (HTTP 200 challenge)

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
- Interview notes: `intv.readme`
