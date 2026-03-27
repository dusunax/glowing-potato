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
        // Using rgb(var(...) / <alpha-value>) so opacity modifiers like /50 work correctly.
        gp: {
          bg:      'rgb(var(--gp-bg)      / <alpha-value>)',
          surface: 'rgb(var(--gp-surface) / <alpha-value>)',
          accent:  'rgb(var(--gp-accent)  / <alpha-value>)',
          mint:    'rgb(var(--gp-mint)    / <alpha-value>)',
        },
      },
      fontFamily: {
        sans: ['Nunito', 'system-ui', 'sans-serif'],
      },
    },
  },
  plugins: [],
}

