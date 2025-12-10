# Backend Architecture

## Tech Stack
- Node.js + TypeScript
- Fastify HTTP server
- Prisma 7 targeting Supabase Postgres
- PostgreSQL adapter via `@prisma/adapter-pg` + `pg`
- JWT auth with `@fastify/jwt`
- Validation with Zod

## Lifecycle
- Load env with `dotenv` inside `src/config/env.ts` (guards required vars, parses PORT).
- Build Fastify in `src/server.ts`, register plugins (CORS, JWT), then register routes.
- Start server with `app.listen` using the parsed PORT.

## Folder Structure
- `src/config`: `env.ts` (env loading), `prisma.ts` (Prisma client using pg adapter).
- `src/plugins`: `cors.ts`, `jwt.ts` (authenticate decorator populates `request.userId`/`organizationId`).
- `src/routes`: `health.ts`, `auth.ts`, `org.ts`, `projects.ts`.
- `src/generated`: Prisma client output.
- `prisma/`: schema and migrations; datasource URL configured via `prisma.config.ts`.
- `docs/`: project docs.

## Modules
- `env.ts`: loads env with dotenv, validates required keys (`DATABASE_URL`, `JWT_SECRET`), parses PORT.
- `prisma.ts`: creates shared PrismaClient with `PrismaPg` adapter and pg Pool; exports singleton.
- Plugins:
  - `cors.ts`: permissive CORS with credentials enabled.
  - `jwt.ts`: registers JWT (HS256), adds `fastify.authenticate` to verify tokens and attach claims.
- Routes:
  - `health`: `GET /health`.
  - `auth`: signup/login/me with bcrypt, JWT issuance, membership creation on signup.
  - `org`: org profile and seat usage, membership checks.
  - `projects`: list and create projects scoped to `organizationId`, Zod-validated queries/bodies.

## Conventions
- Zod for query/body validation; reply with 400 + issues on failure.
- Always scope Prisma queries by `organizationId` from JWT; verify membership first.
- JWT Bearer in `Authorization` header; re-run `jwtVerify` in handlers when claims are needed.
- Project/organization slugs generated via lowercase/dash utility with numeric suffixes for uniqueness.
