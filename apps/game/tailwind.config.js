import { gpColors, gpFontFamily } from '@glowing-potato/theme/tailwind';

/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
    "../../packages/ui/src/**/*.{js,ts,jsx,tsx}",
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
}

