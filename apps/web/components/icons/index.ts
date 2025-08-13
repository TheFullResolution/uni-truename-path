// Professional icon exports for TrueNamePath
// All icons sourced from @tabler/icons-react for consistency
// Import icons individually to maintain tree-shaking benefits

// Core application icons
export {
  IconUser,
  IconLogin,
  IconLogout,
  IconTarget,
  IconShieldCheck,
  IconAlertTriangle,
  IconAlertCircle,
  IconCheck,
  IconX,
  IconSettings,
} from '@tabler/icons-react';

// Business & Enterprise icons
export {
  IconApi,
  IconBuilding,
  IconRocket,
  IconCode,
  IconBrandGithub,
} from '@tabler/icons-react';

// Standard icon sizes for consistent usage
export const ICON_SIZES = {
  xs: 12,
  sm: 16,
  md: 20,
  lg: 24,
  xl: 28,
} as const;

// Standard brand colors for icons
export const ICON_COLORS = {
  brand: '#4A7FE7',
  success: '#27AE60',
  warning: '#F39C12',
  error: '#E74C3C',
  neutral: '#6C757D',
  dark: '#2C3E50',
  github: '#333',
} as const;

// Standard spacing patterns for icons
export const ICON_SPACING = {
  inline: 'xs', // For icon-text pairs
  group: 'sm', // For icon-title groups
  section: 'md', // For section headers
} as const;
