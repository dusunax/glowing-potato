# 🌿 Petal Grove

A cozy pixel-style collection game prototype built with React + TypeScript + Vite.

Explore a magical grove, collect items based on the current time, weather, and season, craft unique items, and fill your discovery journal!

## 🎮 How to Play

1. Watch the **World Conditions** panel — it shows current season, weather, and time of day.
2. Click **Explore the Grove** to search for items that spawn under those conditions.
3. Collect enough ingredients to **Craft** special items in the Crafting Table.
4. Track everything you've discovered in your **Journal**.
5. Use the **Pause** button to freeze time while you plan.

## 📁 Folder Structure

```
src/
├── data/           # Game data (items, recipes, events)
│   ├── items.ts    # Item definitions with spawn conditions
│   ├── recipes.ts  # Crafting recipes
│   └── events.ts   # World events and flavor text
├── types/
│   └── game.ts     # TypeScript interfaces
├── hooks/
│   ├── useGameClock.ts   # Time/weather/season simulation
│   └── useGameState.ts   # Inventory, crafting, discovery logic
└── components/
    ├── GameHeader.tsx      # Top navigation bar
    ├── ConditionsPanel.tsx # Season/weather/time display
    ├── SpawnArea.tsx       # Grove exploration + collect button
    ├── InventoryPanel.tsx  # Player's collected items
    ├── CraftingPanel.tsx   # Recipe browser and crafting
    └── DiscoveryLog.tsx    # Activity log + discovery journal
```

## 🚀 Getting Started

```bash
npm install
npm run dev
```

## 🌟 Features

- **20 unique collectable items** across flora, minerals, creatures, and special categories
- **8 crafting recipes** including legendary items
- **6 world events** that trigger based on conditions
- **Dynamic spawn system** — items only appear under matching conditions
- **Discovery journal** — track when and where you found each item
- **Pixel-art inspired UI** using Tailwind CSS
- **Simulated game clock** — time advances every 5 seconds

## 🗺️ Item Rarities

| Rarity | Spawn Chance |
|--------|-------------|
| Common | 70% |
| Uncommon | 45% |
| Rare | 20% |
| Legendary | 5% |

## TODO

See [roadmap.md](./roadmap.md) for planned features.
