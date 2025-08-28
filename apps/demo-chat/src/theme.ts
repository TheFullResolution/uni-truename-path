import { createTheme, rem, MantineThemeOverride } from '@mantine/core';

/**
 * Modern Chat Theme
 * Designed for casual communication platforms with vibrant, playful, social styling
 * Inspired by Discord, Slack, and modern messaging applications
 *
 * Key Distinctions from Other Apps:
 * - Colors: Electric purple/bright teal vs blue/burgundy
 * - Typography: Modern rounded sans-serif vs serif/traditional
 * - Styling: Playful/social vs professional/corporate
 * - Philosophy: Casual communication vs business/enterprise
 */
// Shared brand gradient for consistent theming across components
export const brandGradient =
  'linear-gradient(135deg, var(--mantine-color-electric-5) 0%, var(--mantine-color-teal-5) 100%)';

export const chatTheme: MantineThemeOverride = createTheme({
  // Electric purple as primary
  primaryColor: 'electric',

  colors: {
// Electric Primary - Vibrant Purple palette
electric: [
  '#faf5ff', // Lightest - backgrounds
  '#f3e8ff', // Light - hover states
  '#e9d5ff', // Light-medium - subtle accents
  '#d8b4fe', // Medium - disabled states
  '#c084fc', // Medium-dark - secondary elements
  '#7C3AED', // Primary - electric purple
  '#6d28d9', // Dark - hover states
  '#5b21b6', // Darker - pressed states
  '#4c1d95', // Very dark - borders
  '#3c1361', // Darkest - high contrast text
],

// Bright Teal - Communication focused
teal: [
  '#f0fdfa', // Lightest - backgrounds
  '#ccfbf1', // Light - subtle highlights
  '#99f6e4', // Light-medium - accents
  '#5eead4', // Medium - interactive elements
  '#2dd4bf', // Medium-dark - active states
  '#14B8A6', // Primary - bright teal
  '#0d9488', // Dark - hover states
  '#0f766e', // Darker - pressed states
  '#115e59', // Very dark - text on light
  '#134e4a', // Darkest - high contrast
],

// Coral Pink - Friendly notifications and accents
coral: [
  '#fff1f2', // Lightest - backgrounds
  '#ffe4e6', // Light - hover states
  '#fecdd3', // Light-medium - subtle highlights
  '#fda4af', // Medium - secondary elements
  '#fb7185', // Primary - coral pink
  '#f43f5e', // Medium-dark - interactive elements
  '#e11d48', // Dark - hover states
  '#be123c', // Darker - pressed states
  '#9f1239', // Very dark - text on light
  '#881337', // Darkest - high contrast
],

// Modern messaging grays - cool and clean
gray: [
  '#f8fafc', // Clean light background
  '#f1f5f9', // Light backgrounds
  '#e2e8f0', // Subtle borders
  '#cbd5e1', // Input borders
  '#94a3b8', // Disabled states
  '#64748b', // Secondary text
  '#475569', // Primary text
  '#334155', // Dark text
  '#1e293b', // Very dark
  '#0f172a', // Darkest - almost black
],

// Vibrant status colors for chat
green: [
  '#f0fdf4',
  '#dcfce7',
  '#bbf7d0',
  '#86efac',
  '#4ade80',
  '#22C55E', // Online status - vibrant green
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
  '#EF4444', // Error/offline - bright red
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
  '#F97316', // Away status - vibrant orange
  '#ea580c',
  '#c2410c',
  '#9a3412',
  '#7c2d12',
],
  },

  // Modern, friendly typography optimized for chat
  fontFamily: '"Inter", "Poppins", -apple-system, system-ui, sans-serif',
  headings: {
fontFamily: '"Poppins", "Inter", -apple-system, system-ui, sans-serif',
fontWeight: '600', // Slightly bold for modern feel
sizes: {
  h1: { fontSize: rem(36), lineHeight: '1.2' },
  h2: { fontSize: rem(30), lineHeight: '1.3' },
  h3: { fontSize: rem(24), lineHeight: '1.4' },
  h4: { fontSize: rem(20), lineHeight: '1.4' },
  h5: { fontSize: rem(18), lineHeight: '1.5' },
  h6: { fontSize: rem(16), lineHeight: '1.5' },
},
  },

  // Chat-optimized spacing for conversation flow
  spacing: {
xs: rem(8),
sm: rem(12),
md: rem(16),
lg: rem(24),
xl: rem(32),
  },

  // Large rounded corners for friendly, modern feel
  radius: {
xs: rem(6), // Minimum for modern feel
sm: rem(8), // Standard chat elements
md: rem(12), // Cards and containers
lg: rem(16), // Large elements
xl: rem(20), // Maximum for special cases
  },

  // Component overrides for modern chat styling
  components: {
Container: {
  defaultProps: {
size: 'md', // Comfortable for chat interfaces
  },
},

Button: {
  defaultProps: {
radius: 'lg', // Very rounded for friendly feel
  },
  styles: {
root: {
  'fontWeight': 600, // Bold for modern UI
  'fontSize': rem(15),
  'padding': `${rem(12)} ${rem(24)}`, // Generous padding
  'transition': 'all 0.2s ease, transform 0.15s ease', // Smooth animations
  'textTransform': 'none',
  'fontFamily': '"Inter", sans-serif',
  'boxShadow': '0 2px 8px rgba(124, 58, 237, 0.15)',
  '&:hover': {
transform: 'translateY(-2px)', // Lift effect
boxShadow: '0 4px 16px rgba(124, 58, 237, 0.25)',
  },
},
  },
},

Card: {
  defaultProps: {
radius: 'lg', // Large rounded corners
shadow: 'md', // Prominent shadow
  },
  styles: {
root: {
  'backgroundColor': '#f8fafc', // Clean light background
  'border': '1px solid #e2e8f0', // Subtle border
  'transition': 'all 0.2s ease, transform 0.15s ease',
  'boxShadow': '0 4px 16px rgba(124, 58, 237, 0.08)', // Colorful shadow
  '&:hover': {
transform: 'translateY(-4px)',
boxShadow: '0 8px 24px rgba(124, 58, 237, 0.15)',
borderColor: '#c084fc',
  },
},
  },
},

Title: {
  styles: {
root: {
  color: '#7C3AED', // Electric purple for headings
  fontFamily: '"Poppins", sans-serif',
  fontWeight: '600',
},
  },
},

Text: {
  styles: {
root: {
  color: '#475569', // Modern gray text
  lineHeight: 1.6, // Optimized for reading
  fontFamily: '"Inter", sans-serif',
},
  },
},

TextInput: {
  defaultProps: {
radius: 'md', // Rounded inputs for modern feel
  },
  styles: {
input: {
  'fontSize': rem(15),
  'padding': rem(14),
  'backgroundColor': '#ffffff',
  'border': '2px solid #e2e8f0',
  'fontFamily': '"Inter", sans-serif',
  'transition': 'all 0.2s ease',
  '&:focus': {
borderColor: '#7C3AED', // Electric purple focus
boxShadow: '0 0 0 3px rgba(124, 58, 237, 0.1)', // Glow effect
  },
},
label: {
  color: '#334155',
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
  fontFamily: '"Inter", sans-serif',
  borderRadius: rem(8), // Rounded badges
  padding: `${rem(6)} ${rem(12)}`,
},
  },
},

Paper: {
  defaultProps: {
radius: 'lg',
  },
  styles: {
root: {
  backgroundColor: '#f8fafc',
  border: '1px solid #e2e8f0',
  boxShadow: '0 2px 12px rgba(124, 58, 237, 0.05)',
},
  },
},

Divider: {
  styles: {
root: {
  borderTopColor: '#e2e8f0',
},
  },
},

// Chat-specific table styling
Table: {
  styles: {
th: {
  backgroundColor: '#f1f5f9',
  color: '#334155',
  fontSize: rem(13),
  fontWeight: 700,
  textTransform: 'uppercase',
  letterSpacing: '0.5px',
  padding: `${rem(16)} ${rem(20)}`,
  borderBottom: '2px solid #e2e8f0',
},
td: {
  padding: `${rem(14)} ${rem(20)}`,
  fontSize: rem(15),
  color: '#475569',
  borderBottom: '1px solid #e2e8f0',
},
  },
},

// Notification-style alerts
Alert: {
  styles: {
root: {
  borderRadius: rem(12),
  border: '1px solid',
  fontFamily: '"Inter", sans-serif',
},
  },
},
  },

  // Chat-optimized breakpoints
  breakpoints: {
xs: '30em', // Mobile chat
sm: '48em', // Tablet chat
md: '64em', // Desktop chat
lg: '80em', // Large screens
xl: '96em', // Extra large
  },
});
