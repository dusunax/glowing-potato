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
        // Glowing Potato design system palette
        // https://colorhunt.co/palette/091413285a48408a71b0e4cc
        gp: {
          bg: 'var(--gp-bg)',
          surface: 'var(--gp-surface)',
          accent: 'var(--gp-accent)',
          mint: 'var(--gp-mint)',
        },
      },
    },
  },
  plugins: [],
}

