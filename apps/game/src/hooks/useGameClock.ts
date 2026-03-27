import { useState, useEffect, useCallback } from 'react';
import type { Season, Weather, TimeOfDay, WorldConditions } from '../types/game';

const SEASONS: Season[] = ['spring', 'summer', 'autumn', 'winter'];

const TIMES: TimeOfDay[] = ['dawn', 'morning', 'afternoon', 'dusk', 'night', 'midnight'];

const WEATHER_BY_SEASON: Record<Season, Weather[]> = {
  spring: ['sunny', 'cloudy', 'rainy', 'misty'],
  summer: ['sunny', 'sunny', 'cloudy', 'stormy'],
  autumn: ['cloudy', 'rainy', 'sunny', 'misty'],
  winter: ['snowy', 'snowy', 'cloudy', 'misty'],
};

const TICK_INTERVAL_MS = 5000; // 5 seconds per tick
const TICKS_PER_TIME = 3;       // 3 ticks per time-of-day slot
const TIMES_PER_DAY = TIMES.length;
const DAYS_PER_SEASON = 7;
const SEASONS_PER_YEAR = 4;

function randomWeather(season: Season): Weather {
  const pool = WEATHER_BY_SEASON[season];
  return pool[Math.floor(Math.random() * pool.length)];
}

export function useGameClock() {
  const [conditions, setConditions] = useState<WorldConditions>(() => ({
    season: 'spring',
    weather: 'sunny',
    timeOfDay: 'morning',
    dayCount: 1,
    tick: 0,
  }));

  const [paused, setPaused] = useState(false);

  const advanceTick = useCallback(() => {
    setConditions(prev => {
      const newTick = prev.tick + 1;
      const totalTicks = newTick;
      const ticksPerDay = TICKS_PER_TIME * TIMES_PER_DAY;

      const timeIndex = Math.floor((totalTicks / TICKS_PER_TIME) % TIMES_PER_DAY);
      const dayCount = Math.floor(totalTicks / ticksPerDay) + 1;
      const seasonIndex = Math.floor((dayCount - 1) / DAYS_PER_SEASON) % SEASONS_PER_YEAR;
      const timeOfDay = TIMES[timeIndex];
      const season = SEASONS[seasonIndex];

      // Change weather at dawn each day
      const isNewDay = totalTicks % ticksPerDay === 0;
      const weather = isNewDay ? randomWeather(season) : prev.weather;

      return { season, weather, timeOfDay, dayCount, tick: newTick };
    });
  }, []);

  useEffect(() => {
    if (paused) return;
    const interval = setInterval(advanceTick, TICK_INTERVAL_MS);
    return () => clearInterval(interval);
  }, [paused, advanceTick]);

  return { conditions, paused, setPaused };
}
