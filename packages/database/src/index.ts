// Database types and utilities
export * from './types';
export * from './client';
export * from './auth';

// Convenience exports for common use cases
export { createBrowserSupabaseClient as supabase } from './client';
