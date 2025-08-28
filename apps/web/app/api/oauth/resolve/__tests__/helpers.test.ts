/**
 * Comprehensive Unit Tests for OAuth Resolve Helper Functions
 *
 * Tests for helpers.ts - Performance tracking utilities
 * Complete test suite validating performance measurement helper
 * Academic project - Step 16 OAuth integration testing
 * Note: Database triggers now handle all OAuth usage logging automatically
 */

import { beforeEach, describe, expect, it, vi } from 'vitest';
import { measurePerformance } from '../helpers';

// Mock performance.now() for consistent testing
const mockPerformanceNow = vi.fn();
vi.stubGlobal('performance', {
  now: mockPerformanceNow,
});

describe('OAuth Resolve Helper Functions', () => {
  beforeEach(() => {
vi.clearAllMocks();
  });

  describe('Performance Measurement', () => {
it('should create performance measurement tracker', () => {
  mockPerformanceNow.mockReturnValue(1000);

  const result = measurePerformance();

  expect(result).toHaveProperty('startTime');
  expect(result).toHaveProperty('getElapsed');
  expect(typeof result.getElapsed).toBe('function');
  expect(result.startTime).toBe(1000);
});

it('should calculate elapsed time correctly', () => {
  mockPerformanceNow
.mockReturnValueOnce(1000) // Start time
.mockReturnValueOnce(1002.4567); // End time

  const perf = measurePerformance();
  const elapsed = perf.getElapsed();

  expect(elapsed).toBe(2); // Math.round(1002.4567 - 1000)
});

it('should handle zero elapsed time', () => {
  mockPerformanceNow.mockReturnValue(1000);

  const perf = measurePerformance();
  const elapsed = perf.getElapsed();

  expect(elapsed).toBe(0);
});

it('should round elapsed time to nearest integer', () => {
  mockPerformanceNow.mockReturnValueOnce(1000).mockReturnValueOnce(1001.7);

  const perf = measurePerformance();
  const elapsed = perf.getElapsed();

  expect(elapsed).toBe(2); // Math.round(1.7) = 2
});

it('should handle large elapsed times', () => {
  mockPerformanceNow.mockReturnValueOnce(1000).mockReturnValueOnce(10000.3);

  const perf = measurePerformance();
  const elapsed = perf.getElapsed();

  expect(elapsed).toBe(9000); // Math.round(9000.3)
});

it('should create independent measurement instances', () => {
  mockPerformanceNow
.mockReturnValueOnce(1000) // First instance
.mockReturnValueOnce(2000) // Second instance
.mockReturnValueOnce(1005) // First instance getElapsed
.mockReturnValueOnce(2010); // Second instance getElapsed

  const perf1 = measurePerformance();
  const perf2 = measurePerformance();

  const elapsed1 = perf1.getElapsed();
  const elapsed2 = perf2.getElapsed();

  expect(elapsed1).toBe(5); // Math.round(1005 - 1000)
  expect(elapsed2).toBe(10); // Math.round(2010 - 2000)
});
  });
});
