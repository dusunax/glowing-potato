// Defines the four game seasons and their descriptions.
// To add a new season: add an entry here and update WeatherType in constants/weather.ts.

export const SEASONS = ['Spring', 'Summer', 'Autumn', 'Winter'] as const;
export type Season = typeof SEASONS[number];

export const SEASON_DESCRIPTIONS: Record<Season, string> = {
  Spring: 'Flowers bloom and rain is frequent.',
  Summer: 'Long sunny days with warm nights.',
  Autumn: 'Cool mists and falling leaves.',
  Winter: 'Cold winds and occasional snow.',
};
