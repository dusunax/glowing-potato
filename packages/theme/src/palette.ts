// Backward-compatible token exports for @glowing-potato/theme.

export const palette = {
  bg: 'rgb(var(--gp-bg))',
  surface: 'rgb(var(--gp-surface))',
  accent: 'rgb(var(--gp-accent))',
  mint: 'rgb(var(--gp-mint))',
};

export type PaletteKey = keyof typeof palette;
