// WorldConditions represents the current state of the game world.
// Passed to spawning logic to determine which items can appear.

import type { Season } from '../constants/seasons';
import type { Weather } from '../constants/weather';
import type { TimePeriod } from '../constants/timePeriods';

export interface WorldConditions {
  season: Season;
  weather: Weather;
  timePeriod: TimePeriod;
  day: number;
}
