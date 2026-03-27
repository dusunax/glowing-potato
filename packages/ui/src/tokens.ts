// Design tokens for the Glowing Potato design system.
// Colors sourced from: https://colorhunt.co/palette/091413285a48408a71b0e4cc

export const palette = {
  /** Deepest background — #091413 */
  bg: '#091413',
  /** Card / panel surface — #285a48 */
  surface: '#285a48',
  /** Interactive accent — #408a71 */
  accent: '#408a71',
  /** Light mint — text & highlights — #b0e4cc */
  mint: '#b0e4cc',
} as const;

export type PaletteKey = keyof typeof palette;
