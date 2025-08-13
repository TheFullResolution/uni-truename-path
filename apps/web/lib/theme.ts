'use client';

import { createTheme, rem, MantineThemeOverride, MantineTheme } from '@mantine/core';

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
  '#3498db', // Keep legacy blue for backward compatibility
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
  fontFamily: 'Inter, -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif',
  headings: {
fontFamily: 'Inter, -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif',
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
  // Enhanced input styling with brand colors
  padding: rem(12),
  fontSize: rem(14),
  border: '1px solid #ced4da',
  borderRadius: rem(6),
  transition: 'border-color 0.2s ease, box-shadow 0.2s ease',
  '&:focus': {
borderColor: '#4A7FE7',
outline: 'none',
boxShadow: `0 0 0 2px rgba(74, 127, 231, 0.2)`,
  },
},
label: {
  fontWeight: 500,
  marginBottom: rem(5),
  color: '#2c3e50',
},
  },
},

PasswordInput: {
  styles: {
input: {
  // Same as TextInput for consistency
  padding: rem(12),
  fontSize: rem(14),
  border: '1px solid #ced4da',
  borderRadius: rem(6),
  transition: 'border-color 0.2s ease, box-shadow 0.2s ease',
  '&:focus': {
borderColor: '#4A7FE7',
outline: 'none',
boxShadow: `0 0 0 2px rgba(74, 127, 231, 0.2)`,
  },
},
label: {
  fontWeight: 500,
  marginBottom: rem(5),
  color: '#2c3e50',
},
  },
},

Button: {
  styles: (theme: MantineTheme, props: { variant?: string; color?: string }) => ({
root: {
  // Enhanced button styling with brand colors
  padding: `${rem(12)} ${rem(24)}`,
  fontSize: rem(14),
  borderRadius: rem(6),
  fontWeight: 500,
  cursor: 'pointer',
  transition: 'all 0.2s ease',
  // Variant-specific styles with brand colors
  ...(props.variant === 'filled' && {
backgroundColor: props.color === 'brand' ? '#4A7FE7' : props.color === 'blue' ? '#3498db' : props.color === 'green' ? '#27ae60' : theme.colors.gray[6],
color: 'white',
border: 'none',
'&:hover': {
  backgroundColor: props.color === 'brand' ? '#3366CC' : props.color === 'blue' ? '#2980b9' : props.color === 'green' ? '#229954' : theme.colors.gray[7],
  transform: 'translateY(-1px)',
  boxShadow: '0 4px 12px rgba(74, 127, 231, 0.3)',
},
  }),
  ...(props.variant === 'light' && {
backgroundColor: 'rgba(74, 127, 231, 0.1)',
color: '#4A7FE7',
border: 'none',
'&:hover': {
  backgroundColor: 'rgba(74, 127, 231, 0.2)',
},
  }),
  ...(props.variant === 'outline' && {
backgroundColor: 'transparent',
border: `1px solid ${props.color === 'brand' ? '#4A7FE7' : props.color === 'blue' ? '#3498db' : props.color === 'green' ? '#27ae60' : theme.colors.gray[4]}`,
color: props.color === 'brand' ? '#4A7FE7' : props.color === 'blue' ? '#3498db' : props.color === 'green' ? '#27ae60' : theme.colors.gray[6],
'&:hover': {
  backgroundColor: props.color === 'brand' ? 'rgba(74, 127, 231, 0.1)' : props.color === 'blue' ? 'rgba(52, 152, 219, 0.1)' : props.color === 'green' ? 'rgba(39, 174, 96, 0.1)' : theme.colors.gray[0],
},
  }),
},
  }),
},

Card: {
  styles: {
root: {
  // Enhanced card styling with subtle brand accents
  backgroundColor: 'white',
  borderRadius: rem(8),
  boxShadow: '0 2px 10px rgba(0, 0, 0, 0.08)',
  border: '1px solid rgba(74, 127, 231, 0.08)',
  transition: 'all 0.2s ease',
  '&:hover': {
boxShadow: '0 4px 20px rgba(74, 127, 231, 0.15)',
transform: 'translateY(-2px)',
  },
},
  },
},

Title: {
  styles: {
root: {
  color: '#2c3e50',
  fontWeight: 600,
},
  },
},

Text: {
  styles: (theme: MantineTheme, props: { variant?: string }) => ({
root: {
  color: '#495057',
  lineHeight: 1.5,
  // Variant-specific styles
  ...(props.variant === 'subtitle' && {
color: '#6c757d',
fontSize: rem(16),
fontWeight: 400,
  }),
  ...(props.variant === 'dimmed' && {
color: '#6c757d',
fontSize: rem(14),
  }),
},
  }),
},

Divider: {
  styles: {
root: {
  borderColor: '#dee2e6',
},
  },
},

Checkbox: {
  styles: {
label: {
  fontSize: rem(14),
  color: '#495057',
  cursor: 'pointer',
  lineHeight: 1.4,
},
input: {
  cursor: 'pointer',
  '&:checked': {
backgroundColor: '#4A7FE7',
borderColor: '#4A7FE7',
  },
},
  },
},
  },
});