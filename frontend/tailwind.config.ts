import type { Config } from 'tailwindcss';

const config: Config = {
  darkMode: ['class'],
  content: ['./app/**/*.{ts,tsx}', './components/**/*.{ts,tsx}', './lib/**/*.{ts,tsx}'],
  theme: {
    extend: {
      colors: {
        border: 'hsl(var(--border))',
        background: 'hsl(var(--background))',
        foreground: 'hsl(var(--foreground))',
        card: { DEFAULT: 'hsl(var(--card))', foreground: 'hsl(var(--card-foreground))' },
        muted: { DEFAULT: 'hsl(var(--muted))', foreground: 'hsl(var(--muted-foreground))' },
        primary: { DEFAULT: 'hsl(var(--primary))', foreground: 'hsl(var(--primary-foreground))' },
        accent: { DEFAULT: 'hsl(var(--accent))', foreground: 'hsl(var(--accent-foreground))' },
        destructive: { DEFAULT: 'hsl(var(--destructive))', foreground: 'hsl(var(--destructive-foreground))' },
        success: { DEFAULT: 'hsl(var(--success))', foreground: 'hsl(var(--success-foreground))' },
        warning: { DEFAULT: 'hsl(var(--warning))', foreground: 'hsl(var(--warning-foreground))' },
        field: { dark: 'hsl(var(--field-dark))', warm: 'hsl(var(--field-warm))' },
      },
      fontFamily: {
        sans: ['var(--font-schibsted)', 'ui-sans-serif', 'system-ui', 'sans-serif'],
      },
      fontSize: {
        // exactly five steps: small, body, lead, head, display
        'step-small': ['clamp(0.8125rem, 0.79rem + 0.1vw, 0.875rem)', { lineHeight: '1.4', letterSpacing: '-0.01em' }],
        'step-body': ['clamp(1.0625rem, 1rem + 0.25vw, 1.1875rem)', { lineHeight: '1.5', letterSpacing: '-0.01em' }],
        'step-lead': ['clamp(1.25rem, 1.1rem + 0.7vw, 1.625rem)', { lineHeight: '1.35', letterSpacing: '-0.015em' }],
        'step-head': ['clamp(1.75rem, 1.1rem + 2.6vw, 3rem)', { lineHeight: '1.0', letterSpacing: '-0.04em' }],
        display: ['clamp(3rem, 7vw, 6.5rem)', { lineHeight: '0.95', letterSpacing: '-0.05em' }],
      },
      borderRadius: {
        // the artefact has square edges; sheets of the app get the 16px radius
        xl: '0',
        '2xl': '1rem',
        '3xl': '1.5rem',
      },
      keyframes: {
        'fade-up': {
          from: { opacity: '0', transform: 'translateY(14px)' },
          to: { opacity: '1', transform: 'translateY(0)' },
        },
      },
      animation: {
        'fade-up': 'fade-up 0.5s ease-out both',
      },
    },
  },
  plugins: [require('tailwindcss-animate')],
};

export default config;
