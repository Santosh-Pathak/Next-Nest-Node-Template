# Next + Nest Template

Starter template with:

- **frontend/** — Next.js (App Router) + Tailwind + auth UI, users, themes, example Items CRUD
- **backend/** — NestJS + MongoDB + JWT auth, users, file upload, themes, health, rate limits, Pino
- **infra/** — Terraform for Azure VM (replace org-specific modules/secrets)
- **scripts/** — VM bootstrap / nginx / deploy helpers

## Quick start (local)

### 1) Infra deps (Mongo + Mailhog)

```bash
docker compose -f docker-compose.dev.yml up -d
```

Mailhog UI: http://localhost:8025

### 2) Backend

```bash
cd backend
cp .env.example .env
npm install --legacy-peer-deps
npm run seed
npm run start:dev
```

- API: `http://localhost:3000/api/v1`
- Health: `http://localhost:3000/api/v1/health`
- Ready: `http://localhost:3000/api/v1/health/ready`
- Swagger (non-prod): `http://localhost:3000/api/docs`

Default seed admin: `admin@example.com` / `Admin@123`

### 3) Frontend

```bash
cd frontend
cp .env.example .env.local
npm install
npm run dev
```

App: `http://localhost:3000` (or Next’s port)

## Full stack via Docker

```bash
docker compose up --build
```

- Frontend: http://localhost:3000  
- Backend: http://localhost:3001  
- Mailhog: http://localhost:8025  

## Roles

- `superAdmin`
- `admin`
- `developer` (default on signup)

## Architecture notes

| Concern | Implementation |
|--------|----------------|
| Logging | Pino via `nestjs-pino` + `x-request-id` |
| Rate limit | `@nestjs/throttler` (`RATE_LIMIT_TTL` / `RATE_LIMIT_MAX`) |
| Health | Terminus liveness + Mongo readiness |
| Example CRUD | `Items` module (BE + FE `/items`) — copy this pattern |
| Seed | `npm run seed` / `npm run seed -- --reset` |
| FE env | Zod-validated `src/config/env.ts` |

## Copying a new feature

1. Duplicate `backend/src/modules/items`
2. Duplicate `frontend/src/app/(pages)/items` + `services/apis/items.api.ts` + `types/item.ts`
3. Register the Nest module in `app.module.ts`
4. Add nav entry in `frontend/src/config/navigation.config.ts` and route in `proxy.ts`
