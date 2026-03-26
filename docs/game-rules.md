# 🌿 Glowing Potato — Game Rules

## Overview
Glowing Potato is a browser-based 2D collection game. Players explore a world governed by
seasonal conditions, collecting items that only appear under specific weather, time, and season
combinations, then crafting them into rarer goods.

---

## World Conditions

The game world has four orthogonal dimensions:

| Dimension    | Values                                      |
|--------------|---------------------------------------------|
| **Season**   | Spring, Summer, Autumn, Winter              |
| **Weather**  | Sunny, Rainy, Cloudy, Foggy, Snowy          |
| **Time**     | Morning, Afternoon, Evening, Night          |
| **Day**      | Integer, starts at 1                        |

### Time Progression
- Clicking **End Turn** advances: `Morning → Afternoon → Evening → Night → Morning (next day)`
- Weather randomises at the start of each new day (pulled from season-appropriate pool)
- Season advances every **7 days**

### Snowy Weather
Only occurs in Winter.

---

## Item Rarity

| Rarity     | Spawn Weight | Colour  |
|------------|-------------|---------|
| common     | 5           | grey    |
| uncommon   | 3           | green   |
| rare       | 1           | purple  |

Higher weight = more likely to be selected when multiple items can spawn.

---

## Spawn Condition Logic

An item can spawn when **all** of its defined conditions are satisfied:
- `seasons` — current season must be in the list (or field absent = any)
- `weathers` — current weather must be in the list (or field absent = any)
- `timePeriods` — current time must be in the list (or field absent = any)

Clicking **Collect** picks a random item from the spawnable pool (weighted by rarity).
If the pool is empty, the player receives a hint.

---

## Crafting Rules
1. Open the Crafting panel.
2. A recipe turns green when you have all required ingredients.
3. Click **Craft** to consume ingredients and gain the result item.
4. Results are automatically added to inventory and marked discovered.

---

## Discovery Journal
- Every item you have ever collected is marked as **discovered**.
- Undiscovered items appear as `❓` with hidden names.
- Crafted items are also marked discovered when received.

---

## How to Add a New Item

1. Add the item definition to `src/data/items.ts`:

```ts
{
  id: 'my_item',           // unique snake_case string
  name: 'My Item',
  emoji: '🌸',
  description: 'What it is.',
  rarity: 'uncommon',      // 'common' | 'uncommon' | 'rare'
  spawnConditions: {
    seasons: ['Spring'],   // optional
    weathers: ['Rainy'],   // optional
    timePeriods: ['Morning'], // optional
  },
},
```

2. No other files need changing — the item will automatically appear in the journal
   and be eligible for spawning.

---

## How to Add a New Recipe

Add the recipe to `src/data/recipes.ts`:

```ts
{
  id: 'my_recipe',
  name: 'My Recipe',
  description: 'What it creates.',
  ingredients: [
    { itemId: 'my_item', quantity: 2 },
  ],
  result: { itemId: 'crystal', quantity: 1 },
},
```

---

## How to Add New World Conditions

- **New season**: Add to `SEASONS` in `src/constants/seasons.ts` and update
  `WEATHER_BY_SEASON` in `src/constants/weather.ts`.
- **New weather**: Add to `WEATHERS` in `src/constants/weather.ts` and update
  `WEATHER_BY_SEASON`.
- **New time period**: Add to `TIME_PERIODS` in `src/constants/timePeriods.ts`
  and update `advanceTime` logic in `src/utils/time.ts`.
