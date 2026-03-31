# Changelog

## [0.0.2] - 2026-03-31

### Added
- **Don't Say It (끝말잇기)** multiplayer real-time game feature using Firebase Realtime Database
- **Firebase Hosting** configuration and `npm run deploy` / `pnpm run deploy` script
- **Firebase Auth** (Google sign-in) with Firestore-backed nickname management
- `packages/theme` (`@glowing-potato/theme`) — shared CSS variables and Tailwind design tokens
- `packages/tsconfig` (`@glowing-potato/tsconfig`) — shared TypeScript configurations (base, react-app, react-library, node)
- pnpm workspace setup for full monorepo support

### Changed
- Monorepo migrated to pnpm workspaces
- Design system CSS vars moved to `packages/theme/index.css`
- Tailwind tokens moved to `packages/theme/tailwind.js`
- All packages bumped from `0.0.0` → `0.0.2`

## [0.0.1] - Initial release

- Initial Petal Grove cozy collection game scaffold
- `@glowing-potato/ui` design system package (Button, Card, Badge components)
