import type { Config } from 'tailwindcss';

const config: Config = {
  content: [
    './src/**/*.{ts,tsx}',
    '../../packages/ui/src/**/*.{ts,tsx}',
    '../../packages/domain-ui/src/**/*.{ts,tsx}',
  ],
  theme: {
    extend: {
      colors: {
        primary: { DEFAULT: '#0ea5e9', foreground: '#ffffff' },
        destructive: { DEFAULT: '#ef4444', foreground: '#ffffff' },
        muted: { DEFAULT: '#f1f5f9', foreground: '#64748b' },
        accent: { DEFAULT: '#f1f5f9', foreground: '#0f172a' },
        background: '#ffffff',
        foreground: '#0f172a',
        card: { DEFAULT: '#ffffff', foreground: '#0f172a' },
        border: '#e2e8f0',
        input: '#e2e8f0',
        ring: '#0ea5e9',
      },
    },
  },
  plugins: [],
};

export default config;
