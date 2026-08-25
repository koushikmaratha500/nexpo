const colors = require('./src/theme/tokens');

/** @type {import('tailwindcss').Config} */
module.exports = {
  content: ['./app/**/*.{js,jsx,ts,tsx}', './src/**/*.{js,jsx,ts,tsx}'],
  presets: [require('nativewind/preset')],
  theme: {
    extend: {
      colors,
      fontFamily: {
        sans: ['Figtree_400Regular'],
        'sans-medium': ['Figtree_500Medium'],
        'sans-semibold': ['Figtree_600SemiBold'],
        'sans-bold': ['Figtree_700Bold'],
        'headline-lg': ['Figtree_700Bold'],
        'headline-md': ['Figtree_600SemiBold'],
        'headline-sm': ['Figtree_600SemiBold'],
        'title-md': ['Figtree_600SemiBold'],
        'body-md': ['Figtree_400Regular'],
        'body-lg': ['Figtree_400Regular'],
        'label-md': ['Figtree_500Medium'],
        mono: ['SpaceMono'],
      },
      fontSize: {
        'headline-lg': ['30px', { lineHeight: '36px', letterSpacing: -0.6, fontWeight: '700' }],
        'headline-md': ['24px', { lineHeight: '32px', letterSpacing: -0.24, fontWeight: '600' }],
        'headline-sm': ['20px', { lineHeight: '28px', fontWeight: '600' }],
        'title-md': ['16px', { lineHeight: '24px', fontWeight: '600' }],
        'body-lg': ['16px', { lineHeight: '24px' }],
        'body-md': ['14px', { lineHeight: '20px' }],
        'label-md': ['12px', { lineHeight: '16px', letterSpacing: 0.24, fontWeight: '500' }],
        'label-sm': ['11px', { lineHeight: '14px', fontWeight: '500' }],
      },
      borderRadius: {
        lg: '0.5rem',
        xl: '0.75rem',
      },
      spacing: {
        xs: '4px',
        sm: '8px',
        md: '16px',
        lg: '24px',
        xl: '32px',
        '2xl': '48px',
        '3xl': '64px',
      },
    },
  },
  plugins: [],
};
