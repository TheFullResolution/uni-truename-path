// Dashboard components barrel export
// Re-export all card and panel components from their respective barrel exports

// Card components
export {
  WelcomeCard,
  PrivacyScoreCard,
  APIUsageCard,
  NameVariantsCard,
  RecentActivityCard,
} from './cards';

// Panel components
export { SettingsPanel } from './panels';

// Main dashboard components
export { DashboardContent } from './DashboardContent';
export { DashboardTabs } from './DashboardTabs';
export { DashboardSkeleton } from './DashboardSkeleton';

// Performance components
export { SWRErrorBoundary } from './SWRErrorBoundary';

// Skeleton components
export * from './skeletons';
