// Static event message templates for game feedback.
// No logic here — pure message data only.

export const COLLECT_MESSAGES = {
  success: (name: string, emoji: string) => `You found a ${emoji} ${name}!`,
  empty: () => 'Nothing to collect right now. Try a different time or weather.',
};

export const CRAFT_MESSAGES = {
  success: (name: string) => `✨ Crafted: ${name}!`,
  noIngredients: (name: string) => `Not enough ingredients for ${name}.`,
};

export const TIME_MESSAGES = {
  newDay: (day: number) => `🌅 Day ${day} begins.`,
  seasonChange: (season: string) => `🍃 The season changed to ${season}!`,
};
