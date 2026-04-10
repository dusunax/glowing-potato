import { describe, expect, it } from 'vitest';
import { advanceTime, getSeasonColor } from './time';
import type { WorldConditions } from '../types/conditions';

describe('time utilities', () => {
  it('advances within a day without changing season or day', () => {
    const start: WorldConditions = {
      season: 'Spring',
      weather: 'Sunny',
      timePeriod: 'Morning',
      day: 1,
    };

    const { next, isNewDay, isNewSeason } = advanceTime(start);

    expect(next.season).toBe('Spring');
    expect(next.weather).toBe('Sunny');
    expect(next.timePeriod).toBe('Afternoon');
    expect(next.day).toBe(1);
    expect(isNewDay).toBe(false);
    expect(isNewSeason).toBe(false);
  });

  it('advances day and season when night ends on day 7', () => {
    const oldRandom = Math.random;
    Math.random = () => 0;

    try {
      const start: WorldConditions = {
        season: 'Spring',
        weather: 'Sunny',
        timePeriod: 'Night',
        day: 7,
      };

      const { next, isNewDay, isNewSeason } = advanceTime(start);

      expect(isNewDay).toBe(true);
      expect(isNewSeason).toBe(true);
      expect(next.day).toBe(8);
      expect(next.season).toBe('Summer');
      expect(next.weather).toBe('Sunny');
      expect(next.timePeriod).toBe('Morning');
    } finally {
      Math.random = oldRandom;
    }
  });

  it('returns season color style token', () => {
    expect(getSeasonColor('Autumn')).toBe('text-orange-400');
    expect(getSeasonColor('Winter')).toBe('text-blue-300');
  });
});
