# Changelog

## [0.1.3] - 2026-04-04
- Added dedicated game rules documentation for current implementation.
- Added [Glowing Potato](./game-rules/GLOWING_POTATO.md) and [Don't Say It](./game-rules/DONT_SAY_IT.md) rule references.

## [0.1.2] - 2026-04-04
- Added game introduction pages and refined the visible open-game catalog.
- Corrected game wait/finish flow consistency and fixed core `Don't Say It` logic.
- Migrated game history data model to use `gameHistories` as the primary collection.
- Removed legacy JavaScript files and reinforced TypeScript migration.

## [0.1.1] - 2026-04-03
- Displayed score and rank in the game over modal.
- Refined the alignment and styling of game over, leaderboard, and lobby UIs.
- Updated the leaderboard popup to persist records and show a fixed 10-slot layout.
- Consolidated combat, loot, and movement logs for animal encounters.
- Improved in-game UX for skills, map, character, and belt systems.

## [0.1.0] - 2026-04-01
- Implemented Google login integration with Firebase Auth.
- Added Firestore-backed nickname storage and nickname update flow.
- Added route guard for DontSayIt when users are not signed in.
- Added automatic room departure on in-game logout.
- Added Firebase Hosting deployment configuration and `npm run deploy` script.
- Shared root environment variables via `.env.local` across the monorepo.

## [0.0.2] - 2026-03-31
- Initialized the Vite + React + TypeScript game app foundation.
- Split shared UI components and theme utilities into dedicated packages.
- Added Tailwind custom theme integration and improved contrast for WCAG AA compliance.
- Implemented the initial **Don't Say It** multiplayer experience (room creation/join, voting, realtime synchronization).
- Integrated Firebase services for Realtime Database and Firestore workflows.
- Added Firebase Hosting deployment setup and `npm run deploy` script.
- Set up pnpm monorepo structure with `packages/ui`, `packages/theme`, and `packages/tsconfig`.
- Monorepo migrated to pnpm workspaces
- Design system CSS vars moved to `packages/theme/index.css`
- Tailwind tokens moved to `packages/theme/tailwind.js`
- All packages bumped from `0.0.0` → `0.0.2`
