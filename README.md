# Next + Nest Template

Starter template with:

- **frontend/** — Next.js (App Router) + Tailwind + auth UI, users, themes
- **backend/** — NestJS + MongoDB + JWT auth, users, file upload, themes
- **infra/** — Terraform for Azure VM (replace org-specific modules/secrets)
- **scripts/** — VM bootstrap / nginx / deploy helpers

## Quick start

### Backend

```bash
cd backend
cp .env.example .env
npm install --legacy-peer-deps
npm run start:dev
```

API docs (non-production): `http://localhost:3000/api/docs`

### Frontend

```bash
cd frontend
cp .env.example .env.local   # create if missing; set NEXT_PUBLIC_API_BASE_URL
npm install
npm run dev
```

App: `http://localhost:3000` (or Next’s configured port)

## Roles

Aligned across frontend and backend:

- `superAdmin`
- `admin`
- `developer` (default on signup)

## Logging

Backend uses **Pino** via `nestjs-pino`. Set `LOG_LEVEL` (`info`, `debug`, …). Pretty-print in development.
