// Defines the four time periods of a game day.
// Order matters: advancing time cycles through this array.

export const TIME_PERIODS = ['Morning', 'Afternoon', 'Evening', 'Night'] as const;
export type TimePeriod = typeof TIME_PERIODS[number];

export const TIME_PERIOD_EMOJIS: Record<TimePeriod, string> = {
  Morning: '🌅',
  Afternoon: '☀️',
  Evening: '🌆',
  Night: '🌙',
};
