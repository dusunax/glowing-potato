# 🌿 Glowing Potato

A cozy browser-based 2D collection game built with React, TypeScript, and Vite.

## Game Concept

Explore a world governed by **seasons**, **weather**, and **time of day**. Collect items
that only appear under specific conditions, then craft them into rarer goods. Track your
discoveries in the journal.

## 🎮 How to Play

1. Watch the **World Conditions** panel — it shows current season, weather, and time of day.
2. Click **Collect** to search for items that spawn under the current conditions.
3. Collect enough ingredients to **Craft** special items in the Crafting panel.
4. Track everything you've discovered in your **Discovery** journal.
5. Click **End Turn** to advance time and change conditions.

## Tech Stack

| Tool          | Purpose                        |
|---------------|-------------------------------|
| React + Vite  | UI framework and dev server    |
| TypeScript    | Type safety throughout         |
| Tailwind CSS  | Utility-first styling          |
| Local state   | No external state libraries    |

## How to Run

```bash
npm install
npm run dev
```

Open http://localhost:5173

## Folder Structure

```
src/
  constants/    # Season, weather, time period enums — no logic
  types/        # TypeScript interfaces only
  data/         # Static item/recipe/event data — no logic
  hooks/        # React state hooks (one concern per hook)
  components/   # UI panels and reusable widgets
  utils/        # Pure utility functions (no React)
docs/
  game-rules.md # Full game rules and extension guide
  roadmap.md    # Future feature ideas
```

## 🌟 Features

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
