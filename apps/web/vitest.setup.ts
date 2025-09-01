// Vitest setup for TrueNamePath Context Engine testing
// Date: August 11, 2025

import { vi, beforeEach, afterEach } from 'vitest';
import '@testing-library/jest-dom';

// Mock NextRequest before any other imports to ensure it's available
class MockNextRequest {
  private _url: string;
  method: string;
  headers: Headers;
  body?: string;
  nextUrl: URL;

  constructor(url: string, options: any = {}) {
this._url = url;
this.method = options.method || 'GET';
this.headers = new Headers(options.headers || {});
this.body = options.body;
this.nextUrl = new URL(url);

// Define read-only url property using getter
Object.defineProperty(this, 'url', {
  get: () => this._url,
  enumerable: true,
  configurable: false,
});
  }

  async json() {
return JSON.parse(this.body || '{}');
  }

  async text() {
return this.body || '';
  }

  clone() {
const headersObj: Record<string, string> = {};
this.headers.forEach((value, key) => {
  headersObj[key] = value;
});

return new MockNextRequest(this._url, {
  method: this.method,
  headers: headersObj,
  body: this.body,
});
  }
}

// Mock the entire next/server module at the top level
vi.mock('next/server', async () => {
  const actual = await vi.importActual('next/server');
  return {
...actual,
NextRequest: MockNextRequest,
  };
});

// Mock environment variables for testing
process.env.NEXT_PUBLIC_SUPABASE_URL =
  process.env.NEXT_PUBLIC_SUPABASE_URL || 'http://localhost:54321';
process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY =
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || 'test-anon-key';
process.env.SUPABASE_SERVICE_ROLE_KEY =
  process.env.SUPABASE_SERVICE_ROLE_KEY || 'test-service-key';

// Demo application environment variables for testing
process.env.NEXT_PUBLIC_DEMO_HR_URL =
  process.env.NEXT_PUBLIC_DEMO_HR_URL || 'https://demo-hr-truename.vercel.app';
process.env.NEXT_PUBLIC_DEMO_CHAT_URL =
  process.env.NEXT_PUBLIC_DEMO_CHAT_URL ||
  'https://demo-chat-truename.vercel.app';

// Mock performance.now() for consistent testing
const mockPerformanceNow = vi.fn();
let performanceCounter = 0;

mockPerformanceNow.mockImplementation(() => {
  performanceCounter += 1.5; // Simulate 1.5ms increments
  return performanceCounter;
});

// Set up global performance mock
if (typeof global.performance === 'undefined') {
  global.performance = { now: mockPerformanceNow };
} else {
  vi.spyOn(global.performance, 'now').mockImplementation(mockPerformanceNow);
}

// Mock window.matchMedia for Mantine components
Object.defineProperty(window, 'matchMedia', {
  writable: true,
  value: vi.fn().mockImplementation((query) => ({
matches: false,
media: query,
onchange: null,
addListener: vi.fn(), // deprecated
removeListener: vi.fn(), // deprecated
addEventListener: vi.fn(),
removeEventListener: vi.fn(),
dispatchEvent: vi.fn(),
  })),
});

// Mock window.getComputedStyle for Mantine components
Object.defineProperty(window, 'getComputedStyle', {
  writable: true,
  value: vi.fn().mockImplementation(() => ({
getPropertyValue: vi.fn().mockReturnValue(''),
  })),
});

// Reset performance counter before each test
beforeEach(() => {
  performanceCounter = 0;
  mockPerformanceNow.mockClear();
});

// Suppress console output during tests (except errors)
global.console = {
  ...console,
  log: vi.fn(),
  info: vi.fn(),
  warn: vi.fn(),
  debug: vi.fn(),
  // Keep error logging for debugging
  error: console.error,
};

// Mock Next.js request handling with getter-only URL
global.Request = class MockRequest {
  private _url: string;
  method: string;
  headers: Map<string, string>;
  body?: string;

  constructor(url: string, options: any = {}) {
this._url = url;
this.method = options.method || 'GET';
this.headers = new Map(Object.entries(options.headers || {}));
this.body = options.body;

// Define read-only url property using getter
Object.defineProperty(this, 'url', {
  get: () => this._url,
  enumerable: true,
  configurable: false,
});
  }

  async json() {
return JSON.parse(this.body || '{}');
  }
};

global.Response = class MockResponse {
  body: string;
  status: number;
  headers: Map<string, string>;

  constructor(body: string, options: any = {}) {
this.body = body;
this.status = options.status || 200;
this.headers = new Map(Object.entries(options.headers || {}));
  }

  static json(data: any, options: any = {}) {
return new MockResponse(JSON.stringify(data), {
  ...options,
  headers: {
'Content-Type': 'application/json',
...(options.headers || {}),
  },
});
  }

  async json() {
return JSON.parse(this.body);
  }
};

// Setup and cleanup helpers
global.testHelpers = {
  resetMocks: () => {
vi.clearAllMocks();
performanceCounter = 0;
  },

  mockDate: (isoString: string) => {
vi.spyOn(global.Date, 'now').mockImplementation(() =>
  new Date(isoString).getTime(),
);
vi.spyOn(global, 'Date').mockImplementation(() => new Date(isoString));
  },

  restoreDate: () => {
vi.restoreAllMocks();
  },
};

// Global test cleanup
afterEach(() => {
  global.testHelpers.restoreDate();
});

// TypeScript declarations for global test helpers
declare global {
  var testHelpers: {
resetMocks: () => void;
mockDate: (isoString: string) => void;
restoreDate: () => void;
  };
}
