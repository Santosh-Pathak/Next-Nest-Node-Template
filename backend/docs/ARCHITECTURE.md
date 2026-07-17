# Backend architecture (foundation)

Starter NestJS + MongoDB API designed for **copy-paste feature growth**.

## Patterns in use

| Pattern | Where | Notes |
|---------|--------|--------|
| **DI / Module** | Nest `@Module` | Prefer constructor injection |
| **Repository (DAO)** | `DocumentDao` | Injected into `BaseService` / feature services |
| **Template Method** | `BaseService` | CRUD skeleton for Items/Users/Themes |
| **Strategy** | `IEmailTransport` | Azure + Nodemailer |
| **Adapter** | `AzureBlobService` → `IStorageService` | File module uses `STORAGE_SERVICE` token |
| **Facade** | `EmailService` | Orchestrates transports + templates |
| **Guard + Decorator** | `AuthorizationGuard` + `@Public` / `@Roles` | OCP-friendly RBAC |
| **Pipeline** | `APP_FILTER` / `APP_INTERCEPTOR` / `APP_GUARD` / `APP_PIPE` | Cross-cutting |

## Validation

Global `AppValidationPipe`:

1. **Zod** DTOs via `createZodDto` (preferred for new modules — see Items)
2. **class-validator** DTOs for remaining modules

Errors return `{ message, errors: string[] }`.

## Adding a feature

1. Duplicate `src/modules/items`
2. Register module in `app.module.ts`
3. Prefer Zod DTOs + thin controller → service → `BaseService`/`DocumentDao`
4. Protect routes with `@AdminOnly()` / `@RequirePermissions()`

## Module map

- `SharedModule` — `DocumentDao`, storage port
- `EmailModule` — email transports + templates
- `AuthModule` — JWT auth use-cases (Passport JWT strategy only)
- `ItemsModule` — example CRUD template
- `HealthModule` — `/health` liveness, `/health/ready` readiness

## Do not

- Construct `DocumentDao` with `new` inside Nest providers (plugins are the exception)
- Accept untyped `@Body()` without a DTO
- Register unused Passport strategies
- Put Azure/email into every feature — import `EmailModule` / use `STORAGE_SERVICE` only where needed
