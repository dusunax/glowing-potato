# Glowing Potato

A cozy browser-based mini-game arcade built with React, TypeScript, and Vite.

## Game Concept

Browse games from a single lobby and play:

- **Glowing Potato**: explore an 8x8 world, collect based on weather/season/time, craft recipes, and survive.
- **Don't Say It**: multiplayer party game with speech/chat-based taboo rules.

## Quick Start

- Install: `pnpm install`
- Start: `pnpm dev`
- Visit: `http://localhost:5173`

Or inside workspace:

```bash
cd apps/game
pnpm dev
```

## Monorepo Overview

```text
apps/
  game/   # Main game app
  packages/ui/ # Shared UI components
```

## Tech Stack

- React + TypeScript
- Vite
- Tailwind CSS
- Firebase (Auth, Realtime DB, Firestore)
- TanStack Query

## What’s implemented now

## Features

- Mini-game lobby with game switching
- Score/leaderboard persistence
- Two active games:
  - Glowing Potato
    - 8x8 map exploration and dynamic collection system
    - Crafting + discovery journal + event logs
  - Don't Say It
    - Real-time multiplayer room flow for Don’t Say It

## How to Extend

For implementation details and extension rules:

- [Glowing Potato Rules](docs/game-rules/GLOWING_POTATO.md)
- [Don't Say It Rules](docs/game-rules/DONT_SAY_IT.md)
