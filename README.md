# Glowing Potato

A cozy browser-based mini-game arcade built with React, TypeScript, and Vite — structured as an **npm workspaces monorepo**.

## Game Concept

A mini-game lobby lets you pick from a slot-machine-style carousel. The first available game is **Glowing Potato**: explore a world governed by **seasons**, **weather**, and **time of day**, collect items that only appear under specific conditions, then craft them into rarer goods.

## 🎮 How to Play

1. Choose a game from the **Mini-Game Arcade** lobby (spin or pick manually).
2. In Glowing Potato: watch the **World Conditions** panel — season, weather, and time of day.
3. Click **Collect** to search for items under the current conditions.
4. Collect enough ingredients to **Craft** special items in the Crafting panel.
5. Track everything you've discovered in your **Discovery** journal.
6. Click **End Turn** to advance time and change conditions.

## Tech Stack

| Tool             | Purpose                                  |
|------------------|------------------------------------------|
| React + Vite     | UI framework and dev server              |
| TypeScript       | Type safety throughout                   |
| Tailwind CSS     | Utility-first styling with custom tokens |
| npm workspaces   | Monorepo package management              |
| Local state      | No external state libraries              |

## Design System

Colors sourced from [colorhunt.co/palette/091413285a48408a71b0e4cc](https://colorhunt.co/palette/091413285a48408a71b0e4cc):

| Token         | Hex       | Usage                    |
|---------------|-----------|--------------------------|
| `gp-bg`       | `#091413` | Page background          |
| `gp-surface`  | `#285a48` | Cards and panels         |
| `gp-accent`   | `#408a71` | Interactive elements     |
| `gp-mint`     | `#b0e4cc` | Primary text, highlights |

Shared UI components live in `packages/ui` (`@glowing-potato/ui`): `Button`, `Card`, `Badge`.

## How to Run

```bash
pnpm install      # installs all workspace packages
pnpm dev          # starts the game dev server at http://localhost:5173
```

Or run inside the game workspace directly:

```bash
cd apps/game && pnpm dev
```

## Monorepo Structure

```
apps/
  game/             # The mini-game arcade (@glowing-potato/game)
    src/
      constants/    # Season, weather, time period enums — no logic
      types/        # TypeScript interfaces only
      data/         # Static item/recipe/event data — no logic
      hooks/        # React state hooks (one concern per hook)
      components/   # UI panels and reusable widgets
      utils/        # Pure utility functions (no React)
packages/
  ui/               # Shared design system (@glowing-potato/ui)
    src/
      components/   # Button, Card, Badge
      tokens.ts     # Color palette constants
docs/
  game-rules.md     # Full game rules and extension guide
  roadmap.md        # Future feature ideas
```

## 🌟 Features

- **Mini-game lobby** with slot-machine carousel
- **20+ unique collectable items** spanning flora, minerals, creatures, and special categories
- **8 crafting recipes** including legendary items
- **Dynamic spawn system** — items only appear under matching season/weather/time conditions
- **Discovery journal** — track every item you have ever found
- **Event log** — see what happened on each turn

## How to Extend

See [`docs/game-rules.md`](docs/game-rules.md) for:
- Adding new items
- Adding new recipes
- Adding new world conditions

See [`docs/roadmap.md`](docs/roadmap.md) for planned future features.
