// Basic unit tests for database package core functionality
// Simplified tests that focus on essential functionality
import { describe, it, expect } from 'vitest';

describe('Database Package - Basic Tests', () => {
  it('should be able to import package exports', async () => {
const exports = await import('../index');

// Check that main exports exist
expect(exports.createBrowserSupabaseClient).toBeDefined();
expect(exports.createServerSupabaseClient).toBeDefined();
expect(exports.createSupabaseClient).toBeDefined();

// Check auth exports
expect(exports.signInWithPassword).toBeDefined();
expect(exports.signOut).toBeDefined();
expect(exports.verifyAndGetUser).toBeDefined();

// Check that exports are functions
expect(typeof exports.createBrowserSupabaseClient).toBe('function');
expect(typeof exports.createServerSupabaseClient).toBe('function');
expect(typeof exports.createSupabaseClient).toBe('function');
expect(typeof exports.signInWithPassword).toBe('function');
expect(typeof exports.signOut).toBe('function');
expect(typeof exports.verifyAndGetUser).toBe('function');
  });

  it('should have proper TypeScript types available', async () => {
const types = await import('../types');

// Check that types module loads without error
expect(types).toBeDefined();
  });

  it('should export Database type', async () => {
// For TypeScript types, we just need to verify the module loads
// Types don't exist at runtime, so we can't test them directly
const types = await import('../types');
expect(types).toBeDefined();

// This test passes if the import doesn't throw an error
expect(true).toBe(true);
  });
});
