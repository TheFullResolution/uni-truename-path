#!/usr/bin/env tsx
/**
 * Performance Monitoring Script for TrueNamePath
 *
 * This script performs controlled performance testing against the production deployment
 * without violating Vercel's load testing policies. It makes sequential requests with
 * delays to measure real-world performance.
 *
 * Usage: npx tsx scripts/performance-monitor.ts [--production | --local]
 */

import { createClient } from '@supabase/supabase-js';

// Configuration
const ENVIRONMENTS = {
  production: {
url: 'https://www.truenamepath.com',
supabaseUrl: process.env.NEXT_PUBLIC_SUPABASE_URL || '',
supabaseAnonKey: process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || '',
  },
  local: {
url: 'http://localhost:3000',
supabaseUrl: 'http://localhost:54321',
supabaseAnonKey: process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || '',
  },
};

// Test configuration
const DELAY_BETWEEN_REQUESTS = 1000; // 1 second between requests
const REQUESTS_PER_ENDPOINT = 5; // Number of times to test each endpoint

// Performance thresholds (in ms)
const PERFORMANCE_THRESHOLDS = {
  excellent: 50,
  good: 200,
  acceptable: 500,
  slow: 1000,
};

interface EndpointTest {
  name: string;
  path: string;
  method: 'GET' | 'POST';
  requiresAuth: boolean;
  expectedResponseTime: number;
  body?: any;
}

interface TestResult {
  endpoint: string;
  measurements: number[];
  average: number;
  median: number;
  min: number;
  max: number;
  p95: number;
  status: 'excellent' | 'good' | 'acceptable' | 'slow' | 'failed';
  errors: string[];
}

class PerformanceMonitor {
  private baseUrl: string;
  private supabase: any;
  private authToken?: string;
  private results: TestResult[] = [];

  constructor(environment: 'production' | 'local') {
const config = ENVIRONMENTS[environment];
this.baseUrl = config.url;

if (config.supabaseUrl && config.supabaseAnonKey) {
  this.supabase = createClient(config.supabaseUrl, config.supabaseAnonKey);
}

console.log(
  `\n🚀 Performance Monitor - Testing ${environment} environment`,
);
console.log(`📍 Base URL: ${this.baseUrl}`);
console.log('━'.repeat(60));
  }

  /**
   * Authenticate to get a valid session for protected endpoints
   */
  async authenticate(email: string, password: string): Promise<boolean> {
if (!this.supabase) {
  console.log('⚠️  No Supabase client configured, skipping auth tests');
  return false;
}

try {
  const { data, error } = await this.supabase.auth.signInWithPassword({
email,
password,
  });

  if (error) {
console.error('❌ Authentication failed:', error.message);
return false;
  }

  this.authToken = data.session?.access_token;
  console.log('✅ Authentication successful');
  return true;
} catch (error) {
  console.error('❌ Authentication error:', error);
  return false;
}
  }

  /**
   * Test a single endpoint
   */
  async testEndpoint(test: EndpointTest): Promise<TestResult> {
console.log(`\n📊 Testing: ${test.name}`);
console.log(`   Path: ${test.path}`);
console.log(`   Expected: <${test.expectedResponseTime}ms`);

const measurements: number[] = [];
const errors: string[] = [];

for (let i = 0; i < REQUESTS_PER_ENDPOINT; i++) {
  try {
const headers: HeadersInit = {
  'Content-Type': 'application/json',
};

if (test.requiresAuth && this.authToken) {
  headers['Authorization'] = `Bearer ${this.authToken}`;
}

const startTime = performance.now();

const response = await fetch(`${this.baseUrl}${test.path}`, {
  method: test.method,
  headers,
  body: test.body ? JSON.stringify(test.body) : undefined,
});

const endTime = performance.now();
const responseTime = Math.round(endTime - startTime);

if (response.ok) {
  measurements.push(responseTime);
  process.stdout.write(`   ${i + 1}. ${responseTime}ms ✓\n`);
} else {
  errors.push(`Request ${i + 1}: HTTP ${response.status}`);
  process.stdout.write(`   ${i + 1}. HTTP ${response.status} ✗\n`);
}

// Delay between requests to avoid rate limiting
if (i < REQUESTS_PER_ENDPOINT - 1) {
  await this.delay(DELAY_BETWEEN_REQUESTS);
}
  } catch (error) {
errors.push(
  `Request ${i + 1}: ${error instanceof Error ? error.message : 'Unknown error'}`,
);
process.stdout.write(`   ${i + 1}. Error ✗\n`);
  }
}

// Calculate statistics
const result = this.calculateStatistics(test.name, measurements, errors);
this.results.push(result);

// Print summary
this.printEndpointSummary(result);

return result;
  }

  /**
   * Calculate statistics from measurements
   */
  private calculateStatistics(
endpoint: string,
measurements: number[],
errors: string[],
  ): TestResult {
if (measurements.length === 0) {
  return {
endpoint,
measurements: [],
average: 0,
median: 0,
min: 0,
max: 0,
p95: 0,
status: 'failed',
errors,
  };
}

const sorted = [...measurements].sort((a, b) => a - b);
const average = Math.round(
  measurements.reduce((a, b) => a + b, 0) / measurements.length,
);
const median = sorted[Math.floor(sorted.length / 2)];
const min = sorted[0];
const max = sorted[sorted.length - 1];
const p95Index = Math.floor(sorted.length * 0.95);
const p95 = sorted[p95Index] || max;

// Determine status based on average response time
let status: TestResult['status'];
if (average <= PERFORMANCE_THRESHOLDS.excellent) {
  status = 'excellent';
} else if (average <= PERFORMANCE_THRESHOLDS.good) {
  status = 'good';
} else if (average <= PERFORMANCE_THRESHOLDS.acceptable) {
  status = 'acceptable';
} else if (average <= PERFORMANCE_THRESHOLDS.slow) {
  status = 'slow';
} else {
  status = 'failed';
}

return {
  endpoint,
  measurements,
  average,
  median,
  min,
  max,
  p95,
  status,
  errors,
};
  }

  /**
   * Print summary for an endpoint
   */
  private printEndpointSummary(result: TestResult): void {
const statusEmoji = {
  excellent: '🟢',
  good: '🟡',
  acceptable: '🟠',
  slow: '🔴',
  failed: '❌',
};

console.log(
  `\n   ${statusEmoji[result.status]} Status: ${result.status.toUpperCase()}`,
);

if (result.measurements.length > 0) {
  console.log(`   📈 Average: ${result.average}ms`);
  console.log(`   📊 Median: ${result.median}ms`);
  console.log(`   ⚡ Min/Max: ${result.min}ms / ${result.max}ms`);
  console.log(`   🎯 P95: ${result.p95}ms`);
}

if (result.errors.length > 0) {
  console.log(`   ⚠️  Errors: ${result.errors.length}`);
}
  }

  /**
   * Query performance metrics from the database
   */
  async queryDatabaseMetrics(): Promise<void> {
if (!this.supabase) {
  console.log('\n⚠️  Skipping database metrics (no Supabase client)');
  return;
}

console.log('\n📊 Database Performance Metrics');
console.log('━'.repeat(60));

try {
  // Query average response times from app_usage_log
  const { data: metrics, error } = await this.supabase
.from('app_usage_log')
.select('action, response_time_ms')
.not('response_time_ms', 'is', null)
.gte(
  'created_at',
  new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString(),
); // Last 7 days

  if (error) {
console.error('❌ Failed to query database metrics:', error.message);
return;
  }

  if (metrics && metrics.length > 0) {
// Group by action and calculate averages
const actionMetrics: Record<string, number[]> = {};

metrics.forEach((m: any) => {
  if (!actionMetrics[m.action]) {
actionMetrics[m.action] = [];
  }
  actionMetrics[m.action].push(m.response_time_ms);
});

console.log('\n📈 Historical Performance (Last 7 Days):');
Object.entries(actionMetrics).forEach(([action, times]) => {
  const avg = Math.round(
times.reduce((a, b) => a + b, 0) / times.length,
  );
  const count = times.length;
  console.log(`   ${action}: ${avg}ms average (${count} operations)`);
});
  } else {
console.log('   No historical data available');
  }
} catch (error) {
  console.error('❌ Error querying metrics:', error);
}
  }

  /**
   * Generate and print final report
   */
  generateReport(): void {
console.log('\n');
console.log('═'.repeat(60));
console.log('📋 PERFORMANCE TEST REPORT');
console.log('═'.repeat(60));

// Overall statistics
const allMeasurements = this.results.flatMap((r) => r.measurements);
if (allMeasurements.length > 0) {
  const overallAverage = Math.round(
allMeasurements.reduce((a, b) => a + b, 0) / allMeasurements.length,
  );

  console.log('\n🎯 Overall Performance:');
  console.log(`   Total requests: ${allMeasurements.length}`);
  console.log(`   Average response time: ${overallAverage}ms`);

  // Performance grade
  let grade = 'A+';
  if (overallAverage > 50) grade = 'A';
  if (overallAverage > 100) grade = 'B';
  if (overallAverage > 200) grade = 'C';
  if (overallAverage > 500) grade = 'D';
  if (overallAverage > 1000) grade = 'F';

  console.log(`   Performance Grade: ${grade}`);
}

// Summary by endpoint
console.log('\n📊 Endpoint Summary:');
console.log('─'.repeat(60));
console.log(
  'Endpoint'.padEnd(30) + 'Avg'.padEnd(10) + 'P95'.padEnd(10) + 'Status',
);
console.log('─'.repeat(60));

this.results.forEach((result) => {
  if (result.measurements.length > 0) {
console.log(
  result.endpoint.padEnd(30) +
`${result.average}ms`.padEnd(10) +
`${result.p95}ms`.padEnd(10) +
result.status,
);
  } else {
console.log(
  result.endpoint.padEnd(30) +
'N/A'.padEnd(10) +
'N/A'.padEnd(10) +
'FAILED',
);
  }
});

// Recommendations
console.log('\n💡 Recommendations:');
const slowEndpoints = this.results.filter(
  (r) => r.status === 'slow' || r.status === 'failed',
);
if (slowEndpoints.length > 0) {
  console.log('   ⚠️  The following endpoints need optimization:');
  slowEndpoints.forEach((ep) => {
console.log(`  - ${ep.endpoint} (${ep.average}ms average)`);
  });
} else {
  console.log(
'   ✅ All endpoints are performing within acceptable limits',
  );
}

// Export data
const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
const reportFile = `performance-report-${timestamp}.json`;

console.log(`\n📁 Full report saved to: ${reportFile}`);

// Save report to file using dynamic import for ESM compatibility
try {
  const { writeFileSync } = await import('fs');
  writeFileSync(
reportFile,
JSON.stringify(
  {
timestamp: new Date().toISOString(),
environment: this.baseUrl,
results: this.results,
summary: {
  totalRequests: allMeasurements.length,
  averageResponseTime:
allMeasurements.length > 0
  ? Math.round(
  allMeasurements.reduce((a, b) => a + b, 0) /
allMeasurements.length,
)
  : 0,
},
  },
  null,
  2,
),
  );
} catch (error) {
  console.log(
'   (Could not write file - running in restricted environment)',
  );
}
  }

  /**
   * Utility function for delays
   */
  private delay(ms: number): Promise<void> {
return new Promise((resolve) => setTimeout(resolve, ms));
  }

  /**
   * Check if the server is running
   */
  async checkServerAvailability(): Promise<boolean> {
try {
  // Try the home page as a connectivity check
  const response = await fetch(`${this.baseUrl}`, {
method: 'GET',
signal: AbortSignal.timeout(5000),
  });

  if (response.ok || response.status === 307) {
// 307 is redirect, which is fine
console.log('✅ Server is available\n');
return true;
  } else {
console.log(`⚠️  Server returned status ${response.status}\n`);
return false;
  }
} catch (error) {
  console.log(
'❌ Server is not available. Please ensure the server is running.\n',
  );
  if (this.baseUrl.includes('localhost')) {
console.log('   Run: yarn dev\n');
  }
  return false;
}
  }

  /**
   * Run the complete test suite
   */
  async run(): Promise<void> {
// Check server availability first
const isAvailable = await this.checkServerAvailability();
if (!isAvailable) {
  console.log('⚠️  Skipping performance tests - server not available\n');
  return;
}

// Define test endpoints
const endpoints: EndpointTest[] = [
  // Public pages (these should work in production)
  {
name: 'Home Page',
path: '/',
method: 'GET',
requiresAuth: false,
expectedResponseTime: 500,
  },
  {
name: 'Public Docs Page',
path: '/docs/overview',
method: 'GET',
requiresAuth: false,
expectedResponseTime: 500,
  },
  {
name: 'OAuth Authorization (OPTIONS)',
path: '/api/oauth/authorize',
method: 'GET', // Will return error but tests response time
requiresAuth: false,
expectedResponseTime: 100,
  },
  // If health check exists (will be in next deployment)
  {
name: 'Health Check API',
path: '/api/health',
method: 'GET',
requiresAuth: false,
expectedResponseTime: 50,
  },
  // Add authenticated endpoints if auth is available
];

// Run tests
for (const endpoint of endpoints) {
  await this.testEndpoint(endpoint);
  await this.delay(2000); // Longer delay between different endpoints
}

// Query database metrics
await this.queryDatabaseMetrics();

// Generate report
this.generateReport();

console.log('\n✅ Performance monitoring complete!\n');
  }
}

// Main execution
async function main() {
  const args = process.argv.slice(2);
  const environment = args.includes('--production') ? 'production' : 'local';

  const monitor = new PerformanceMonitor(environment);

  // Optional: authenticate for protected endpoints
  // await monitor.authenticate('test@example.com', 'password');

  await monitor.run();

  process.exit(0);
}

// Run the monitor
main().catch(console.error);
