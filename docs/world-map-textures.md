# World Map Textures (Kenney Assets)

This project reads biome textures from `apps/game/public/world-map/*` and applies them in
[`MapPanel`](../apps/game/src/components/panels/MapPanel.tsx) when a tile becomes known/visited.

## Recommended texture files

Use any Kenney art pack that matches your style (top-down or fantasy tiles).  
Suggested packs:

- **Fantasy Town / Nature / RPG / Environment** (World tiles / nature tiles)
- Keep a **consistent tile style** across all files.

Place files with these names:

- `forest.svg`
- `meadow.svg`
- `plains.svg`
- `lake.svg`
- `swamp.svg`
- `mountain.svg`
- `rock.svg`
- `beach.svg`
- `desert.svg`
- `cave.svg`
- `village.svg`
- `treasure.svg`

## Current mapping

`apps/game/src/data/map.ts` maps `BIOME_INFO[biome].texture` to:

- `forest` → `/world-map/forest.svg`
- `meadow` → `/world-map/meadow.svg`
- `plains` → `/world-map/plains.svg`
- `lake` → `/world-map/lake.svg`
- `swamp` → `/world-map/swamp.svg`
- `mountain` → `/world-map/mountain.svg`
- `rock` → `/world-map/rock.svg`
- `beach` → `/world-map/beach.svg`
- `desert` → `/world-map/desert.svg`
- `cave` → `/world-map/cave.svg`
- `village` → `/world-map/village.svg`
- `treasure` → `/world-map/treasure.svg`
- `everywhere` → `/world-map/rock.svg` (fallback)

## Notes

- Unknown tiles keep the fog/background style and do not show texture.
- Known-but-unvisited tiles will use the texture with a stronger dark overlay.
- If a texture file is missing, the fallback color class is still used.
