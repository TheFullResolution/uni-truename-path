/**
 * OAuth Complete Flow E2E Test
 *
 * Tests the complete OAuth authorization flow with server-side rendered page,
 * Bearer token resolution to OIDC claims, and security feature validation.
 *
 * This test suite validates:
 * 1. Complete authorization flow with Default context (from signup trigger)
 * 2. Bearer token resolves to OIDC claims correctly
 * 3. Security features work correctly (CSRF protection, domain validation)
 */

import { expect, test } from '@playwright/test';
import {
  getOrCreateTestUser,
  createAndLoginTestUser,
  ensureLoggedOut,
} from '@/utils/auth-helpers';
import { OAUTH_TEST_CONFIG } from '@/utils/oauth-config';

test.describe('OAuth Complete Flow', () => {
  // Reduced timeout for faster, more reliable server-rendered flow
  test.use({ actionTimeout: 15000 });

  // Note: Tests now start pre-authenticated via auth.setup.ts

  test('Complete authorization flow with context selection', async ({
page,
  }) => {
console.log('🚀 Starting complete OAuth authorization flow test');

// Step 1: Get pre-authenticated test user from setup
const user = await getOrCreateTestUser(page);
console.log(
  `✅ Using pre-authenticated test user: ${user.email} with Default context`,
);

// Step 2: Navigate to OAuth page (server-side rendering - no loading states!)
const testState = 'test123';
const callbackUrl = OAUTH_TEST_CONFIG.CALLBACK_URLS.HR;

const oauthUrl =
  '/auth/oauth-authorize?' +
  new URLSearchParams({
app_name: 'demo-hr',
return_url: callbackUrl,
state: testState,
  });

await page.goto(oauthUrl);
console.log('✅ Navigated to OAuth authorization page (server-rendered)');

// Step 3: Page loads instantly with all data pre-rendered (no SWR waiting)
// Use specific testid selectors instead of ambiguous text matching
await expect(page.getByTestId('oauth-app-info')).toBeVisible();
await expect(page.getByTestId('oauth-app-info')).toContainText('Demo Hr');
console.log('✅ App info displayed correctly (pre-rendered)');

// Step 4: Default context should be pre-selected (from signup trigger)
const defaultRadio = page.getByRole('radio', { name: 'Default' });
await expect(defaultRadio).toBeChecked();
console.log('✅ Default context pre-selected from signup trigger');

// Step 5: Authorization summary should be visible
await expect(page.getByTestId('oauth-authorization-summary')).toBeVisible();
await expect(page.getByTestId('oauth-authorization-summary')).toContainText(
  'Default',
);
console.log('✅ Authorization summary displayed');

// Step 6: Intercept callback URL (no server on port 3001)
let interceptedUrl = '';
await page.route('http://localhost:3001/callback**', async (route) => {
  interceptedUrl = route.request().url();
  console.log(`🔗 Intercepted callback: ${interceptedUrl}`);

  // Fulfill with simple success response
  await route.fulfill({
status: 200,
contentType: 'text/html',
body: '<html><body><h1>OAuth Callback Received</h1></body></html>',
  });
});

// Click authorize button (direct form submission)
const authorizeButton = page.getByTestId('oauth-authorize-button');
await expect(authorizeButton).toBeVisible();
await authorizeButton.click();
console.log('✅ Clicked authorize button');

// Step 7: Wait for callback interception and extract token
console.log('⏳ Waiting for OAuth redirect...');
await page.waitForURL(/localhost:3001\/callback/, {
  timeout: OAUTH_TEST_CONFIG.PERFORMANCE_LIMITS.FULL_FLOW_MS,
});

const urlParams = new URLSearchParams(new URL(interceptedUrl).search);
const token = urlParams.get('token');
const returnedState = urlParams.get('state');

// Verify token exists and format is correct
expect(token).toBeTruthy();
expect(token).toMatch(OAUTH_TEST_CONFIG.TOKEN_VALIDATION.FORMAT_REGEX);
console.log(
  `✅ Token received with correct format: ${token?.substring(0, 10)}...`,
);

// Verify state preservation (CSRF protection)
expect(returnedState).toBe(testState);
console.log(`✅ State parameter preserved: ${returnedState}`);

// Verify redirect URL matches expected callback
expect(interceptedUrl).toContain(callbackUrl);
console.log(`✅ Redirected to correct callback URL: ${callbackUrl}`);

console.log(
  '🎉 Complete OAuth authorization flow test completed successfully',
);
  });

  test('Bearer token resolves to OIDC claims', async ({ page }) => {
console.log('🚀 Testing Bearer token resolution to OIDC claims');

// Step 1: Use stored authenticated test user
const user = await getOrCreateTestUser(page);
console.log(`✅ Using stored test user: ${user.email}`);

// Step 2: Complete OAuth flow to get token
const testState = 'resolve-test-123';
const callbackUrl = OAUTH_TEST_CONFIG.CALLBACK_URLS.HR;

const oauthUrl =
  '/auth/oauth-authorize?' +
  new URLSearchParams({
app_name: 'demo-hr',
return_url: callbackUrl,
state: testState,
  });

// Intercept callback URL (no server on port 3001)
let interceptedUrl = '';
await page.route('http://localhost:3001/callback**', async (route) => {
  interceptedUrl = route.request().url();
  await route.fulfill({
status: 200,
contentType: 'text/html',
body: '<html><body><h1>OAuth Callback Received</h1></body></html>',
  });
});

await page.goto(oauthUrl);
await page.getByTestId('oauth-authorize-button').click();
await page.waitForURL(/localhost:3001\/callback/);

const token = new URLSearchParams(new URL(interceptedUrl).search).get(
  'token',
);
expect(token).toBeTruthy();
console.log(`✅ OAuth token obtained: ${token?.substring(0, 10)}...`);

// Step 3: Test Bearer token resolution via API
const response = await page.request.post('/api/oauth/resolve', {
  headers: {
'Authorization': `Bearer ${token}`,
'Content-Type': 'application/json',
  },
});

console.log(`🔍 API Response Status: ${response.status()}`);
if (!response.ok()) {
  const errorData = await response.json();
  console.log(`❌ API Error: ${JSON.stringify(errorData, null, 2)}`);
}
expect(response.ok()).toBe(true);
const data = await response.json();
console.log('✅ Bearer token resolved successfully');

// Step 4: Verify JSend response structure
expect(data.success).toBe(true);
expect(data.data).toBeDefined();
expect(data.data.claims).toBeDefined();
expect(data.data.resolved_at).toBeDefined();
expect(data.data.performance).toBeDefined();
expect(data.data.performance.response_time_ms).toBeGreaterThan(0);

// Step 5: Verify OIDC claims structure
const claims = data.data.claims;
expect(claims.sub).toBeDefined(); // Subject (user identifier)
expect(claims.name).toBeDefined(); // Display name
expect(claims.given_name).toBeDefined(); // First name
expect(claims.family_name).toBeDefined(); // Last name

console.log(`✅ OIDC claims validated: ${JSON.stringify(claims, null, 2)}`);
console.log('🎉 Bearer token resolution test completed successfully');
  });

  test('Security features work correctly', async ({ page }) => {
console.log('🚀 Testing OAuth security features');

// Part A: Missing Origin Header
console.log('🔒 Testing missing Origin header...');
const responseWithoutOrigin = await page.request.get(
  '/api/oauth/apps/test-app',
);

expect(responseWithoutOrigin.status()).toBe(400);
const errorData = await responseWithoutOrigin.json();
expect(errorData.success).toBe(false);
expect(errorData.error.code).toBe('OAUTH_MISSING_ORIGIN_HEADER');
expect(errorData.error.message).toContain('Origin');
console.log('✅ Missing Origin header properly rejected');

// Part B: Different Domains Get Different Client IDs
console.log('🌐 Testing domain-based client ID generation...');

// Request 1: HR Domain
const response1 = await page.request.get('/api/oauth/apps/test-app', {
  headers: {
Origin: 'https://hr.acmecorp.com',
  },
});

expect(response1.status()).toBe(200);
const data1 = await response1.json();
const clientId1 = data1.data.client.client_id;
// Client IDs: tnp_[16 hex chars] - for OAuth app registration
// Session tokens: tnp_[32 hex chars] - for Bearer authentication
expect(clientId1).toMatch(/^tnp_[a-f0-9]{16}$/);
console.log(`✅ HR domain client ID: ${clientId1}`);

// Request 2: Chat Domain
const response2 = await page.request.get('/api/oauth/apps/test-app', {
  headers: {
Origin: 'https://chat.techstartup.io',
  },
});

expect(response2.status()).toBe(200);
const data2 = await response2.json();
const clientId2 = data2.data.client.client_id;
// Client IDs: tnp_[16 hex chars] - for OAuth app registration
// Session tokens: tnp_[32 hex chars] - for Bearer authentication
expect(clientId2).toMatch(/^tnp_[a-f0-9]{16}$/);
console.log(`✅ Chat domain client ID: ${clientId2}`);

// Verify different domains get different client IDs
expect(clientId1).not.toBe(clientId2);
console.log('✅ Different domains receive different client IDs');

// Part C: Invalid Token Rejection
console.log('🔐 Testing invalid token rejection...');
const invalidTokenResponse = await page.request.post('/api/oauth/resolve', {
  headers: {
Authorization: 'Bearer invalid_token',
  },
});

expect(invalidTokenResponse.status()).toBe(401);
const invalidTokenData = await invalidTokenResponse.json();
expect(invalidTokenData.success).toBe(false);
expect(invalidTokenData.error.code).toBeDefined();
expect(invalidTokenData.error.message).toContain('token');
console.log('✅ Invalid token properly rejected');

console.log('🎉 Security features test completed successfully');
  });
});
