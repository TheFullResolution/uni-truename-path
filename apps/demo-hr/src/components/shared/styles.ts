/**
 * Shared Styles Constants - Eliminates Duplicate Inline Styles
 * Academic constraint: Keep simple and focused
 */

export const paperStyles = {
  p: 'xl' as const,
  radius: 'sm' as const,
  withBorder: true,
  shadow: 'sm' as const,
  bg: 'white' as const,
};

export const cardStyles = {
  textAlign: 'center' as const,
  width: '100%',
  maxWidth: '400px',
};

export const buttonStyles = {
  root: {
fontSize: '16px',
fontWeight: 500,
height: '48px',
  },
};

// Enhanced employee field configuration for complete OIDC claims display
export const employeeFields = [
  {
label: 'Display Name',
key: 'name' as const,
size: 'lg' as const,
category: 'profile',
  },
  {
label: 'First Name',
key: 'given_name' as const,
size: 'md' as const,
category: 'profile',
  },
  {
label: 'Last Name',
key: 'family_name' as const,
size: 'md' as const,
category: 'profile',
  },
  {
label: 'Nickname',
key: 'nickname' as const,
size: 'md' as const,
category: 'profile',
  },
  {
label: 'System Username',
key: 'preferred_username' as const,
size: 'md' as const,
mono: true,
category: 'profile',
  },
  {
label: 'Employee ID',
key: 'sub' as const,
size: 'sm' as const,
mono: true,
category: 'auth',
  },
];

export const authenticationFields = [
  {
label: 'Identity Provider',
key: 'iss' as const,
size: 'sm' as const,
mono: true,
  },
  { label: 'Audience', key: 'aud' as const, size: 'sm' as const, mono: true },
  {
label: 'Authentication Time',
key: 'iat' as const,
size: 'sm' as const,
mono: true,
isDate: true,
  },
];

export const contextFields = [
  {
label: 'Active Context',
key: 'context_name' as const,
size: 'md' as const,
  },
  {
label: 'Connected Application',
key: 'app_name' as const,
size: 'md' as const,
  },
];
