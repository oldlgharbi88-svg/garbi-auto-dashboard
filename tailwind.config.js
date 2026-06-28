/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{ts,tsx}'],
  darkMode: 'class',
  theme: {
    extend: {
      colors: {
        surface: '#030712',
        'surface-container': '#111827',
        'surface-container-lowest': '#030712',
        'surface-container-high': '#1f2937',
        'surface-container-highest': '#374151',
        'surface-variant': '#1f2937',
        primary: '#2563eb',
        'on-primary': '#f8fafc',
        secondary: '#93c5fd',
        'secondary-container': '#1d4ed8',
        'on-secondary-container': '#eff6ff',
        outline: '#475569',
        'outline-variant': '#334155',
        'on-surface': '#f8fafc',
        'on-surface-variant': '#cbd5e1',
        error: '#ef4444',
        'error-container': '#7f1d1d',
        'on-error': '#fff1f2',
        success: '#10b981'
      },
      borderRadius: {
        xl: '1rem',
        '2xl': '1.25rem',
        '3xl': '1.5rem'
      },
      spacing: {
        18: '4.5rem',
        22: '5.5rem',
        30: '7.5rem'
      },
      height: {
        'touch-target': '44px'
      },
      fontFamily: {
        sans: ['IBM Plex Sans', 'Inter', 'ui-sans-serif', 'system-ui', 'sans-serif'],
        display: ['Inter', 'IBM Plex Sans', 'ui-sans-serif', 'sans-serif'],
        mono: ['JetBrains Mono', 'ui-monospace', 'monospace']
      },
      fontSize: {
        'data-tabular': ['0.95rem', { lineHeight: '1.25rem', letterSpacing: '0.02em' }]
      }
    }
  },
  plugins: []
};
