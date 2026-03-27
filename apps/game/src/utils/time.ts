// Pure time utility functions. No React imports. No side effects.

import { TIME_PERIODS, type TimePeriod } from '../constants/timePeriods';
import { SEASONS, type Season } from '../constants/seasons';
import { WEATHER_BY_SEASON, type Weather } from '../constants/weather';
import type { WorldConditions } from '../types/conditions';

/** Advances time by one period. Returns updated conditions + flags. */
export function advanceTime(conditions: WorldConditions): {
  next: WorldConditions;
  isNewDay: boolean;
  isNewSeason: boolean;
} {
  const currentIndex = TIME_PERIODS.indexOf(conditions.timePeriod);
  const isNewDay = currentIndex === TIME_PERIODS.length - 1;

  const nextTimePeriod: TimePeriod = isNewDay
    ? TIME_PERIODS[0]
    : TIME_PERIODS[currentIndex + 1];

  const nextDay = isNewDay ? conditions.day + 1 : conditions.day;

  const isNewSeason = isNewDay && nextDay % 7 === 1;
  const currentSeasonIndex = SEASONS.indexOf(conditions.season);
  const nextSeason: Season = isNewSeason
    ? SEASONS[(currentSeasonIndex + 1) % SEASONS.length]
    : conditions.season;

  const weatherOptions = WEATHER_BY_SEASON[nextSeason];
  const nextWeather: Weather = isNewDay
    ? weatherOptions[Math.floor(Math.random() * weatherOptions.length)]
    : conditions.weather;

  return {
    next: {
      season: nextSeason,
      weather: nextWeather,
      timePeriod: nextTimePeriod,
      day: nextDay,
    },
    isNewDay,
    isNewSeason,
  };
}

/** Returns a CSS color class for a given season. */
export function getSeasonColor(season: Season): string {
  const colors: Record<Season, string> = {
    Spring: 'text-green-400',
    Summer: 'text-yellow-400',
    Autumn: 'text-orange-400',
    Winter: 'text-blue-300',
  };
  return colors[season];
}
