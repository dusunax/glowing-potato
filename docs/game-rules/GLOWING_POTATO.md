# GLOWING POTATO — GAME RULES 

## 1. Core Setup

- Mini-game ID: `collection`
- Map size: **8x8** (`MAP_GRID`).
- Starting position: **(0,2)** (`INITIAL_PLAYER_POSITION`).
- Player starts in `Spring / Sunny / Morning`, Day `1`.
- Tile movement is orthogonal by maze passage rules.
  - With current settings, adjacent orthogonal tiles are reachable by default.
- Tile resources: cave tiles start at `0`, others start at `1~3` and regenerate on schedule.

## 2. Conditions and Turn Progression

Current condition model:

- `season`: `Spring | Summer | Autumn | Winter`
- `weather`: `Sunny | Rainy | Cloudy | Foggy | Snowy`
- `timePeriod`: `Morning | Afternoon | Evening | Night`
- `day` (starts at 1)

Advancing time:

- Each action card resolution advances exactly one time period.
- `Morning -> Afternoon -> Evening -> Night -> Morning` and day increments at Night→next Morning.
- On each new day:
  - Weather is randomized according to current season.
  - Tile resources are replenished when `day % 7 === 0`.
  - Cave animals can spawn when `day % 3 === 0`.

## 3. Action Cards

Hand layout is fixed to 4 cards:

- Slot 1: Move card (`explore` or `sprint`)
- Slot 2: Forage card (`forage`, `lucky_forage`, or `windfall`)
- Slot 3–4: Skill cards

Card effects:

- `explore`: move to reachable tile within range 1
- `sprint`: move to reachable tile within range 2
- `forage`: collect 1 item
- `lucky_forage`: collect 2 items with lucky weighting
- `windfall`: collect 3 items
- `rest`: restores HP
- `scout`: reveal spawn hints
- `weather_shift`: random weather change

Notes:

- Move cards require tile selection and are blocked if target tile has a live animal.
- Any non-move card also triggers post-action world effects.

## 4. Collection and Spawn Rules

- `collect` consumes 1 resource from the current tile.
- If resources are depleted, collection returns no item.
- Spawnable items are filtered by:
  - `seasons`
  - `weathers`
  - `timePeriods`
- Biome bonuses are applied in weighted selection:
  - category bonus and rarity bonus change spawn weights.

## 5. Inventory, Crafting, and Belt

- Inventory stores `{ itemId, quantity }`.
- Crafting consumes required ingredients and adds result item.
- Recipes and item discovery are data-driven.
- Belt has 8 quick slots for consumables only.
- Consumables:
  - `food`: +4 HP
  - `potion`: +8 HP

## 6. Combat and Animal Rules

- Wildlife is initialized with `createInitialAnimals()`.
- Every action can trigger animal movement and hostile counterattacks.
- Player strike damage: fixed 3.
- Hostile attacks hit on adjacent orthogonal tiles.
- Nearby list and attack UI includes orthogonal + diagonal adjacency.
- Defeating an animal grants:
  - XP (`maxHp`, minimum 1)
  - `raw_meat`
  - `animal_hide`
- If no animals remain alive, cave wave spawns again.

## 7. Survival and Death

- Base HP: `10`
- Base XP for level 2: `12`, growth `+2` each level.
- Level up grants:
  - `+2` max HP
  - full HP restore

## 8. Scoring

Final score formula:

- `survivalDays * 50`
- `(level - 1) * 100`
- `totalXpGained * 3`
- Inventory bonus by rarity:
  - common `1`, uncommon `3`, rare `5`, legendary `10`
- Total is saved at death to:
  - `game_histories / collection / records`

## 9. Related files

- `src/data/map.ts`
- `src/hooks/useGameState.ts`
- `src/hooks/useConditions.ts`
- `src/hooks/useGameClock.ts`
- `src/hooks/useActionCards.ts`
- `src/hooks/useMap.ts`
- `src/hooks/useItemSpawn.ts`
- `src/hooks/useAnimals.ts`
- `src/data/items.ts`
- `src/data/recipes.ts`
- `src/data/animals.ts`
- `src/data/actionCards.ts`
- `src/utils/spawning.ts`
- `src/utils/score.ts`
