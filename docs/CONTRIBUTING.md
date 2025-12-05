# Contributing Guide

Thanks for taking the time to improve Interior Showcase Frontend! This short guide covers expectations and the local workflow. Pair it with `docs/PROJECT_OVERVIEW.md` for architecture context.

## Getting Started
1. Install dependencies with `npm install`.
2. Run `npm run dev` and open the Vite URL.
3. For Playwright e2e runs (`npm run e2e`), ensure the dev server is running.

## Development Workflow
- **Branching**: create a feature or fix branch per change.
- **Lint & Format**: `npm run lint` and `npm run format` before pushing.
- **Unit tests**: `npm test` (or `npm run test:watch` during development).
- **E2E tests**: run `npm run e2e` for changes that affect viewer flows, routing, or auth.
- **Commits**: keep history tidy with descriptive messages (e.g., `feat: add sharing analytics panel`).

## Code Style & Patterns
- Follow React functional component conventions; keep files colocated under `src/features/*` or `src/components/*`.
- Prefer hooks (`useMemo`, `useCallback`, `useSceneNavigator`, `useAuth`) over prop drilling.
- Keep styling consistent with MUI theme tokens (`spacing`, palette). Avoid inline magic numbers.
- Use React Query for async data; leverage query keys defined in existing files.
- Update or add unit tests when editing utilities (`src/lib/utils/*`) or hooks.

## Pull Request Checklist
- [ ] Tests pass locally (`npm test`, `npm run e2e` when relevant)
- [ ] `npm run lint` and `npm run format` succeed
- [ ] New components/pages documented in `docs/PROJECT_OVERVIEW.md` if needed
- [ ] Screenshots or GIFs attached for major UI changes
- [ ] No accidental changes in `dist/` or generated files

## Architecture Decisions
For non-trivial architectural shifts (new major dependency, refactor of viewer stack, routing scheme changes), add an ADR-style note under `docs/` (e.g., `docs/adr-001-new-viewer.md`) summarizing the problem, decision, and alternatives.

## Reporting Issues
When filing bugs, include:
- Reproduction steps and expected vs. actual behavior
- Browser/version info (if UI-specific)
- Relevant console logs or stack traces
- Screenshots or video when available

Thanks for contributing! 🎉

