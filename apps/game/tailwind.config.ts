import { gpColors, gpFontFamily } from '../../packages/theme/src/tailwind';
import type { Config } from 'tailwindcss';

const config: Config = {
  content: [
    './index.html',
    './src/**/*.{js,ts,jsx,tsx}',
    '../../packages/ui/src/**/*.{js,ts,jsx,tsx}',
  ],
  theme: {
    extend: {
      colors: {
        // Glowing Potato design system palette (sourced from @glowing-potato/theme)
        // https://colorhunt.co/palette/091413285a48408a71b0e4cc
        gp: gpColors,
      },
      fontFamily: gpFontFamily,
    },
  },
  plugins: [],
};

export default config;
