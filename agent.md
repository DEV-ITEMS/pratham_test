# Implementation Learnings (Frontend)

- Guard date formatting in project cards: backend projects may return `updatedAt` null/undefined; `formatDistanceToNow` must only run on valid dates. We now fallback to "Unknown" when the timestamp is missing/invalid to avoid `RangeError: Invalid time value`. (src/features/projects/ProjectCard.jsx)
- Avoid hardcoded editor/public slugs in nav: linking to `/editor/modern-flat-tour` caused 404s when the project doesn’t exist. Nav now routes to dashboard until dynamic slugs are available. (src/components/AppNavDrawer.jsx)
- Guard analytics/updated timestamps in editor: `EditorShellPage` now uses a safe formatter for `lastViewedAt`/`updatedAt` to prevent invalid date errors when backend fields are null or missing. (src/pages/EditorShellPage.jsx)
- Build editor nav target from real data: the nav fetches the first project (if any) to create a safe editor link; falls back to dashboard when none exist to avoid broken links. (src/components/AppNavDrawer.jsx)
- Dashboard project list should wrap, not scroll horizontally: switched to a responsive grid so cards flow down on smaller screens. (src/pages/DashboardPage.jsx)
