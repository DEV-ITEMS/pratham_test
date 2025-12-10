# Backend Plan — Interior Showcase

## 1. Overview

Interior Showcase currently mocks every domain inside the frontend. The new backend will expose real APIs that persist data for organizations running 360° interior presentations and sharing them with clients. Responsibilities:
- Manage org-scoped projects, scenes, members, and sharing rules.
- Serve viewer-friendly hierarchy payloads (buildings → flats → rooms → views) and navigation pins.
- Handle panorama uploads (Supabase Storage) and asset metadata.
- Track basic analytics events (views, snapshots) for dashboards.

**Tech stack:** Node.js + TypeScript, Fastify HTTP server, Prisma ORM targeting Supabase Postgres, Supabase Storage for file uploads, deployed to Render as a containerized Node web service.

## 2. Domains & Use Cases

- **Auth & Users** — Email/password auth for designers; fetch current user and their org membership.
- **Organizations & Members & Seat usage** — CRUD for org profile, list members, track available seats per subscription tier.
- **Projects & Tags & Visibility** — Create/manage projects with portfolio/public flags, tags, descriptions, visibility (PUBLIC / INVITE_ONLY / PRIVATE).
- **Buildings / Flats / Rooms / Views hierarchy** — Maintain the nested structure of a project down to individual 360° views, including default orientation metadata.
- **Pins & Assets** — Store navigation pins linking rooms/views and asset metadata (panorama URLs, thumbnails, dimensions).
- **Uploads** — Upload and register new panorama assets via Supabase Storage, updating both asset metadata and derived room views.
- **Sharing** — Generate/update share links, share restrictions, and invitees for each project (feeds viewer route `/p/:slug`).
- **Analytics** — Log viewer events (view load, snapshot download) and expose aggregate stats for dashboard/portfolio/public pages.

## 3. Entities & Relationships (Data Model)

- **User** — `id`, `email`, `passwordHash`, `name`, `avatarUrl`, `role` (ADMIN/EDITOR/VIEWER). A user can belong to many orgs via Membership.
- **Organization** — `id`, `name`, `slug`, `logoUrl`, `primaryColor`, `seatLimit`. Owns projects and memberships.
- **Membership** — `id`, `userId`, `organizationId`, `role`, `createdAt`. Enforces multi-tenancy: all user access to org data goes through membership.
- **Project** — `id`, `organizationId`, `name`, `slug`, `visibility`, `portfolio` (bool), `description`, `heroAssetId`, timestamps, `tags[]`. Has many buildings and share links.
- **Building** — `id`, `projectId`, `name`, `address`, `order`.
- **Flat** — `id`, `buildingId`, `name`, `level`, `order`.
- **Room** — `id`, `flatId`, `name`, `description`, `order`.
- **View** — `id`, `roomId`, `name`, `panoramaAssetId`, `description`, `defaultYaw`, `defaultPitch`, `compass`, `createdAt`.
- **Pin** — `id`, `fromViewId`, `label`, `targetRoomId`, `targetViewId`, `yaw`, `pitch`. Each pin belongs to a single originating view.
- **Asset** — `id`, `organizationId`, `kind` (PANORAMA|THUMBNAIL|LOGO), `url`, `width`, `height`, `altText`, `storageKey`. Linked from projects/views.
- **ShareLink** — `id`, `projectId`, `slug`, `restriction` (PUBLIC/INVITE_ONLY/PRIVATE), `invitees[]`, `passwordHash`, `expiresAt`.
- **AnalyticsEvent** — `id`, `projectId`, `viewId`, `type` (VIEWED|SNAPSHOT|SHARE_OPEN), `origin` (public/editor), `createdAt`, `metadata (JSONB)`.

**Slug uniqueness:**
- `Organization.slug` is **globally unique** (used in `/portfolio/:orgSlug`).
- `Project.slug` is **unique per `organizationId`** (same slug can exist in different orgs, but not within one org).
- `ShareLink.slug` is treated as **globally unique** for public URLs like `/p/:slug`.

**Multi-tenancy:**  
All entities are either directly scoped by `organizationId` (e.g., Project, Asset) or indirectly via their parent chain (Building → Project → Organization, etc.). Prisma should enforce cascading deletes with `onDelete: Cascade` along the hierarchy. All read/write queries must always include an `organizationId` filter derived from the authenticated user’s membership to prevent cross-tenant access. Tokens must never allow a user to operate on an org they do not have a `Membership` for.


## 4. API Surface

### Auth
- `POST /auth/signup` — Create user + membership in default org. Public. Body: `{ name, email, password }`. Response: `{ token, user, organization }`.
- `POST /auth/login` — Authenticate and return JWT. Public. Body: `{ email, password }`. Response: `{ token, user, organization }`.
- `GET /auth/me` — Validate token, return `{ user, organizations[] }`. Requires auth.

### Organization & Members
- `GET /org` — Current org profile. Requires org user. Response: org details.
- `GET /org/members` — List memberships with seat usage info. Requires org admin/editor. Response: array of `{ user, role }`.
- `GET /org/seat-usage` — Return `{ used, available, limit }`. Requires org user.
- `POST /org/members` — Invite/add member (future). Requires admin.

### Projects
- `GET /projects` — List projects for org (filters: `portfolio`, `visibility`). Requires org user.
- `POST /projects` — Create project. Requires editor/admin.
- `GET /projects/:slug` — Fetch project by slug, scoped to org. Requires org user (private) or share token if public slug.
- `PATCH /projects/:id` — Update metadata, tags, hero asset. Requires editor/admin.
- `DELETE /projects/:id` — Soft delete. Requires admin.

### Hierarchy

- `GET /projects/:id/hierarchy` — Primary hierarchy endpoint used by the editor. Returns the full nested tree for a project:

  ```jsonc
  {
    "project": { ... },
    "buildings": [
      {
        "id": "...",
        "name": "...",
        "flats": [
          {
            "id": "...",
            "name": "...",
            "rooms": [
              {
                "id": "...",
                "name": "...",
                "views": [ { "id": "...", "name": "...", "panoramaAssetId": "...", ... } ]
              }
            ]
          }
        ]
      }
    ],
    "initialSelection": {
      "buildingId": "...",
      "flatId": "...",
      "roomId": "...",
      "viewId": "..."
    }
  }


### Viewer Data
- `GET /views/:id` — View metadata + asset info. Requires org user or share token.
- `GET /views/:id/pins` — Navigation pins for view.
- `GET /views/:id/asset` — Full asset payload (URL, dimensions).

### Uploads
- `POST /uploads/panorama` — Requires editor/admin. v1 behavior: the backend accepts a multipart upload, streams it to Supabase Storage, creates an `Asset` row (kind = PANORAMA), and optionally attaches it to a given `roomId`/`viewId`. Returns `{ assetId, storageKey, url, viewId? }`.

**Future direction:** move towards a signed-URL flow where:
- Backend issues a signed upload URL from Supabase Storage.
- Frontend uploads directly to Storage.
- Backend endpoint is then called only to register the uploaded asset (metadata + associations) rather than streaming the file.

### Sharing
- `GET /share-links` — List share settings per project. Requires editor/admin.
- `POST /share-links` — Create or update share link (restriction, invitees). Requires editor/admin.
- `GET /p/:slug` (backing API) — Public project payload (project, current scene, pins). Public if restriction allows.

### Analytics
- `POST /analytics/events` — Record viewer events (projectId, viewId, type). Public (with share token) or org user.
- `GET /analytics/summary` — Aggregated metrics per project (views, snapshots, lastViewedAt). Requires org user.

## 5. Auth, Security & Multi-Tenancy

- **Auth flow:** Email/password stored hashed (bcrypt). Login/signup issue JWT (HS256 or Supabase JWT secret). Fastify JWT plugin validates tokens, attaches `userId`.

If a user belongs to multiple organizations (multiple Membership rows), the client should indicate the active organization (e.g., `activeOrgId` in the token or a header), and all queries must be scoped accordingly. For now, Interior Showcase can assume a single active org per session.


- **Org scoping:** Each token includes `organizationId`. Middleware fetches membership to ensure user belongs to org and applies `WHERE organizationId = currentOrgId` on queries.
- **Authorization:**
  - Admin: manage org, members, delete projects.
  - Editor: create/update projects, hierarchy, assets, share links.
  - Viewer: read org data, use editor viewer, view analytics dashboards.
  - Public share: access limited `/p/:slug`, `GET /views/:id/*`, `POST /analytics/events` when restriction allows (PUBLIC or invite token).
- **Share tokens:** For INVITE_ONLY share links, issue signed tokens or short-lived codes tied to invite email.

## 6. Non-Functional Requirements

- **Validation:** Use Zod schemas (shared between Fastify routes) to validate payloads and sanitize output DTOs.
- **Pagination & Filtering:** Apply limit/offset for list endpoints (`/projects`, members, analytics summaries). Support `?page`/`?pageSize`, `?visibility`, `?portfolio`.
- **Error handling:** Return RFC7807-style JSON: `{ status, code, message, details }`. Distinguish 401, 403, 404, 409, 422.
- **Logging & Observability:** Fastify Pino logger with structured logs; add request IDs. Render offers basic logs, but consider tracing via OpenTelemetry later.
- **Performance:** Use Prisma connection pooling (pgBouncer). Cache heavy hierarchy responses with Redis (future) or short-lived in-memory cache per project.
- **File uploads:** Enforce max file size, validate 2:1 aspect ratio server-side, store metadata in `Asset` table with Supabase Storage key.

## 7. Migration Notes (from mocks to backend)

Map existing `apiClient` calls → backend endpoints:

- `fetchOrg` → `GET /org`
- `fetchOrgMembers` → `GET /org/members`
- `fetchSeatUsage` → `GET /org/seat-usage`
- `fetchProjects`/`fetchPortfolioProjects` → `GET /projects?portfolio=true`
- `fetchProjectBySlug` → `GET /projects/:slug`
- `fetchPublicProject` → `GET /p/:slug`
- `fetchProjectHierarchy` → `GET /projects/:id/buildings?includeHierarchy=true`
- `fetchHierarchyTree` → `GET /projects/:id/buildings?tree=true`
- `fetchInitialSelection` → optional field on hierarchy response or `GET /projects/:id/initial-selection`
- `fetchRoomViews` → `GET /rooms/:id/views`
- `fetchPinsForView` → `GET /views/:id/pins`
- `fetchPanoramaAsset` → `GET /views/:id/asset`
- `fetchSharing` / `updateSharing` → `GET/POST /share-links?projectId=...`
- `fetchAnalytics` → `GET /analytics/summary?projectId=...`
- `recordSnapshot` → `POST /analytics/events` with type `SNAPSHOT`

**Frontend adjustments:**
- Replace local storage auth with JWT-based flow; update `AuthProvider` to hit `/auth/*` endpoints.
- React Query keys remain stable but will now hit HTTP endpoints.
- Ensure share/public routes include tokens or slug-based fetching with new shapes (e.g., analytics summary may expose `lastViewedAt`, `totalViews`, `snapshotsDownloaded`).
- Asset URLs will come from Supabase Storage (signed URLs if private); viewer components should handle signed URL expiration refresh.

## 8. Implementation Learnings

- Fastify JWT / `/auth/me`: valid tokens still returned 401 when the decoded payload was not present on the request. Fixes applied: explicitly set HS256 for sign/verify, assign the payload inside `authenticate`, and re-run `jwtVerify` in the handler when claims are required. After changing `JWT_SECRET`, restart and log in again to avoid stale tokens.
- Prisma 7 config: datasource URL lives in `prisma.config.ts` (not in `schema.prisma`). Keep schema url-less to avoid mismatched envs. Use `prisma/config` `env("DATABASE_URL")`.
- Prisma client uses `@prisma/adapter-pg` + `pg` Pool in `src/config/prisma.ts`; reuse the shared singleton to avoid multiple pools.
- Env loading: `dotenv` runs in `env.ts`; always read required vars with guards (`DATABASE_URL`, `JWT_SECRET`, `PORT`). Avoid accessing `process.env` directly in app code.
- JWT + multi-tenancy: `fastify.authenticate` decorates `request.userId` and `request.organizationId` from JWT. Routes must call `request.jwtVerify` when claims are required and always scope Prisma queries by `organizationId`. Verify membership (`membership.findUnique`) before accessing org data.
- Prisma 7 pitfalls: keep `engineType` defaults; avoid putting the database URL in `schema.prisma` to prevent dev/prod drift. If auth returns 401 unexpectedly, log `Authorization` and `jwtVerify` errors as in `agent.md`.
