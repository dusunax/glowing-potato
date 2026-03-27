import { useState, useCallback } from 'react';
import type { WorldConditions } from '../types/conditions';
import { advanceTime } from '../utils/time';

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

  return { conditions, advance };
}
