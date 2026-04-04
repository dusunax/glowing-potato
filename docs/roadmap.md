# 🗺️ Glowing Potato — Roadmap

## Potential Future Features

### NPC System
- Add wandering NPCs with dialogue
- NPCs offer trade quests or clues about rare items
- `src/data/npcs.ts` + `src/hooks/useNPCs.ts`

### Map Exploration
- Tile-based map with different biomes
- Biome affects spawn pool (Forest, Cave, Riverside)
- `src/data/tiles.ts` + canvas or CSS grid renderer

### Save / Load State
- `localStorage`-based persistence via a `useSaveLoad` hook
- Auto-save on each action

### Achievements
- Milestone tracking: "Find 5 rare items", "Craft every recipe"
- `src/data/achievements.ts` + `src/hooks/useAchievements.ts`

### Event System
- Random world events (meteor shower, drought, fog bank)
- Temporarily override conditions or boost spawn rates

### More Items & Recipes
- Seasonal sets (Spring Bouquet, Winter Crown, etc.)
- Combo recipes requiring items from multiple seasons

### Animated Sprites
- Replace emoji with pixel-art sprites via CSS sprite sheets

### Sound Effects
- Web Audio API for ambient background + collect sounds
