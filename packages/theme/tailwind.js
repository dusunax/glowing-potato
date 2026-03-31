// Glowing Potato Tailwind theme extension.
// Import this in your tailwind.config.js to use the gp.* color tokens.
//
// Usage:
//   import { gpColors, gpFontFamily } from '@glowing-potato/theme/tailwind';
//   export default { theme: { extend: { colors: { gp: gpColors }, fontFamily: gpFontFamily } } }

/** Tailwind color tokens using CSS variable channels — supports opacity modifiers (e.g. bg-gp-bg/50). */
export const gpColors = {
  bg:      'rgb(var(--gp-bg)      / <alpha-value>)',
  surface: 'rgb(var(--gp-surface) / <alpha-value>)',
  accent:  'rgb(var(--gp-accent)  / <alpha-value>)',
  mint:    'rgb(var(--gp-mint)    / <alpha-value>)',
};

/** Font family stack for the Glowing Potato design system. */
export const gpFontFamily = {
  sans: ['Nunito', 'system-ui', 'sans-serif'],
};
