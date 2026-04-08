import { useState, useCallback } from 'react';
import type { WorldConditions } from '../types/conditions';
import { advanceTime } from '../utils/time';
import { WEATHER_BY_SEASON } from '../constants/weather';

const INITIAL_CONDITIONS: WorldConditions = {
  season: 'Spring',
  weather: 'Sunny',
  timePeriod: 'Morning',
  day: 1,
};

export interface TimeAdvanceResult {
  messages: string[];
  isNewDay: boolean;
  isNewSeason: boolean;
  resourceRefillCount: number;
  caveSpawnCount: number;
  skeletonSpawnCount: number;
}

export function useConditions() {
  const [conditions, setConditions] = useState<WorldConditions>(INITIAL_CONDITIONS);

  const advance = useCallback((steps = 1): TimeAdvanceResult => {
    const stepsToAdvance = Math.max(1, Math.floor(steps));
    let next = conditions;
    const messages: string[] = [];
    let isNewDay = false;
    let isNewSeason = false;
    let resourceRefillCount = 0;
    let caveSpawnCount = 0;
    let skeletonSpawnCount = 0;

    for (let i = 0; i < stepsToAdvance; i++) {
      const result = advanceTime(next);
      next = result.next;

      if (result.isNewDay) {
        messages.push(`Day ${next.day} begins.`);
        isNewDay = true;
        if (next.day % 7 === 0) {
          resourceRefillCount += 1;
        }
        if (next.day % 3 === 0) {
          caveSpawnCount += 1;
        }
        if (next.day % 15 === 0) {
          skeletonSpawnCount += 1;
        }
      }

      if (result.isNewSeason) {
        messages.push(`Season changed to ${next.season}!`);
        isNewSeason = true;
      }
    }

    setConditions(next);
    return {
      messages,
      isNewDay,
      isNewSeason,
      resourceRefillCount,
      caveSpawnCount,
      skeletonSpawnCount,
    };
  }, [conditions]);

  const shiftWeather = useCallback((): string => {
    let msg = '';
    setConditions((prev) => {
      const options = WEATHER_BY_SEASON[prev.season];
      if (!options || options.length === 0) return prev;
      const uniqueOptions = Array.from(new Set(options));
      let next = prev.weather;

      if (uniqueOptions.length <= 1) return prev;
      while (next === prev.weather) {
        next = uniqueOptions[Math.floor(Math.random() * uniqueOptions.length)];
      }

      msg = `Weather shifted to ${next}!`;
      return { ...prev, weather: next };
    });
    return msg;
  }, []);

  return { conditions, advance, shiftWeather };
}
