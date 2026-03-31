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

export function useConditions() {
  const [conditions, setConditions] = useState<WorldConditions>(INITIAL_CONDITIONS);

  const advance = useCallback((): string[] => {
    let msgs: string[] = [];
    setConditions((prev) => {
      const { next, isNewDay, isNewSeason } = advanceTime(prev);
      const m: string[] = [];
      if (isNewDay) m.push(`Day ${next.day} begins.`);
      if (isNewSeason) m.push(`Season changed to ${next.season}!`);
      msgs = m;
      return next;
    });
    return msgs;
  }, []);

  const shiftWeather = useCallback((): string => {
    let msg = '';
    setConditions((prev) => {
      const options = WEATHER_BY_SEASON[prev.season];
      if (!options || options.length === 0) return prev;
      const others = options.filter((w) => w !== prev.weather);
      const pool = others.length > 0 ? others : options;
      const next = pool[Math.floor(Math.random() * pool.length)]!;
      msg = `Weather shifted to ${next}!`;
      return { ...prev, weather: next };
    });
    return msg;
  }, []);

  return { conditions, advance, shiftWeather };
}
