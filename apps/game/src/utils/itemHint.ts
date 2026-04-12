import { BIOME_INFO } from '../data/map';
import type { Item } from '../types/items';
import { isSpawnableItem } from './spawning';

export function getItemSpawnHint(item: Item): string {
  const { biomes, seasons, weathers, timePeriods } = item.spawnConditions;
  const isLoot = item.tags?.includes('loot');

  if (isLoot) {
    return 'Dropped by animals';
  }

  if (!isSpawnableItem(item)) {
    return 'Crafting material only';
  }

  const hasSpawnConstraint =
    (biomes?.length ?? 0) > 0 ||
    (seasons?.length ?? 0) > 0 ||
    (weathers?.length ?? 0) > 0 ||
    (timePeriods?.length ?? 0) > 0;

  if (!hasSpawnConstraint) {
    return 'Found everywhere';
  }

  if (biomes && biomes.length > 0) {
    if (biomes.includes('everywhere')) {
      return 'Found everywhere';
    }
    const biomeNames = biomes.map((biome) => BIOME_INFO[biome]?.name ?? biome);
    return `Found in: ${biomeNames.join(', ')}`;
  }

  const conditions: string[] = [];
  if (seasons?.length) {
    conditions.push(`Seasons: ${seasons.join(', ')}`);
  }
  if (weathers?.length) {
    conditions.push(`Weather: ${weathers.join(', ')}`);
  }
  if (timePeriods?.length) {
    conditions.push(`Time: ${timePeriods.join(', ')}`);
  }

  if (conditions.length > 0) {
    return conditions.join(' | ');
  }

  return 'Crafting material only';
}
