# Items module (example CRUD)

Copy this folder when adding a new domain feature.

## Endpoints (`/api/v1/items`)

| Method | Path | Roles |
|--------|------|-------|
| POST | `/` | developer, admin, superAdmin |
| GET | `/` | developer, admin, superAdmin |
| GET | `/:id` | developer, admin, superAdmin |
| PATCH | `/:id` | developer, admin, superAdmin |
| DELETE | `/:id` | admin, superAdmin |

## Frontend counterpart

- Page: `frontend/src/app/(pages)/items/page.tsx`
- API: `frontend/src/services/apis/items.api.ts`
- Types: `frontend/src/types/item.ts`
