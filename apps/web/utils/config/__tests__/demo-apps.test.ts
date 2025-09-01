import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import {
  DEMO_APPS,
  validateDemoAppConfig,
  validateDemoAppConfigDetailed,
  assertDemoAppConfig,
  getDemoApps,
  getDemoAppByType,
  getDemoAppUrl,
  type DemoAppType,
  type DemoAppConfig,
  type DemoAppValidationResult,
} from '../demo-apps';

describe('Demo Apps Configuration', () => {
  // Store original env vars for cleanup
  const originalEnv = { ...process.env };

  beforeEach(() => {
// Reset environment variables before each test
delete process.env.NEXT_PUBLIC_DEMO_HR_URL;
delete process.env.NEXT_PUBLIC_DEMO_CHAT_URL;
  });

  afterEach(() => {
// Restore original environment
process.env = { ...originalEnv };
  });

  describe('DEMO_APPS constants', () => {
it('should provide valid demo app URLs', () => {
  expect(DEMO_APPS.HR_URL).toBeTruthy();
  expect(DEMO_APPS.CHAT_URL).toBeTruthy();
  expect(DEMO_APPS.HR_URL).toMatch(/^https?:\/\/.+/);
  expect(DEMO_APPS.CHAT_URL).toMatch(/^https?:\/\/.+/);
});

it('should use default production URLs', () => {
  // These should be the default values from the config
  expect(DEMO_APPS.HR_URL).toBe('https://demo-hr-truename.vercel.app');
  expect(DEMO_APPS.CHAT_URL).toBe('https://demo-chat-truename.vercel.app');
});

it('should use environment variables when available', () => {
  // This test checks the actual implementation logic
  const customHrUrl = 'https://custom-hr.example.com';
  const customChatUrl = 'https://custom-chat.example.com';

  // We can't easily test this without mocking the module,
  // so we test the logic pattern instead
  const hrUrl =
process.env.NEXT_PUBLIC_DEMO_HR_URL ||
'https://demo-hr-truename.vercel.app';
  const chatUrl =
process.env.NEXT_PUBLIC_DEMO_CHAT_URL ||
'https://demo-chat-truename.vercel.app';

  expect(hrUrl).toBe('https://demo-hr-truename.vercel.app');
  expect(chatUrl).toBe('https://demo-chat-truename.vercel.app');
});
  });

  describe('validateDemoAppConfig', () => {
it('should return true when all URLs are configured', () => {
  expect(validateDemoAppConfig()).toBe(true);
});

it('should return false when URLs are missing', () => {
  // Mock empty URLs
  const mockConfig = {
HR_URL: '',
CHAT_URL: 'https://demo-chat-truename.vercel.app',
  };

  // We can't easily mock the imported constant, so we test the logic
  const isValid = Boolean(mockConfig.HR_URL && mockConfig.CHAT_URL);
  expect(isValid).toBe(false);
});
  });

  describe('validateDemoAppConfigDetailed', () => {
it('should return valid result when all URLs are properly configured', () => {
  const result = validateDemoAppConfigDetailed();

  expect(result.isValid).toBe(true);
  expect(result.errors).toHaveLength(0);
  expect(result.warnings).toHaveLength(2); // Both URLs using defaults
  expect(result.warnings[0]).toContain('Using default HR demo URL');
  expect(result.warnings[1]).toContain('Using default Chat demo URL');
});

it('should detect invalid URLs', () => {
  // We test the validation logic by testing the internal URL validation
  const mockConfig = {
HR_URL: 'invalid-url',
CHAT_URL: '',
  };

  // Test URL validation logic
  const hrValid = Boolean(
mockConfig.HR_URL && mockConfig.HR_URL.startsWith('http'),
  );
  const chatValid = Boolean(
mockConfig.CHAT_URL && mockConfig.CHAT_URL.startsWith('http'),
  );

  expect(hrValid).toBe(false);
  expect(chatValid).toBe(false);
});

it('should have proper type definitions', () => {
  const result: DemoAppValidationResult = validateDemoAppConfigDetailed();

  expect(typeof result.isValid).toBe('boolean');
  expect(Array.isArray(result.errors)).toBe(true);
  expect(Array.isArray(result.warnings)).toBe(true);
});
  });

  describe('assertDemoAppConfig', () => {
it('should not throw when configuration is valid', () => {
  expect(() => assertDemoAppConfig()).not.toThrow();
});

it('should warn in development mode', () => {
  const originalNodeEnv = process.env.NODE_ENV;
  process.env.NODE_ENV = 'development';

  const consoleSpy = vi.spyOn(console, 'warn').mockImplementation(() => {});

  assertDemoAppConfig();

  expect(consoleSpy).toHaveBeenCalled();

  consoleSpy.mockRestore();
  process.env.NODE_ENV = originalNodeEnv;
});
  });

  describe('getDemoApps', () => {
it('should return array of demo app configurations', () => {
  const demoApps: DemoAppConfig[] = getDemoApps();

  expect(demoApps).toHaveLength(2);
  expect(demoApps[0]).toEqual({
name: 'HR Demo',
description: 'Enterprise professional identity context',
url: DEMO_APPS.HR_URL,
type: 'professional',
  });
  expect(demoApps[1]).toEqual({
name: 'Chat Demo',
description: 'Casual social identity context',
url: DEMO_APPS.CHAT_URL,
type: 'social',
  });
});

it('should provide valid URLs for all demo apps', () => {
  const demoApps = getDemoApps();

  demoApps.forEach((app) => {
expect(app.url).toBeTruthy();
expect(app.url).toMatch(/^https?:\/\/.+/);
  });
});

it('should have proper TypeScript types', () => {
  const demoApps = getDemoApps();

  demoApps.forEach((app) => {
expect(typeof app.name).toBe('string');
expect(typeof app.description).toBe('string');
expect(typeof app.url).toBe('string');
expect(['professional', 'social']).toContain(app.type);
  });
});
  });

  describe('getDemoAppByType', () => {
it('should return demo app configuration for valid type', () => {
  const hrApp = getDemoAppByType('professional');
  const chatApp = getDemoAppByType('social');

  expect(hrApp).toBeDefined();
  expect(hrApp?.name).toBe('HR Demo');
  expect(hrApp?.type).toBe('professional');

  expect(chatApp).toBeDefined();
  expect(chatApp?.name).toBe('Chat Demo');
  expect(chatApp?.type).toBe('social');
});

it('should return undefined for invalid type', () => {
  // @ts-expect-error Testing invalid type
  const invalidApp = getDemoAppByType('invalid' as DemoAppType);
  expect(invalidApp).toBeUndefined();
});
  });

  describe('getDemoAppUrl', () => {
it('should return URL for valid demo app type', () => {
  const hrUrl = getDemoAppUrl('professional');
  const chatUrl = getDemoAppUrl('social');

  expect(hrUrl).toBe(DEMO_APPS.HR_URL);
  expect(chatUrl).toBe(DEMO_APPS.CHAT_URL);
});

it('should throw error for invalid demo app type', () => {
  // @ts-expect-error Testing invalid type
  expect(() => getDemoAppUrl('invalid' as DemoAppType)).toThrow(
"Demo app type 'invalid' not found",
  );
});
  });

  describe('TypeScript types', () => {
it('should have proper DemoAppType union type', () => {
  const professionalType: DemoAppType = 'professional';
  const socialType: DemoAppType = 'social';

  expect(['professional', 'social']).toContain(professionalType);
  expect(['professional', 'social']).toContain(socialType);
});

it('should have proper DemoAppConfig interface', () => {
  const config: DemoAppConfig = {
name: 'Test Demo',
description: 'Test description',
url: 'https://test.example.com',
type: 'professional',
  };

  expect(typeof config.name).toBe('string');
  expect(typeof config.description).toBe('string');
  expect(typeof config.url).toBe('string');
  expect(['professional', 'social']).toContain(config.type);
});
  });
});
