import type { Config } from 'tailwindcss';

const config: Config = {
  content: ['./src/**/*.{ts,tsx}'],
  theme: {
    extend: {
      fontFamily: {
        sans: ['var(--font-sans)', 'ui-sans-serif', 'system-ui', 'sans-serif'],
        mono: ['var(--font-mono)', 'ui-monospace', 'SFMono-Regular', 'monospace'],
      },
      boxShadow: {
        card: '0 1px 2px 0 rgb(0 0 0 / 0.04), 0 1px 3px 0 rgb(0 0 0 / 0.03)',
        panel: '0 24px 48px -12px rgb(0 0 0 / 0.18)',
      },
      keyframes: {
        blink: { '0%, 80%, 100%': { opacity: '0.2' }, '40%': { opacity: '1' } },
      },
      animation: {
        blink: 'blink 1.4s infinite both',
      },
    },
  },
  plugins: [],
};

export default config;
