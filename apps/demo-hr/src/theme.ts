import { createTheme, rem, MantineThemeOverride } from '@mantine/core';

/**
 * Traditional Corporate HR Theme
 */
export const hrTheme: MantineThemeOverride = createTheme({
  primaryColor: 'corporate',

  colors: {
corporate: [
  '#faf6f7',
  '#f0e6e9',
  '#e1c5cd',
  '#d2a4b1',
  '#c38395',
  '#8B2635',
  '#7a2230',
  '#691e2a',
  '#581a24',
  '#47161e',
],

gold: [
  '#fcf9f4',
  '#f7f0e6',
  '#ede0c7',
  '#e3d0a8',
  '#d9c089',
  '#D4A574',
  '#bf9567',
  '#aa855a',
  '#95754d',
  '#806540',
],

forest: [
  '#f6f8f6',
  '#e9ede9',
  '#d3dbd4',
  '#bdc9be',
  '#a7b7a8',
  '#2C5530',
  '#274b2b',
  '#224126',
  '#1d3721',
  '#182d1c',
],

gray: [
  '#faf9f7',
  '#f2f0ed',
  '#e6e2dc',
  '#d7d1c8',
  '#c4bbb0',
  '#998c7c',
  '#6b5d50',
  '#4a3f36',
  '#33291f',
  '#1f1611',
],

green: [
  '#f2f6f2',
  '#e0eae0',
  '#c8d8c8',
  '#b0c6b0',
  '#98b498',
  '#4a7c59',
  '#3f6b4d',
  '#345a41',
  '#294935',
  '#1e3829',
],

red: [
  '#f8f2f2',
  '#ede0e0',
  '#dbc8c8',
  '#c9b0b0',
  '#b79898',
  '#8b4513',
  '#7a3d11',
  '#69350f',
  '#582d0d',
  '#47250b',
],
  },

  fontFamily: '"Source Sans Pro", -apple-system, system-ui, sans-serif',
  headings: {
fontFamily: 'Georgia, "Times New Roman", Times, serif',
fontWeight: '500',
sizes: {
  h1: { fontSize: rem(32), lineHeight: '1.2' },
  h2: { fontSize: rem(26), lineHeight: '1.3' },
  h3: { fontSize: rem(22), lineHeight: '1.4' },
  h4: { fontSize: rem(18), lineHeight: '1.4' },
  h5: { fontSize: rem(16), lineHeight: '1.5' },
  h6: { fontSize: rem(14), lineHeight: '1.5' },
},
  },

  spacing: {
xs: rem(6),
sm: rem(12),
md: rem(18),
lg: rem(24),
xl: rem(32),
  },

  radius: {
xs: rem(2),
sm: rem(3),
md: rem(4),
lg: rem(6),
xl: rem(8),
  },

  components: {
Container: {
  defaultProps: {
size: 'lg',
  },
},

Button: {
  defaultProps: {
radius: 'sm',
  },
  styles: {
root: {
  'fontWeight': 500,
  'fontSize': rem(14),
  // Let Mantine handle padding to respect leftSection/rightSection
  'transition': 'all 0.2s ease',
  'textTransform': 'none',
  'fontFamily': '"Source Sans Pro", sans-serif',
  '&:not(:disabled):hover': {
transform: 'translateY(-1px)',
boxShadow: '0 4px 8px var(--mantine-color-corporate-1)',
  },
  '&:focusVisible': {
outline: '2px solid var(--mantine-color-gold-5)',
outlineOffset: '2px',
  },
},
  },
},

Card: {
  defaultProps: {
radius: 'sm',
shadow: 'xs',
withBorder: true,
  },
  styles: {
root: {
  'backgroundColor': 'var(--mantine-color-gray-0)',
  'transition': 'border-color 0.15s ease',
  '&:hover': {
borderColor: 'var(--mantine-color-gray-4)',
  },
},
  },
},

Title: {
  styles: {
root: {
  color: 'var(--mantine-color-corporate-5)',
  fontFamily: 'Georgia, "Times New Roman", Times, serif',
  fontWeight: '500',
},
  },
},

Text: {
  styles: {
root: {
  color: 'var(--mantine-color-gray-6)',
  lineHeight: 1.5,
  fontFamily: '"Source Sans Pro", sans-serif',
},
  },
},

TextInput: {
  defaultProps: {
radius: 'sm',
  },
  styles: {
input: {
  'fontSize': rem(14),
  // Let Mantine handle padding to respect leftSection/rightSection
  'backgroundColor': 'var(--mantine-color-white)',
  'border': '1px solid var(--mantine-color-gray-3)',
  'fontFamily': '"Source Sans Pro", sans-serif',
  '&:focus': {
borderColor: 'var(--mantine-color-corporate-5)',
boxShadow: '0 0 0 1px var(--mantine-color-corporate-1)',
  },
},
label: {
  color: 'var(--mantine-color-gray-7)',
  fontWeight: 500,
  fontSize: rem(13),
  textTransform: 'uppercase',
  letterSpacing: '0.5px',
},
  },
},

Badge: {
  styles: {
root: {
  fontSize: rem(11),
  fontWeight: 500,
  textTransform: 'uppercase' as const,
  letterSpacing: '0.75px',
  fontFamily: '"Source Sans Pro", sans-serif',
  borderRadius: rem(3),
},
  },
},

Paper: {
  defaultProps: {
radius: 'sm',
withBorder: true,
  },
  styles: {
root: {
  backgroundColor: 'var(--mantine-color-gray-0)',
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

LoadingOverlay: {
  defaultProps: {
loaderProps: {
  type: 'dots',
  color: 'corporate',
},
overlayProps: {
  radius: 'sm',
  blur: 1,
  backgroundOpacity: 0.7,
},
  },
},

Table: {
  styles: {
th: {
  backgroundColor: 'var(--mantine-color-gray-1)',
  color: 'var(--mantine-color-gray-7)',
  fontSize: rem(12),
  fontWeight: 600,
  textTransform: 'uppercase',
  letterSpacing: '0.5px',
  // Let Mantine handle responsive padding
  borderBottom: '2px solid var(--mantine-color-gray-3)',
},
td: {
  // Let Mantine handle responsive padding
  fontSize: rem(14),
  color: 'var(--mantine-color-gray-6)',
  borderBottom: '1px solid var(--mantine-color-gray-2)',
},
  },
},
  },

  breakpoints: {
xs: '32em',
sm: '48em',
md: '64em',
lg: '80em',
xl: '96em',
  },
});
