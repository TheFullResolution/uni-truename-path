'use client';

import { createTheme, rem, MantineThemeOverride } from '@mantine/core';

export const theme: MantineThemeOverride = createTheme({
  // Primary brand color scheme matching TrueNamePath logo
  primaryColor: 'brand',
  colors: {
// Brand blue palette extracted from logo
brand: [
  '#E8F4FE', // Lightest - backgrounds
  '#C3D9F7', // Light - hover states
  '#9CBDE4', // Light-medium - subtle accents
  '#74A1D7', // Medium - secondary elements
  '#4D85CA', // Medium-dark - interactive elements
  '#4A7FE7', // Primary - main brand color from logo
  '#3366CC', // Dark - hover states, emphasis
  '#2952A3', // Darker - pressed states
  '#1F3F7A', // Very dark - text on light backgrounds
  '#152B52', // Darkest - high contrast text
],
blue: [
  '#e8f4fd',
  '#c3d9f1',
  '#9cbde4',
  '#74a1d7',
  '#4d85ca',
  '#3498db', // Standard blue color
  '#2980b9',
  '#206694',
  '#1a5490',
  '#14406b',
],
green: [
  '#e8f5e9',
  '#c8e6c9',
  '#a5d6a7',
  '#81c784',
  '#66bb6a',
  '#27ae60', // Signup green from wireframe
  '#2e7d32',
  '#1b5e20',
  '#0d5016',
  '#0a4012',
],
gray: [
  '#f8f9fa', // Background color from wireframe
  '#e9ecef', // Light gray for demo buttons
  '#dee2e6', // Border color
  '#ced4da', // Input border color
  '#adb5bd',
  '#6c757d', // Secondary text and buttons
  '#495057', // Heading color
  '#343a40',
  '#2c3e50', // Main heading color from wireframe
  '#1a1e21',
],
  },

  // Enhanced typography for professional branding
  fontFamily:
'Inter, -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif',
  headings: {
fontFamily:
  'Inter, -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif',
fontWeight: '600',
  },

  // Spacing for form layouts
  spacing: {
xs: rem(8),
sm: rem(12),
md: rem(20),
lg: rem(30),
xl: rem(40),
  },

  // Border radius matching wireframe
  radius: {
xs: rem(2),
sm: rem(4), // Matching wireframe button radius
md: rem(8), // Matching wireframe container radius
lg: rem(12),
xl: rem(16),
  },

  // Breakpoints for responsive design
  breakpoints: {
xs: '36em',
sm: '48em',
md: '62em',
lg: '75em',
xl: '88em',
  },

  // Component-specific theme overrides
  components: {
Container: {
  defaultProps: {
size: 'lg', // Matches max-width: 1200px from wireframe
  },
},

TextInput: {
  styles: {
input: {
  // Enhanced input styling with theme colors
  // Let Mantine handle padding to respect leftSection/rightSection
  fontSize: rem(14),
},
label: {
  fontWeight: 500,
  marginBottom: rem(5),
},
  },
},

PasswordInput: {
  styles: {
input: {
  // Same as TextInput for consistency
  // Let Mantine handle padding to respect leftSection/rightSection
  fontSize: rem(14),
},
label: {
  fontWeight: 500,
  marginBottom: rem(5),
},
  },
},

Button: {
  defaultProps: {
size: 'md',
  },
  styles: {
root: {
  fontWeight: 500,
  transition: 'all 0.2s ease',
},
  },
},

// Let Mantine handle Card styling with built-in variants

// Let Mantine handle Title with theme colors

// Let Mantine handle Text with built-in variants

// Let Mantine handle Divider with theme colors

Checkbox: {
  styles: {
label: {
  fontSize: rem(14),
  cursor: 'pointer',
  lineHeight: 1.4,
},
input: {
  cursor: 'pointer',
},
  },
},
  },
});
