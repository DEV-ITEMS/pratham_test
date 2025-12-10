# Current Frontend Overview (Interior Showcase)

## 1) Routing Map & Pages
- `/` → Redirects to `/dashboard` (protected).
- `/login` → `LoginPage` (public).
- `/dashboard` → `DashboardPage` (protected via `ProtectedRoute`).
- `/editor/:projectSlug/*` → `EditorShellPage` (protected).
- `/portfolio/:orgSlug` → `PortfolioLanding` (public route; data loads require token).
- `/p/:projectSlug` → `PublicProjectViewer` (public).
- `*` → `NotFoundPage` (404).

Page purposes:
- **DashboardPage**: Shows hero panorama viewer, project list, seat usage chips, and analytics chips; loads org projects and analytics.
- **EditorShellPage**: Full editor shell for a project (hierarchy, pins, panoramas, sharing, analytics, mock upload).
- **PortfolioLanding**: Portfolio viewer for an org slug; previews projects with HUD actions.
- **PublicProjectViewer**: Public-facing viewer for a project slug (no auth required).
- **LoginPage**: Login/signup; default post-login redirect is `/editor/modern-flat-tour` if no prior `state.from`.
- **NotFoundPage**: Catch-all 404 display.

Navigation flow:
- First load at `/` redirects to `/dashboard`. Protected routes redirect unauthenticated users to `/login` with `state.from`.
- `AppLayout` wraps all main routes with top bar and nav drawer.
- Nav drawer shortcuts: Dashboard (`/dashboard`), “Modern Flat Editor” (`/editor/modern-flat-tour`), Portfolio (`/portfolio/${org?.slug ?? 'demo-interiors'}`), Public Viewer (`/p/modern-flat-tour`).

## 2) Providers & Global State
Root providers (`src/main.jsx` order):
- `AppThemeProvider`: MUI theme + CssBaseline; supports light/dark and high-contrast toggles.
- `AppQueryProvider`: React Query client (staleTime 5m, no refetch-on-focus).
- `AuthProvider`: JWT-based session and org/user state.
- `AppRoutes`: Router.

AuthProvider (`src/providers/AuthProvider.jsx`):
- Exposes `{ user, org, seatUsage, token, loading, login, signup, logout }`.
- Persists JWT in `localStorage` (`auth.token`); hydrates on load via `/auth/me` and `/org/seat-usage`.
- `login` calls `/auth/login`; `signup` calls `/auth/signup`; both store token and hydrate state.
- `logout` clears token and state.
- No mock user; relies on backend auth.

## 3) Data Layer & API Client (`src/lib/apiClient.js`)
- Base URL hardcoded: `http://localhost:4000`.
- Adds `Authorization: Bearer <token>` when provided; JSON headers; throws `ApiError` with status/payload on non-2xx.

Methods:
- Auth: `login`, `signup`, `me`.
- Org: `getOrg`, `getSeatUsage`, `fetchOrg` (alias), `fetchOrgBySlug` (matches only current org slug), `fetchOrgMembers` (`/org/members`).
- Projects: `getProjects` (paginated object), `fetchProjects`/`fetchPortfolioProjects` (normalize to array), `fetchProjectBySlug` (tries `/projects/:slug`; on 404 lists `/projects?pageSize=100` and matches slug), `fetchPublicProject` (`/p/:slug`).
- Hierarchy: `fetchProjectHierarchy` (`/projects/:id/buildings?includeHierarchy=true`), `fetchHierarchyTree` (`tree=true`), `fetchInitialSelection` (`/projects/:id/initial-selection`).
- Views/Pins/Assets: `fetchRoomViews`, `fetchPinsForView`, `fetchPanoramaAsset`.
- Sharing: `fetchSharing` (`/share-links?projectId`), `updateSharing` (POST `/share-links`).
- Analytics: `fetchAnalytics` (`/analytics/summary?projectId`), `recordSnapshot` (POST `/analytics/events` with type `SNAPSHOT`).

Hard-coded values:
- Base URL `http://localhost:4000`.
- Fallback slug lookup pagination `pageSize: 100`.
- No hardcoded tokens.

## 4) Mocks & Domain Data
- `src/mocks` contains in-memory mock DB (`data.*.js` for orgs, users, projects, buildings, flats, rooms, views, pins, assets; adapters for getters).
- apiClient no longer uses mocks; remaining mock behavior:
  - `UploadPanoramaDialog` generates in-memory asset/view with `URL.createObjectURL`, no backend call.
  - Legacy adapters unused by apiClient.

## 5) Components Using Data/APIs
- **DashboardPage**: Uses `useAuth` for `org/token`; loads projects via `fetchProjects(..., { token })`; hero analytics via `fetchAnalytics`; scene via `useSceneNavigator(projectId, token)` (hierarchy, pins, assets).
- **EditorShellPage**: Protected; loads project via `fetchProjectBySlug({ token })`; hierarchy, initial selection, sharing, analytics via tokened calls; pins/assets via token; `recordSnapshot` with token; sharing updates call `updateSharing` with token. Assumes project slug exists.
- **PublicProjectViewer**: Public route; project via `fetchPublicProject` (no token); scene via `useSceneNavigator(projectId, token?)`; analytics only if token. Assumes public payload matches editor expectations.
- **PortfolioLanding**: Public route but data requires token; org by slug via `fetchOrgBySlug({ token })` (only matches current org); portfolio projects via `fetchPortfolioProjects({ token, portfolio: true })`; scene via `useSceneNavigator(projectId, token)`. Hard dependency on current org slug match.
- **UploadPanoramaDialog**: Mock upload; validates image dimensions; returns mock asset/view via `onUploaded`; no persistence.
- **ShareDialog / ShareSettingsPanel**: UI to adjust sharing; parent (EditorShellPage) wires `onChange` to `updateSharing(project.id, payload, { token })`.
- **PanoramaViewer**: Consumes props (`panoramaUrl`, `pins`, `view`); no fetching.
- **ViewThumbnails**: Fetches panorama assets via `fetchPanoramaAsset(assetId, { token })`; accepts optional `token`.
- **ViewerHudRibbon**: UI-only; no data fetching.

## 6) Auth & Protected Routes Behavior
- `ProtectedRoute`: Shows spinner while `loading`; redirects unauthenticated users to `/login` with `state.from`; otherwise renders children.
- Login flow: `LoginPage` uses `useAuth().login/signup`; on success navigates to `state.from` or default `/editor/modern-flat-tour`.
- Auth validation uses backend `/auth/login`/`/auth/signup`/`/auth/me`; stores JWT in localStorage.
- Public routes: `/login`, `/portfolio/:orgSlug`, `/p/:projectSlug`, `*`. Protected: `/dashboard`, `/editor/:projectSlug`.

## 7) Hardcoded Values Summary
- API base URL: `http://localhost:4000`.
- Default post-login redirect: `/editor/modern-flat-tour` (when no `state.from`).
- Nav drawer shortcuts:
  - Editor: `/editor/modern-flat-tour`
  - Public viewer: `/p/modern-flat-tour`
  - Portfolio fallback org slug: `demo-interiors` when `org?.slug` missing.
- `fetchOrgBySlug` only returns the current authed org if its slug matches.
- Slug fallback fetch uses `/projects?pageSize=100` then client-side match.
- Upload mock IDs: `asset-upload-*`, `view-upload-*`, `room-temp` placeholder.

## 8) Known / Potential Integration Issues
1. Default login redirect assumes a project with slug `modern-flat-tour`; will 404 if backend data differs.
2. Nav drawer hardcodes `modern-flat-tour` and `demo-interiors`; may not exist in real data.
3. `fetchOrgBySlug` is not a true slug lookup; `/portfolio/:orgSlug` effectively requires the current authed org to match the slug and a token.
4. Portfolio route is public but its data calls require a token; unauthenticated users see empty/failed loads.
5. Editor relies on `/projects/:slug`; fallback list match uses `pageSize=100` and may miss items; also assumes slug uniqueness within that page.
6. Public viewer uses `fetchPublicProject` for data but loads analytics only with a token; payload shape must match editor expectations or scene rendering may fail.
7. Upload flow is mocked; assets/views are not persisted to the backend.
8. Sharing/analytics/pins/hierarchy shapes are assumed to match backend docs; mismatches will break UI (e.g., missing `buildings.flats.rooms.views` nesting).
9. Seat usage/org load depends on `/org` and `/org/seat-usage`; if token lacks org claims or endpoints differ, AuthProvider clears session.
10. No graceful handling if backend lacks `modern-flat-tour` or portfolio org slug; results in “Project not found” states.
