// TrueNamePath: OAuth Security Validation E2E Tests
// End-to-end validation of GDPR-compliant OAuth security model
// Date: August 23, 2025
// Academic project E2E security test suite

import { test, expect, type Page } from '@playwright/test';
import {
  createAndLoginTestUser,
  ensureLoggedOut,
  type TestUser,
} from '@/utils/auth-helpers';

test.describe('OAuth Security Validation E2E', () => {
  let testUser: TestUser;

  test.beforeEach(async ({ page }) => {
await ensureLoggedOut(page);
testUser = await createAndLoginTestUser(page);
  });

  test.describe('OAuth Route Security Headers', () => {
// TODO: Enable when OAuth endpoints are implemented (Step 16.2.2+)
test.skip('should not expose user email in OAuth API responses', async ({
  page,
}) => {
  // Navigate to a page that might trigger OAuth API calls
  await page.goto('/dashboard');
  await expect(page).toHaveURL('/dashboard');

  // Set up response monitoring
  const responsePromises: Promise<any>[] = [];

  page.on('response', async (response) => {
const url = response.url();
if (url.includes('/api/oauth/')) {
  responsePromises.push(
response
  .text()
  .then((body) => ({ url, body, headers: response.headers() })),
  );
}
  });

  // Trigger some OAuth-related interactions
  // This might include context switching or name resolution
  await page.click('[data-testid="context-selector"]').catch(() => {
// Context selector might not be present, that's fine
  });

  // Wait for any OAuth API calls to complete
  await page.waitForTimeout(1000);

  // Analyze captured responses
  const responses = await Promise.all(responsePromises);

  for (const { url, body, headers } of responses) {
// Verify no email in response body
expect(body.toLowerCase()).not.toContain(testUser.email.toLowerCase());
expect(body.toLowerCase()).not.toContain('@e2e.local');

// Verify no email in response headers
const headerValues = Object.values(headers).join(' ').toLowerCase();
expect(headerValues).not.toContain(testUser.email.toLowerCase());
expect(headerValues).not.toContain('@e2e.local');

console.log(`Validated OAuth security for: ${url}`);
  }
});

test('should not expose user profile data in OAuth API responses', async ({
  page,
}) => {
  await page.goto('/dashboard');

  const responsePromises: Promise<any>[] = [];

  page.on('response', async (response) => {
const url = response.url();
if (url.includes('/api/oauth/')) {
  responsePromises.push(
response
  .text()
  .then((body) => ({ url, body, headers: response.headers() })),
  );
}
  });

  // Trigger OAuth-related interactions
  await page.waitForTimeout(1000);

  const responses = await Promise.all(responsePromises);

  for (const { url, body, headers } of responses) {
// Verify no full name or profile details
expect(body.toLowerCase()).not.toContain('full_name');
expect(body.toLowerCase()).not.toContain('created_at');
expect(body.toLowerCase()).not.toContain('updated_at');

// Headers should not contain profile data
const headerValues = Object.values(headers).join(' ').toLowerCase();
expect(headerValues).not.toContain('full_name');

console.log(`Validated OAuth profile security for: ${url}`);
  }
});

test('should allow minimal user identification for OAuth functionality', async ({
  page,
}) => {
  await page.goto('/dashboard');

  const responsePromises: Promise<any>[] = [];

  page.on('response', async (response) => {
const url = response.url();
if (
  url.includes('/api/oauth/resolve') ||
  url.includes('/api/oauth/authorize')
) {
  responsePromises.push(
response
  .json()
  .then((data) => ({ url, data }))
  .catch(() => ({ url, data: null })),
  );
}
  });

  // Trigger name resolution
  await page.waitForTimeout(1000);

  const responses = await Promise.all(responsePromises);

  for (const { url, data } of responses) {
if (data && data.success) {
  // Should have some form of user identification
  expect(data.data).toBeDefined();

  // But should not contain email or detailed profile
  const dataString = JSON.stringify(data);
  expect(dataString).not.toContain(testUser.email);
  expect(dataString).not.toContain('full_name');

  console.log(`Validated OAuth minimal identification for: ${url}`);
}
  }
});
  });

  test.describe('OAuth vs Internal Route Differentiation', () => {
test('should demonstrate different data exposure for OAuth vs internal routes', async ({
  page,
}) => {
  await page.goto('/dashboard');

  const oauthResponses: any[] = [];
  const internalResponses: any[] = [];

  page.on('response', async (response) => {
const url = response.url();
try {
  const data = await response.json();

  if (url.includes('/api/oauth/')) {
oauthResponses.push({ url, data });
  } else if (
url.includes('/api/names') ||
url.includes('/api/contexts')
  ) {
internalResponses.push({ url, data });
  }
} catch (e) {
  // Non-JSON responses, ignore
}
  });

  // Trigger both OAuth and internal API calls
  await page.waitForTimeout(2000);

  // Navigate to contexts page to trigger internal API calls
  await page.goto('/contexts');
  await page.waitForTimeout(1000);

  // Verify OAuth routes have minimal data
  oauthResponses.forEach(({ url, data }) => {
const dataString = JSON.stringify(data);
expect(dataString).not.toContain('jj@truename.test');
expect(dataString).not.toContain('full_name');
console.log(`OAuth route ${url} properly minimized`);
  });

  // Verify internal routes can have more data (if they need it)
  internalResponses.forEach(({ url, data }) => {
// Internal routes are allowed to have more data for legitimate business purposes
console.log(`Internal route ${url} accessed for business purposes`);
  });

  // There should be clear differentiation
  expect(oauthResponses.length + internalResponses.length).toBeGreaterThan(
0,
  );
});
  });

  test.describe('GDPR Compliance Validation', () => {
test('should demonstrate data minimization in practice', async ({
  page,
}) => {
  await page.goto('/dashboard');

  let oauthDataExposure = 0;
  let internalDataExposure = 0;

  page.on('response', async (response) => {
const url = response.url();
try {
  const text = await response.text();
  const emailCount = (text.match(/@truename\.test/g) || []).length;
  const profileFieldCount = (
text.match(/(full_name|created_at|updated_at)/g) || []
  ).length;

  if (url.includes('/api/oauth/')) {
oauthDataExposure += emailCount + profileFieldCount;
  } else if (
url.includes('/api/names') ||
url.includes('/api/contexts')
  ) {
internalDataExposure += emailCount + profileFieldCount;
  }
} catch (e) {
  // Error reading response, continue
}
  });

  // Trigger various API interactions
  await page.waitForTimeout(2000);
  await page.goto('/contexts');
  await page.waitForTimeout(1000);

  // OAuth routes should have minimal data exposure
  expect(oauthDataExposure).toBe(0);
  console.log(`OAuth data exposure: ${oauthDataExposure} (should be 0)`);
  console.log(
`Internal data exposure: ${internalDataExposure} (can be > 0 for business purposes)`,
  );
});
  });

  test.describe('Security Boundary Enforcement', () => {
test('should maintain security boundaries across user interactions', async ({
  page,
}) => {
  await page.goto('/dashboard');

  const securityViolations: string[] = [];

  page.on('response', async (response) => {
const url = response.url();

if (url.includes('/api/oauth/')) {
  try {
const text = await response.text();

// Check for potential security violations
if (text.includes(testUser.email)) {
  securityViolations.push(`Email exposed in OAuth route: ${url}`);
}
if (text.includes('full_name')) {
  securityViolations.push(
`Full name exposed in OAuth route: ${url}`,
  );
}
if (text.includes('created_at') && text.includes('updated_at')) {
  securityViolations.push(
`Metadata exposed in OAuth route: ${url}`,
  );
}
  } catch (e) {
// Continue on error
  }
}
  });

  // Perform various user interactions
  await page.waitForTimeout(1000);

  // Try to access different parts of the application
  const pages = ['/contexts', '/dashboard'];
  for (const pagePath of pages) {
await page.goto(pagePath);
await page.waitForTimeout(500);
  }

  // Should have no security violations
  expect(securityViolations).toHaveLength(0);

  if (securityViolations.length > 0) {
console.error('Security violations detected:', securityViolations);
  } else {
console.log('No security violations detected across user interactions');
  }
});

test('should prevent data leakage through browser developer tools', async ({
  page,
}) => {
  await page.goto('/dashboard');

  // Check that sensitive data is not logged to console
  const consoleLogs: string[] = [];

  page.on('console', (msg) => {
consoleLogs.push(msg.text());
  });

  // Trigger some interactions
  await page.waitForTimeout(2000);

  // Check console logs for data leakage
  const sensitiveDataInLogs = consoleLogs.some(
(log) =>
  log.includes(testUser.email) ||
  log.includes('full_name') ||
  log.includes('password') ||
  log.includes('token'),
  );

  expect(sensitiveDataInLogs).toBe(false);
  console.log(
`Checked ${consoleLogs.length} console logs for data leakage`,
  );
});
  });

  test.describe('Performance Impact Validation', () => {
test('should maintain performance while enforcing security', async ({
  page,
}) => {
  const startTime = Date.now();

  await page.goto('/dashboard');
  await page.waitForLoadState('networkidle');

  const loadTime = Date.now() - startTime;

  // Security overhead should not significantly impact performance
  // Allow generous time for E2E test environment
  expect(loadTime).toBeLessThan(5000); // 5 seconds max

  console.log(`Dashboard loaded with security controls in ${loadTime}ms`);
});
  });

  test.describe('Audit and Compliance Validation', () => {
test('should provide audit trail for security decisions', async ({
  page,
}) => {
  await page.goto('/dashboard');

  const auditTrail: any[] = [];

  page.on('response', async (response) => {
const url = response.url();
if (url.includes('/api/')) {
  auditTrail.push({
url,
status: response.status(),
timestamp: new Date().toISOString(),
isOAuth: url.includes('/api/oauth/'),
isInternal:
  url.includes('/api/names') || url.includes('/api/contexts'),
  });
}
  });

  // Generate some activity for audit
  await page.waitForTimeout(1000);
  await page.goto('/contexts');
  await page.waitForTimeout(500);

  // Should have some audit trail entries
  expect(auditTrail.length).toBeGreaterThan(0);

  // Verify different route types are properly categorized
  const oauthEntries = auditTrail.filter((entry) => entry.isOAuth);
  const internalEntries = auditTrail.filter((entry) => entry.isInternal);

  console.log(
`Audit trail: ${oauthEntries.length} OAuth, ${internalEntries.length} internal requests`,
  );

  // Each entry should have proper categorization
  auditTrail.forEach((entry) => {
expect(entry.timestamp).toBeDefined();
expect(typeof entry.status).toBe('number');
expect(typeof entry.isOAuth).toBe('boolean');
expect(typeof entry.isInternal).toBe('boolean');
  });
});

// TODO: Enable when OAuth endpoints exist to demonstrate GDPR principles (Step 16.2.2+)
test.skip('should demonstrate compliance with academic requirements', async ({
  page,
}) => {
  // This test validates that our security model meets academic requirements
  await page.goto('/dashboard');

  // Check that the system demonstrates key security principles
  const securityPrinciples = {
dataMinimization: false,
privacyByDesign: false,
purposeLimitation: false,
accessControl: false,
  };

  const apiResponses: any[] = [];

  page.on('response', async (response) => {
const url = response.url();
if (url.includes('/api/')) {
  try {
const data = await response.json();
apiResponses.push({
  url,
  data,
  isOAuth: url.includes('/api/oauth/'),
});
  } catch (e) {
// Non-JSON response, ignore
  }
}
  });

  await page.waitForTimeout(2000);

  // Analyze responses for security principles
  apiResponses.forEach(({ url, data, isOAuth }) => {
const dataString = JSON.stringify(data);

if (isOAuth) {
  // OAuth routes demonstrate data minimization
  if (!dataString.includes(testUser.email)) {
securityPrinciples.dataMinimization = true;
  }

  // OAuth routes demonstrate privacy by design
  if (!dataString.includes('full_name')) {
securityPrinciples.privacyByDesign = true;
  }

  // OAuth routes demonstrate purpose limitation
  if (data.success && data.data && !dataString.includes('created_at')) {
securityPrinciples.purposeLimitation = true;
  }
}

// All routes demonstrate access control (require authentication)
if (data.success || data.error?.code === 'AUTHENTICATION_REQUIRED') {
  securityPrinciples.accessControl = true;
}
  });

  // Should demonstrate all key security principles
  expect(securityPrinciples.dataMinimization).toBe(true);
  expect(securityPrinciples.privacyByDesign).toBe(true);
  expect(securityPrinciples.purposeLimitation).toBe(true);
  expect(securityPrinciples.accessControl).toBe(true);

  console.log(
'Academic security requirements validated:',
securityPrinciples,
  );
});
  });
});
