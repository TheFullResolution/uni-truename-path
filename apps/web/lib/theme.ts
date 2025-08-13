'use client';

import { createTheme, rem, MantineThemeOverride, MantineTheme } from '@mantine/core';

export const theme: MantineThemeOverride = createTheme({
  // Primary color scheme matching wireframe - #3498db for login, #27ae60 for signup
  primaryColor: 'blue',
  colors: {
blue: [
  '#e8f4fd',
  '#c3d9f1',
  '#9cbde4',
  '#74a1d7',
  '#4d85ca',
  '#3498db', // Primary blue from wireframe
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

  // Font family matching wireframe
  fontFamily: '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif',
  
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
  // Matching wireframe input styling
  padding: rem(12),
  fontSize: rem(14),
  border: '1px solid #ced4da',
  borderRadius: rem(4),
  '&:focus': {
borderColor: '#3498db',
outline: 'none',
boxShadow: `0 0 0 2px rgba(52, 152, 219, 0.2)`,
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
  borderRadius: rem(4),
  '&:focus': {
borderColor: '#3498db',
outline: 'none',
boxShadow: `0 0 0 2px rgba(52, 152, 219, 0.2)`,
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
  // Matching wireframe button styling
  padding: `${rem(12)} ${rem(24)}`,
  fontSize: rem(14),
  borderRadius: rem(4),
  fontWeight: 500,
  cursor: 'pointer',
  // Variant-specific styles
  ...(props.variant === 'filled' && {
backgroundColor: props.color === 'blue' ? '#3498db' : props.color === 'green' ? '#27ae60' : theme.colors.gray[6],
color: 'white',
'&:hover': {
  backgroundColor: props.color === 'blue' ? '#2980b9' : props.color === 'green' ? '#229954' : theme.colors.gray[7],
},
  }),
  ...(props.variant === 'light' && {
backgroundColor: '#6c757d',
color: 'white',
'&:hover': {
  backgroundColor: theme.colors.gray[7],
},
  }),
  ...(props.variant === 'outline' && {
backgroundColor: 'transparent',
border: `1px solid ${props.color === 'blue' ? '#3498db' : props.color === 'green' ? '#27ae60' : theme.colors.gray[4]}`,
color: props.color === 'blue' ? '#3498db' : props.color === 'green' ? '#27ae60' : theme.colors.gray[6],
'&:hover': {
  backgroundColor: props.color === 'blue' ? 'rgba(52, 152, 219, 0.1)' : props.color === 'green' ? 'rgba(39, 174, 96, 0.1)' : theme.colors.gray[0],
},
  }),
},
  }),
},

Card: {
  styles: {
root: {
  // Matching wireframe container styling
  backgroundColor: 'white',
  borderRadius: rem(8),
  boxShadow: '0 2px 10px rgba(0, 0, 0, 0.1)',
  border: 'none',
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
backgroundColor: '#3498db',
borderColor: '#3498db',
  },
},
  },
},
  },
});