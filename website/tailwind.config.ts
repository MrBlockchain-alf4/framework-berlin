import type { Config } from 'tailwindcss'

const config: Config = {
  content: [
    './pages/**/*.{js,ts,jsx,tsx,mdx}',
    './components/**/*.{js,ts,jsx,tsx,mdx}',
    './app/**/*.{js,ts,jsx,tsx,mdx}',
  ],
  theme: {
    extend: {
      colors: {
        cream:        '#f5f1ed',
        'cream-light':'#faf8f5',
        charcoal:     '#1a1a1a',
        forest:       '#1a3a2a',
        'forest-dark':'#143020',
      },
      fontFamily: {
        syne:  ['var(--font-syne)', 'sans-serif'],
        inter: ['var(--font-inter)', 'sans-serif'],
      },
      letterSpacing: {
        tightest: '-0.03em',
        tighter:  '-0.02em',
      },
    },
  },
  plugins: [],
}

export default config
