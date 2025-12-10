# Frontend ⇄ Backend Integration Plan (Interior Showcase)

## 1) Introduction
Goal: connect the existing React/Vite frontend to the Fastify/Prisma/Supabase backend in a robust way, replacing mocks and hardcoded slugs with real data flows. This plan maps current behavior to the documented backend API and outlines phased steps to align routing, auth, projects, hierarchy, sharing, analytics, and uploads with the real service.

## 2) Current State Summary
- Routing: `/` → `/dashboard` (protected), `/dashboard` and `/editor/:projectSlug` behind `ProtectedRoute`; public routes `/login`, `/portfolio/:orgSlug` (but data requires token), `/p/:projectSlug`, `*` (404). Default post-login redirect `/editor/modern-flat-tour`. Nav drawer links hardcode `modern-flat-tour`, `demo-interiors`.
- Data layer: `apiClient` uses `http://localhost:4000` with JWT Bearer when provided. Calls `/auth/*`, `/org`, `/org/seat-usage`, `/org/members`, `/projects` (paginated), `/projects/:slug` with fallback list match, hierarchy (`/projects/:id/buildings`), `/views/:id/*`, `/rooms/:id/views`, `/share-links`, `/analytics/*`. No mocks used here.
- Mocks: Still present under `src/mocks` but unused by `apiClient`; `UploadPanoramaDialog` is fully mocked (in-memory asset/view). Some flows assume mock-like data shapes.
- Hardcoded values: Base URL `http://localhost:4000`; slugs `modern-flat-tour` and fallback org slug `demo-interiors`; fallback slug lookup `pageSize=100`; mock upload IDs (`asset-upload-*`, `view-upload-*`, `room-temp`).

## 3) Key Issues & Risks
- ISSUE-ROUTING-1: Root/login redirects assume project slug `modern-flat-tour` exists; 404s if backend data differs (routes/index.jsx, LoginPage).
- ISSUE-NAV-1: Nav drawer hardcodes editor/public viewer slugs and fallback org slug `demo-interiors` (AppNavDrawer).
- ISSUE-PORTFOLIO-1: Portfolio route is public but data calls require token; `fetchOrgBySlug` only matches current org via `/org`, not a real slug lookup (PortfolioLanding, apiClient).
- ISSUE-PROJECTS-1: Editor uses `/projects/:slug`; if backend lacks that route, it falls back to a list with `pageSize=100`, risking misses (apiClient.fetchProjectBySlug).
- ISSUE-HIERARCHY-1: `useSceneNavigator` expects a full nested hierarchy response; any backend shape drift will break editor/public viewer scene loading.
- ISSUE-UPLOAD-1: Upload flow is mocked; assets/views are not persisted (UploadPanoramaDialog).
- ISSUE-SHARING-1: Sharing UI assumes `/share-links` endpoints and shapes; backend readiness not confirmed (EditorShellPage, ShareDialog/ShareSettingsPanel).
- ISSUE-ANALYTICS-1: Analytics UI assumes `/analytics/summary` and `/analytics/events`; public viewer only sends analytics with token (EditorShellPage, DashboardPage, PublicProjectViewer).
- ISSUE-ROBUSTNESS-1: Multiple places assume at least one project exists (hero project, default selections) without guarding for empty states.

## 4) Integration Goals
- Auth: Real JWT flow via `/auth/login`, `/auth/signup`, `/auth/me`; no hardcoded slugs in redirects; graceful handling of missing/expired tokens.
- Org & Projects: Dashboard driven by `/org`, `/org/seat-usage`, `/projects` pagination; no hardcoded slugs; works when zero projects exist.
- Editor & Hierarchy: Project fetch by slug or ID aligned with backend; hierarchy/pins/assets shapes match backend contracts.
- Public vs Auth: Clear behavior for `/p/:projectSlug` and `/portfolio/:orgSlug`; anonymous access works where intended; token usage explicit otherwise.
- Uploads/Assets: Replace mock upload with real backend/Supabase flow; persist assets/views.
- Sharing & Analytics: Wire to actual `/share-links` and `/analytics/*` endpoints or adjust expectations; consistent error handling for React Query.

## 5) Phased Implementation Plan

### Phase 1: Auth & Core Org/Projects Wiring
- Fix redirects: Update LoginPage default redirect and root/nav links to avoid hardcoded `modern-flat-tour`; choose a safe fallback (first project or dashboard).
- Protected routing: Keep `/dashboard` and `/editor/:projectSlug` guarded; ensure `/portfolio` and `/p` are treated according to public/auth design.
- Dashboard data: Ensure `/org`, `/org/seat-usage`, `/projects` (with pagination) drive cards; add empty-state handling when no projects.
- Navigation: Make nav drawer links dynamic (e.g., first project slug, current org slug) with guards; avoid 404 slugs.
- Files/endpoints: routes/index.jsx, LoginPage.jsx, AppNavDrawer.jsx, DashboardPage.jsx; API `/auth/*`, `/org`, `/org/seat-usage`, `/projects`.

### Phase 2: EditorShell & Hierarchy Integration
- Project fetch: Align `fetchProjectBySlug` to backend reality; if `/projects/:slug` exists, use it; otherwise, add explicit API for slug lookup or query parameter. Avoid large pageSize hacks.
- Hierarchy: Validate backend response matches `buildings → flats → rooms → views`; add defensive guards for empty arrays and loading/error states in EditorShellPage/useSceneNavigator.
- Pins/Assets: Confirm `/views/:id/pins` and `/views/:id/asset` shapes; handle missing assets gracefully.
- File touchpoints: apiClient.js, lib/hooks/useSceneNavigator.js, pages/EditorShellPage.jsx.
- Backend deps: `/projects/:slug` or alternative lookup, `/projects/:id/buildings`, `/views/:id/pins`, `/views/:id/asset`.

### Phase 3: Public Viewer & Portfolio
- Public project: Ensure `/p/:slug` payload matches viewer needs (hierarchy/asset references). If not, add mapping or adjust UI expectations.
- Analytics visibility: Decide whether public viewer should send/receive analytics without org token; implement share-token or anonymous behavior accordingly.
- Portfolio: Decide if portfolio is public or auth-only. Implement real org slug lookup (backend `/org/by-slug` or similar). Handle 401/404 gracefully; avoid token-required fetches on public routes unless explicitly required.
- File touchpoints: features/viewer360/PublicProjectViewer.jsx, features/portfolio/PortfolioLanding.jsx, apiClient.js.
- Backend deps: `/p/:slug`, `/analytics/summary`, org slug lookup endpoint (if needed).

### Phase 4: Uploads & Assets
- Replace mock upload: Wire `UploadPanoramaDialog` to backend upload flow (multipart or signed URL) and asset registration; update state with returned asset/view IDs.
- Validate asset/view associations match backend schema (view references panoramaAssetId, optional room binding).
- Add progress/error states; revoke object URLs where applicable.
- File touchpoints: features/uploads/UploadPanoramaDialog.jsx, apiClient.js (new upload endpoints), EditorShellPage (state updates).
- Backend deps: `/uploads/panorama` (or signed URL flow), asset/view creation endpoints.

### Phase 5: Sharing & Analytics
- Sharing: Ensure `/share-links` list/update APIs exist and shapes match ShareSettingsPanel expectations (`restriction`, `invitees`, etc.); add error handling/loading states.
- Analytics: Confirm `/analytics/summary` fields (views, snapshots, lastViewedAt) and `/analytics/events` payloads; make public vs authed behavior explicit.
- Tests/UX: Add empty/loading states for sharing and analytics panels; handle 401/403 by prompting re-auth or showing restricted messaging.
- File touchpoints: pages/EditorShellPage.jsx, features/sharing/ShareDialog.jsx, ShareSettingsPanel.jsx, pages/DashboardPage.jsx, features/viewer360/PublicProjectViewer.jsx.
- Backend deps: `/share-links`, `/analytics/summary`, `/analytics/events`.

## 6) Open Questions / Backend Gaps
- Org slug lookup: No `/org/by-slug` in frontend; `fetchOrgBySlug` just checks current org. Do we need a public/org-scoped slug lookup endpoint?
- Projects by slug: Is `/projects/:slug` implemented? If not, should frontend use `/projects?slug=` or backend add the route?
- Portfolio access model: Should `/portfolio/:orgSlug` be public or auth-only? If public, add unauthenticated endpoints (e.g., `/portfolio/:slug/projects`).
- Public viewer payload: Does `/p/:slug` return full hierarchy/pins/assets, or just project metadata? If partial, frontend needs mapping or additional calls.
- Upload flow: Will backend support direct multipart upload or signed URL + register? What is the expected response shape (assetId, url, viewId)?
- Sharing tokens: How are invite-only/public share tokens handled for `/p/:slug` and `/analytics/events`? Do we need to pass share tokens instead of org JWT?
- Analytics shape: Confirm fields (`totalViews`, `snapshotsDownloaded`, `lastViewedAt`) and whether summary is per-project or needs query params.
