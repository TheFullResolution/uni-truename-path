import { createTheme, rem, MantineThemeOverride } from '@mantine/core';

/**
 * Modern Chat Theme
 */
export const brandGradient =
  'linear-gradient(135deg, var(--mantine-color-electric-5) 0%, var(--mantine-color-teal-5) 100%)';

export const chatTheme: MantineThemeOverride = createTheme({
  primaryColor: 'electric',

  colors: {
electric: [
  '#faf5ff',
  '#f3e8ff',
  '#e9d5ff',
  '#d8b4fe',
  '#c084fc',
  '#7C3AED',
  '#6d28d9',
  '#5b21b6',
  '#4c1d95',
  '#3c1361',
],

teal: [
  '#f0fdfa',
  '#ccfbf1',
  '#99f6e4',
  '#5eead4',
  '#2dd4bf',
  '#14B8A6',
  '#0d9488',
  '#0f766e',
  '#115e59',
  '#134e4a',
],

coral: [
  '#fff1f2',
  '#ffe4e6',
  '#fecdd3',
  '#fda4af',
  '#fb7185',
  '#f43f5e',
  '#e11d48',
  '#be123c',
  '#9f1239',
  '#881337',
],

gray: [
  '#f8fafc',
  '#f1f5f9',
  '#e2e8f0',
  '#cbd5e1',
  '#94a3b8',
  '#64748b',
  '#475569',
  '#334155',
  '#1e293b',
  '#0f172a',
],

green: [
  '#f0fdf4',
  '#dcfce7',
  '#bbf7d0',
  '#86efac',
  '#4ade80',
  '#22C55E',
  '#16a34a',
  '#15803d',
  '#166534',
  '#14532d',
],

red: [
  '#fef2f2',
  '#fecaca',
  '#fca5a5',
  '#f87171',
  '#ef4444',
  '#EF4444',
  '#dc2626',
  '#b91c1c',
  '#991b1b',
  '#7f1d1d',
],

orange: [
  '#fff7ed',
  '#ffedd5',
  '#fed7aa',
  '#fdba74',
  '#fb923c',
  '#F97316',
  '#ea580c',
  '#c2410c',
  '#9a3412',
  '#7c2d12',
],
  },

  fontFamily: '"Inter", "Poppins", -apple-system, system-ui, sans-serif',
  headings: {
fontFamily: '"Poppins", "Inter", -apple-system, system-ui, sans-serif',
fontWeight: '600',
sizes: {
  h1: { fontSize: rem(36), lineHeight: '1.2' },
  h2: { fontSize: rem(30), lineHeight: '1.3' },
  h3: { fontSize: rem(24), lineHeight: '1.4' },
  h4: { fontSize: rem(20), lineHeight: '1.4' },
  h5: { fontSize: rem(18), lineHeight: '1.5' },
  h6: { fontSize: rem(16), lineHeight: '1.5' },
},
  },

  spacing: {
xs: rem(8),
sm: rem(12),
md: rem(16),
lg: rem(24),
xl: rem(32),
  },

  radius: {
xs: rem(6),
sm: rem(8),
md: rem(12),
lg: rem(16),
xl: rem(20),
  },

  components: {
Container: {
  defaultProps: {
size: 'md',
  },
},

Button: {
  defaultProps: {
radius: 'lg',
  },
  styles: {
root: {
  'fontWeight': 600,
  'fontSize': rem(15),
  'transition': 'all 0.2s ease, transform 0.15s ease',
  'textTransform': 'none',
  'boxShadow': '0 2px 8px rgba(124, 58, 237, 0.15)',
  '&:hover': {
transform: 'translateY(-2px)',
boxShadow: '0 4px 16px rgba(124, 58, 237, 0.25)',
  },
},
  },
},

Card: {
  defaultProps: {
radius: 'lg',
shadow: 'md',
  },
  styles: {
root: {
  'backgroundColor': 'var(--mantine-color-gray-0)',
  'border': '1px solid var(--mantine-color-gray-3)',
  'transition': 'all 0.2s ease, transform 0.15s ease',
  'boxShadow': '0 4px 16px rgba(124, 58, 237, 0.08)',
  '&:hover': {
transform: 'translateY(-4px)',
boxShadow: '0 8px 24px rgba(124, 58, 237, 0.15)',
borderColor: 'var(--mantine-color-electric-4)',
  },
},
  },
},

Title: {
  styles: {
root: {
  color: 'var(--mantine-color-electric-5)',
  fontWeight: '600',
},
  },
},

Text: {
  styles: {
root: {
  color: 'var(--mantine-color-gray-6)',
  lineHeight: 1.6,
},
  },
},

TextInput: {
  defaultProps: {
radius: 'md',
  },
  styles: {
input: {
  'fontSize': rem(15),
  'backgroundColor': 'var(--mantine-color-white)',
  'border': '2px solid var(--mantine-color-gray-3)',
  'transition': 'all 0.2s ease',
  '&:focus': {
borderColor: 'var(--mantine-color-electric-5)',
boxShadow: '0 0 0 3px rgba(124, 58, 237, 0.1)',
  },
},
label: {
  color: 'var(--mantine-color-gray-7)',
  fontWeight: 600,
  fontSize: rem(14),
  marginBottom: rem(8),
},
  },
},

Badge: {
  styles: {
root: {
  fontSize: rem(12),
  fontWeight: 600,
  textTransform: 'uppercase' as const,
  letterSpacing: '0.5px',
  borderRadius: rem(8),
},
  },
},

Paper: {
  defaultProps: {
radius: 'lg',
  },
  styles: {
root: {
  backgroundColor: 'var(--mantine-color-gray-0)',
  border: '1px solid var(--mantine-color-gray-3)',
  boxShadow: '0 2px 12px rgba(124, 58, 237, 0.05)',
},
  },
},

Divider: {
  styles: {
root: {
  borderTopColor: 'var(--mantine-color-gray-3)',
},
  },
},

Table: {
  styles: {
th: {
  backgroundColor: 'var(--mantine-color-gray-1)',
  color: 'var(--mantine-color-gray-7)',
  fontSize: rem(13),
  fontWeight: 700,
  textTransform: 'uppercase',
  letterSpacing: '0.5px',
  borderBottom: '2px solid var(--mantine-color-gray-3)',
},
td: {
  fontSize: rem(15),
  color: 'var(--mantine-color-gray-6)',
  borderBottom: '1px solid var(--mantine-color-gray-3)',
},
  },
},

Alert: {
  styles: {
root: {
  borderRadius: rem(12),
  border: '1px solid',
},
  },
},
  },

  breakpoints: {
xs: '30em',
sm: '48em',
md: '64em',
lg: '80em',
xl: '96em',
  },
});
