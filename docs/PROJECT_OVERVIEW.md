# Interior Showcase Frontend — Project Overview

This document provides a complete, high‑level overview of the codebase: the folder and file structure, main modules, data flow, routing, providers, theming, utilities, tests, and build configuration. It is intended as the single entry point for new contributors and as a reference for maintainers.

## Tech Stack
- Framework: React 18 (Vite 7 + `@vitejs/plugin-react`)
- UI: MUI v7 with a custom theme
- Routing: React Router v7
- Data fetching/cache: TanStack React Query v5
- 360° Viewer: `photo-sphere-viewer` (+ three.js)
- Forms & validation: `react-hook-form`, `zod`
- Date utilities: `date-fns`
- Utilities: `lodash`, `clsx`
- Testing: Jest (unit), Playwright (e2e)
- Lint/Format: ESLint 9 + Prettier

## NPM Scripts (package.json)
- `dev`: start Vite dev server
- `build`: production build
- `preview`: preview built app
- `lint`: run ESLint on `src/**/*.{js,jsx}`
- `test` / `test:watch`: run Jest unit tests
- `e2e`: run Playwright tests
- `format`: Prettier check
- `prepare`: Husky install

## Application Architecture

### Entry Point
- `index.html` — HTML shell that mounts React into `#root` and loads `/src/main.jsx`.
- `src/main.jsx` — Bootstraps the component tree and wraps the app with providers:
  - `AppThemeProvider` (MUI theme + contrast and mode toggles)
  - `AppQueryProvider` (React Query client)
  - `AuthProvider` (simple localStorage‑backed auth state with mocked API)
  - Renders `<App />` which delegates to routes.

### Routing & Layout
- `src/App.jsx` — Thin wrapper that renders `<AppRoutes />`.
- `src/routes/index.jsx` — Declares routes and an `AppLayout` with:
  - `AppTopBar` (global app bar with search and theme toggles)
  - `AppNavDrawer` (navigation drawer)
  - `<Outlet />` to render pages within a padded, responsive main area
- `src/routes/ProtectedRoute.jsx` — Gate for authenticated routes. Redirects to `/login` when unauthenticated; shows a centered spinner while loading.

Routes:
- `/login` → `LoginPage`
- Layout routes (with `AppLayout`):
  - `/` → redirect to `/editor/modern-flat-tour`
  - `/dashboard` (protected) → `DashboardPage`
  - `/editor/:projectSlug/*` (protected) → `EditorShellPage`
  - `/portfolio/:orgSlug` → `PortfolioLanding`
  - `/p/:projectSlug` → `PublicProjectViewer` (public share view)
- `*` → `NotFoundPage`

### Providers
- `src/providers/ThemeProvider.jsx` — MUI theme creation using `createMaterialTheme`, plus a `ThemeControlsContext` exposing `mode`, `highContrast`, and toggles.
- `src/providers/QueryProvider.jsx` — React Query client with sane defaults (`staleTime`, no refetch on focus).
- `src/providers/AuthProvider.jsx` — Local storage backed “auth” facade with mocked data via `apiClient`; exposes `{ user, org, members, seatUsage, loading, login, signup, logout }`.

## Features & Pages
- `src/pages/DashboardPage.jsx`
  - A “workspace viewer” hero that embeds `PanoramaViewer` with a HUD ribbon (details/share/pins/activity), then a project list using `ProjectCard`.
  - Uses `useSceneNavigator` to derive the selected room/view and asset.
- `src/pages/EditorShellPage.jsx`
  - Full editor shell for a project: hierarchical selectors (building → flat → room → view), uploads, pins navigation, snapshot, and share panel.
  - Manages selection and UI state; queries `apiClient` for project, hierarchy, initial selection, sharing, analytics, and per‑view pins/assets.
- `src/features/viewer360/PublicProjectViewer.jsx`
  - Public viewer for shared links. Minimal controls and HUD actions; copy link and snapshot.
- `src/features/portfolio/PortfolioLanding.jsx`
  - Portfolio landing per org; shows portfolio projects and a viewer area for the selected project.
- `src/pages/LoginPage.jsx`
  - Frontend‑only login/signup backed by localStorage; redirects back to requested route upon success.
- `src/pages/NotFoundPage.jsx`
  - Simple 404 with a button to jump back to the demo editor.

## Components
- `AppTopBar` — AppBar with organization name, search, mode/contrast toggles, notifications, user avatar, and logout.
- `AppNavDrawer` — Temporary drawer with nav items; shows simple seat usage info.
- `ViewerHudRibbon` — Overlay ribbon with tabbed drawer and action icons positioned over the viewer.
- `AppBreadcrumbs` — Breadcrumbs derived from the current URL; maps slugs to friendly labels.
- Form helpers: `FormTextField`, `FormSelect` (React Hook Form wrappers).
- `EmptyState` — Generic empty state surface.
- `GlobalSearch` — Simple project search with autocomplete; navigates to editor by slug.
- `features/projects/ProjectCard` — Card for project summary, tags, visibility, and CTA.

## 360° Viewing
- `features/viewer360/PanoramaViewer.jsx`
  - Thin wrapper on `photo-sphere-viewer` with:
    - Imperative handle: `captureSnapshot()`, `resetOrientation()`, `loadPanorama(url, defaults)`
    - Overlayed navigation pins (projected from yaw/pitch to viewer coordinates)
    - Keyboard navigation (arrow keys)
    - Onboarding tooltip for controls
- `features/viewer360/ViewThumbnails.jsx` — Thumbnails for views within a room.

## Data Layer (Mocked)
- `src/lib/apiClient.js` — Async façade with small random delays, backed by in‑memory mocks.
- `src/mocks/` — Domain data and adapters:
  - `data.*.js` — orgs, users, projects, buildings, flats, rooms, views, pins, assets.
  - `adapters/*.adapter.js` — query helpers (orgs, projects, hierarchy, assets, sharing, analytics).
- `src/lib/hooks/useSceneNavigator.js` — Given a `projectId`, derives rooms, selected room/view, pins, and asset; exposes `selectRoom`/`selectView`.

## Utilities
- `src/lib/utils/yawPitch.js` — Math helpers to normalize/clamp yaw/pitch, convert to/from spherical (radians), and format labels.
- `src/lib/utils/snapshot.js` — Canvas compositing to produce a watermarked PNG DataURL; `triggerDownload` helper.
- `src/lib/utils/storage.js` — Safe JSON localStorage wrapper with fallbacks and parsing guards.

## Theming
- `src/theme/materialTheme.js` — MUI theme factory (light/dark palettes, high‑contrast option, typography scale, shape, and component overrides).
- `src/theme/spacing.js` — Central spacing tokens (`xxs` → `xl`) and `spacingValue(token)`.

## Tests
- Unit (Jest):
  - `src/tests/unit/yawPitch.spec.js` — deg/rad conversion, normalization/clamping, and label formatting.
  - `src/tests/unit/snapshot.spec.js` — verifies watermarked DataURL creation.
  - Setup: `src/tests/setupTests.js` with `jest-canvas-mock` and `@testing-library/jest-dom`.
- E2E (Playwright):
  - `src/tests/e2e/viewer.spec.js` — boots app, stubs auth in localStorage, expects editor route and viewer presence.

## Build & Tooling
- `vite.config.js` — React plugin and `@` alias to `src`.
- `eslint.config.js` — ESLint 9 flat config with React/Hooks plugins and Prettier compatibility.
- `jest.config.js` — jsdom environment, unit tests rooted at `src/tests/unit`, `babel-jest` transform.
- `babel.config.cjs` — CommonJS transform for Jest.

## Project Structure (Source)
```
.
├─ index.html
├─ package.json
├─ vite.config.js
├─ eslint.config.js
├─ jest.config.js
├─ babel.config.cjs
├─ public/
│  ├─ logo.png
│  ├─ vite.svg
│  └─ panos/
│     ├─ bedroom.jpg
│     ├─ kitchen.jpg
│     └─ livingroom.jpg
├─ src/
│  ├─ App.jsx
│  ├─ main.jsx
│  ├─ routes/
│  │  ├─ index.jsx
│  │  └─ ProtectedRoute.jsx
│  ├─ providers/
│  │  ├─ ThemeProvider.jsx
│  │  ├─ QueryProvider.jsx
│  │  └─ AuthProvider.jsx
│  ├─ pages/
│  │  ├─ DashboardPage.jsx
│  │  ├─ EditorShellPage.jsx
│  │  ├─ LoginPage.jsx
│  │  └─ NotFoundPage.jsx
│  ├─ components/
│  │  ├─ AppTopBar.jsx
│  │  ├─ AppNavDrawer.jsx
│  │  ├─ AppBreadcrumbs.jsx
│  │  ├─ ViewerHudRibbon.jsx
│  │  ├─ ConfirmDialog.jsx
│  │  ├─ EmptyState.jsx
│  │  ├─ FormTextField.jsx
│  │  ├─ FormSelect.jsx
│  │  └─ GlobalSearch.jsx
│  ├─ features/
│  │  ├─ auth/
│  │  │  └─ useAuth.js
│  │  ├─ projects/
│  │  │  └─ ProjectCard.jsx
│  │  ├─ portfolio/
│  │  │  └─ PortfolioLanding.jsx
│  │  ├─ uploads/
│  │  │  └─ UploadPanoramaDialog.jsx
│  │  ├─ sharing/
│  │  │  ├─ ShareDialog.jsx
│  │  │  └─ ShareSettingsPanel.jsx
│  │  └─ viewer360/
│  │     ├─ PanoramaViewer.jsx
│  │     ├─ PublicProjectViewer.jsx
│  │     └─ ViewThumbnails.jsx
│  ├─ lib/
│  │  ├─ apiClient.js
│  │  ├─ hooks/
│  │  │  └─ useSceneNavigator.js
│  │  └─ utils/
│  │     ├─ yawPitch.js
│  │     ├─ snapshot.js
│  │     └─ storage.js
│  ├─ mocks/
│  │  ├─ index.js
│  │  ├─ adapters/
│  │  │  ├─ orgs.adapter.js
│  │  │  ├─ projects.adapter.js
│  │  │  ├─ hierarchy.adapter.js
│  │  │  ├─ assets.adapter.js
│  │  │  ├─ sharing.adapter.js
│  │  │  └─ analytics.adapter.js
│  │  ├─ data.orgs.js
│  │  ├─ data.users.js
│  │  ├─ data.projects.js
│  │  ├─ data.buildings.js
│  │  ├─ data.flats.js
│  │  ├─ data.rooms.js
│  │  ├─ data.views.js
│  │  ├─ data.pins.js
│  │  └─ data.assets.js
│  ├─ theme/
│  │  ├─ spacing.js
│  │  └─ materialTheme.js
│  └─ tests/
│     ├─ setupTests.js
│     ├─ unit/
│     │  ├─ yawPitch.spec.js
│     │  └─ snapshot.spec.js
│     └─ e2e/
│        └─ viewer.spec.js
└─ dist/  (generated build output)
```

Notes:
- `dist/` contains compiled JS/CSS and copied assets for production; it is generated and should be ignored for code navigation.
- `public/` holds static assets served as‑is.

## How Data Flows
- UI reads state from providers and React Query.
- `apiClient` orchestrates reads/updates to in‑memory mock adapters (simulated latency) and returns domain objects.
- `useSceneNavigator` computes current scene state from project hierarchy and exposes selection helpers.
- Viewer writes snapshots to an in‑memory canvas, watermarks them, and triggers local download.

## Running Locally
1. Install dependencies: `npm install`
2. Start dev server: `npm run dev`
3. Unit tests: `npm test` (watch: `npm run test:watch`)
4. E2E tests: `npm run e2e` (requires dev server on the default port)
5. Lint: `npm run lint` • Format check: `npm run format`

## Conventions & Notes
- File alias `@` maps to `src` (see `vite.config.js`).
- Component and hook naming follows React conventions.
- Avoid state duplication: prefer derived state via hooks (`useMemo`) and React Query caches.
- All auth is frontend‑only for demo purposes; data persists in browser localStorage.

