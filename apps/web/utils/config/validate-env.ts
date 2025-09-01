#!/usr/bin/env node

/**
 * Build-time Environment Variable Validation Script
 *
 * This script validates that all required environment variables are properly
 * configured before the application starts or builds. It can be run manually
 * or integrated into the build process.
 *
 * Usage:
 *   node utils/config/validate-env.ts
 *   npx tsx utils/config/validate-env.ts
 */

import { validateDemoAppConfigDetailed } from './demo-apps';

/**
 * Main validation function that checks all environment configuration
 */
async function validateEnvironment(): Promise<void> {
  console.log('🔍 Validating environment configuration...\n');

  try {
// Validate demo app configuration
console.log('📱 Checking demo app configuration...');
const demoValidation = validateDemoAppConfigDetailed();

if (demoValidation.isValid) {
  console.log('✅ Demo app URLs are valid');

  // Show warnings if any
  if (demoValidation.warnings.length > 0) {
console.log('⚠️  Warnings:');
demoValidation.warnings.forEach((warning) => {
  console.log(`   - ${warning}`);
});
  }
} else {
  console.log('❌ Demo app configuration errors:');
  demoValidation.errors.forEach((error) => {
console.log(`   - ${error}`);
  });
  throw new Error('Demo app configuration validation failed');
}

// Additional environment validations can be added here
// For example: Supabase configuration, API keys, etc.

console.log('\n✅ All environment validations passed!');
  } catch (error) {
console.error('\n❌ Environment validation failed:');
console.error(error instanceof Error ? error.message : String(error));
console.error(
  '\n📖 Please check your .env.local file or use the defaults from .env.example\n',
);
process.exit(1);
  }
}

/**
 * Run validation when script is executed directly
 */
if (import.meta.url === `file://${process.argv[1]}`) {
  validateEnvironment().catch((error) => {
console.error('Unexpected error:', error);
process.exit(1);
  });
}

export { validateEnvironment };
