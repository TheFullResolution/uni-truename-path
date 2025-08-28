import { createTheme, rem, MantineThemeOverride } from '@mantine/core';

/**
 * Traditional Corporate HR Theme
 * Designed for Fortune 500 HR environments with warm, formal, traditional corporate styling
 * Complete departure from modern tech aesthetics - uses warm corporate colors with classic styling
 *
 * Key Distinctions from TrueNamePath:
 * - Colors: Warm burgundy/gold/forest vs cool blue/green
 * - Typography: Serif headings vs modern sans-serif
 * - Styling: Traditional/formal vs modern/minimal
 * - Philosophy: Corporate/government vs tech startup
 */
export const hrTheme: MantineThemeOverride = createTheme({
  // Corporate burgundy as primary
  primaryColor: 'corporate',

  colors: {
// Corporate Primary - Deep Burgundy/Maroon palette
corporate: [
  '#faf6f7', // Lightest - page backgrounds
  '#f0e6e9', // Light - card backgrounds
  '#e1c5cd', // Light-medium - subtle accents
  '#d2a4b1', // Medium - disabled states
  '#c38395', // Medium-dark - secondary elements
  '#8B2635', // Primary - main corporate burgundy
  '#7a2230', // Dark - hover states
  '#691e2a', // Darker - pressed states
  '#581a24', // Very dark - borders
  '#47161e', // Darkest - high contrast text
],

// Corporate Secondary - Warm Gold/Amber palette
gold: [
  '#fcf9f4', // Lightest - backgrounds
  '#f7f0e6', // Light - hover states
  '#ede0c7', // Light-medium - subtle highlights
  '#e3d0a8', // Medium - secondary elements
  '#d9c089', // Medium-dark - interactive elements
  '#D4A574', // Primary - warm corporate gold
  '#bf9567', // Dark - hover states
  '#aa855a', // Darker - pressed states
  '#95754d', // Very dark - text on light
  '#806540', // Darkest - high contrast
],

// Corporate Tertiary - Deep Forest Green palette
forest: [
  '#f6f8f6', // Lightest - backgrounds
  '#e9ede9', // Light - subtle accents
  '#d3dbd4', // Light-medium - borders
  '#bdc9be', // Medium - secondary elements
  '#a7b7a8', // Medium-dark - interactive states
  '#2C5530', // Primary - deep forest green
  '#274b2b', // Dark - hover states
  '#224126', // Darker - pressed states
  '#1d3721', // Very dark - text on light
  '#182d1c', // Darkest - high contrast
],

// Warm professional grays - cream and brown tones
gray: [
  '#faf9f7', // Warm cream background
  '#f2f0ed', // Light warm backgrounds
  '#e6e2dc', // Warm borders
  '#d7d1c8', // Input borders
  '#c4bbb0', // Disabled states
  '#998c7c', // Secondary text - warm brown
  '#6b5d50', // Primary text - darker brown
  '#4a3f36', // Dark text - rich brown
  '#33291f', // Very dark - deep brown
  '#1f1611', // Darkest - almost black brown
],

// Muted traditional status colors
green: [
  '#f2f6f2',
  '#e0eae0',
  '#c8d8c8',
  '#b0c6b0',
  '#98b498',
  '#4a7c59', // Success - muted forest green
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
  '#8b4513', // Error - warm brown-red
  '#7a3d11',
  '#69350f',
  '#582d0d',
  '#47250b',
],
  },

  // Traditional corporate typography - serif for headings, professional sans for body
  fontFamily: '"Source Sans Pro", -apple-system, system-ui, sans-serif',
  headings: {
fontFamily: 'Georgia, "Times New Roman", Times, serif',
fontWeight: '500', // Traditional - not bold
sizes: {
  h1: { fontSize: rem(32), lineHeight: '1.2' },
  h2: { fontSize: rem(26), lineHeight: '1.3' },
  h3: { fontSize: rem(22), lineHeight: '1.4' },
  h4: { fontSize: rem(18), lineHeight: '1.4' },
  h5: { fontSize: rem(16), lineHeight: '1.5' },
  h6: { fontSize: rem(14), lineHeight: '1.5' },
},
  },

  // Traditional structured spacing
  spacing: {
xs: rem(6),
sm: rem(12),
md: rem(18),
lg: rem(24),
xl: rem(32),
  },

  // Minimal rounded corners for traditional/formal appearance
  radius: {
xs: rem(2), // Very minimal
sm: rem(3), // Traditional forms
md: rem(4), // Conservative
lg: rem(6), // Maximum for formal
xl: rem(8), // Only for special cases
  },

  // Component overrides for traditional corporate styling
  components: {
Container: {
  defaultProps: {
size: 'lg', // More content per screen
  },
},

Button: {
  defaultProps: {
radius: 'sm', // Minimal rounding
  },
  styles: {
root: {
  'fontWeight': 500,
  'fontSize': rem(14),
  'padding': `${rem(10)} ${rem(20)}`,
  'transition': 'all 0.2s ease', // smoother transition
  'textTransform': 'none',
  'fontFamily': '"Source Sans Pro", sans-serif',
  '&:not(:disabled):hover': {
transform: 'translateY(-1px)',
boxShadow: '0 4px 8px var(--mantine-color-corporate-1)',
  },
  '&:focusVisible': {
outline: '2px solid var(--mantine-color-gold-5)', // gold focus ring
outlineOffset: '2px',
  },
},
  },
},

Card: {
  defaultProps: {
radius: 'sm', // Minimal rounding
shadow: 'xs', // Subtle shadow
  },
  styles: {
root: {
  'backgroundColor': 'var(--mantine-color-gray-0)', // Warm cream
  'border': '1px solid var(--mantine-color-gray-3)', // Visible border
  'transition': 'border-color 0.15s ease', // No transform animations
  '&:hover': {
borderColor: 'var(--mantine-color-gray-4)', // Subtle border change only
  },
},
  },
},

Title: {
  styles: {
root: {
  color: 'var(--mantine-color-corporate-5)', // Corporate burgundy for headings
  fontFamily: 'Georgia, "Times New Roman", Times, serif',
  fontWeight: '500',
},
  },
},

Text: {
  styles: {
root: {
  color: 'var(--mantine-color-gray-6)', // Warm brown text
  lineHeight: 1.5,
  fontFamily: '"Source Sans Pro", sans-serif',
},
  },
},

TextInput: {
  defaultProps: {
radius: 'sm', // Traditional form styling
  },
  styles: {
input: {
  'fontSize': rem(14),
  'padding': rem(12),
  'backgroundColor': 'var(--mantine-color-white)',
  'border': '1px solid var(--mantine-color-gray-3)',
  'fontFamily': '"Source Sans Pro", sans-serif',
  '&:focus': {
borderColor: 'var(--mantine-color-corporate-5)', // Corporate burgundy focus
boxShadow: '0 0 0 1px var(--mantine-color-corporate-1)', // Subtle focus
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
  borderRadius: rem(3), // Minimal rounding
},
  },
},

Paper: {
  defaultProps: {
radius: 'sm',
  },
  styles: {
root: {
  backgroundColor: 'var(--mantine-color-gray-0)',
  border: '1px solid var(--mantine-color-gray-3)',
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
  padding: `${rem(12)} ${rem(16)}`,
  borderBottom: '2px solid var(--mantine-color-gray-3)',
},
td: {
  padding: `${rem(10)} ${rem(16)}`,
  fontSize: rem(14),
  color: 'var(--mantine-color-gray-6)',
  borderBottom: '1px solid var(--mantine-color-gray-2)',
},
  },
},
  },

  // Traditional breakpoints
  breakpoints: {
xs: '32em',
sm: '48em',
md: '64em',
lg: '80em',
xl: '96em',
  },
});
