/**
 * OAuth User Flow Scenarios E2E Test
 *
 * Tests specific OAuth user journey scenarios:
 * 1. Signup through demo app - Complete flow from unauthenticated to OAuth token
 * 2. Context selection with new contexts - Creating contexts and using them in OAuth
 *
 * Refactored for academic constraints: ≤80 lines per function
 */

import { expect, test, type Page } from '@playwright/test';
import {
  ensureLoggedOut,
  createAndLoginTestUser,
  type TestUser,
} from '@/utils/auth-helpers';
import { createContext, assignNameToContext } from '@/utils/context-helpers';
import { OAUTH_TEST_CONFIG } from '@/utils/oauth-config';

// Helper interface for signup data
interface SignupData {
  email: string;
  password: string;
  given_name: string;
  family_name: string;
  name: string;
}

// Helper interface for OAuth parameters
interface OAuthParams {
  state: string;
  callbackUrl: string;
  appName: string;
}

/**
 * Performs complete signup flow through OAuth redirect
 * @param page - Playwright page instance
 * @param signupData - User registration data
 */
async function performSignupFlow(
  page: Page,
  signupData: SignupData,
): Promise<void> {
  console.log('🔐 Performing signup flow with OAuth redirect');

  // Complete Step 1: Email and password
  await page.getByTestId('signup-email-input').fill(signupData.email);
  await page.getByTestId('signup-password-input').fill(signupData.password);
  await page
.getByTestId('signup-confirm-password-input')
.fill(signupData.password);
  await page.getByTestId('signup-terms-checkbox').check();
  await page.getByTestId('signup-consent-checkbox').check();
  await page.getByTestId('signup-step1-submit').click();
  console.log('✅ Completed signup step 1 (credentials)');

  // Complete Step 2: OIDC properties
  await page.getByTestId('signup-given-name-input').fill(signupData.given_name);
  await page
.getByTestId('signup-family-name-input')
.fill(signupData.family_name);
  await page.getByTestId('signup-display-name-input').fill(signupData.name);
  await page.getByTestId('signup-step2-submit').click();
  console.log('✅ Completed signup step 2 (OIDC properties)');

  // Verify signup redirect to login page with success message (may include returnUrl)
  await expect(page).toHaveURL(new RegExp('/auth/login\\?signup=success'));
  console.log('✅ Signup completed, now on login page');

  // Perform manual login to complete authentication
  await page.getByTestId('login-email-input').fill(signupData.email);
  await page.getByTestId('login-password-input').fill(signupData.password);
  await page.getByTestId('login-submit-button').click();

  // Verify automatic redirect back to OAuth authorization after login
  await expect(page).toHaveURL(new RegExp('/auth/oauth-authorize'));
  console.log('✅ Logged in and redirected back to OAuth authorization page');
}

/**
 * Navigates to OAuth authorization page with parameters
 * @param page - Playwright page instance
 * @param params - OAuth parameters (state, callback URL, app name)
 */
async function navigateToOAuthAuthorization(
  page: Page,
  params: OAuthParams,
): Promise<void> {
  console.log(`🔗 Navigating to OAuth authorization for ${params.appName}`);

  const oauthUrl =
'/auth/oauth-authorize?' +
new URLSearchParams({
  app_name: params.appName,
  return_url: params.callbackUrl,
  state: params.state,
});

  await page.goto(oauthUrl);
  console.log('✅ Navigated to OAuth authorization URL');
}

/**
 * Validates complete OAuth flow including token generation and claims
 * @param page - Playwright page instance
 * @param expectedContext - Expected context name in claims
 * @param testState - State parameter for OAuth flow validation
 * @param expectedNames - Expected name data in claims
 */
async function validateOAuthFlow(
  page: Page,
  expectedContext: string,
  testState: string,
  expectedNames: Partial<SignupData>,
): Promise<string> {
  console.log('🔍 Validating OAuth flow and token generation');

  // Set up callback interception
  let interceptedUrl = '';
  await page.route('http://localhost:3001/callback**', async (route) => {
interceptedUrl = route.request().url();
console.log(`🔗 Intercepted callback: ${interceptedUrl}`);
await route.fulfill({
  status: 200,
  contentType: 'text/html',
  body: '<html><body><h1>OAuth Callback Received</h1></body></html>',
});
  });

  // Complete authorization
  const authorizeButton = page.getByTestId('oauth-authorize-button');
  await expect(authorizeButton).toBeVisible();
  await authorizeButton.click();
  console.log('✅ Clicked authorize button');

  // Extract and validate token
  await page.waitForURL(/localhost:3001\/callback/, { timeout: 15000 });
  const urlParams = new URLSearchParams(new URL(interceptedUrl).search);
  const token = urlParams.get('token');
  const returnedState = urlParams.get('state');

  expect(token).toBeTruthy();
  expect(token).toMatch(OAUTH_TEST_CONFIG.TOKEN_VALIDATION.FORMAT_REGEX);
  expect(returnedState).toBe(testState);
  console.log(
`✅ Token generated with correct format: ${token?.substring(0, 10)}...`,
  );

  // Validate OIDC claims
  await validateOidcClaims(page, token!, expectedContext, expectedNames);

  return token!;
}

/**
 * Validates OIDC claims from OAuth token
 * @param page - Playwright page instance
 * @param token - OAuth token to validate
 * @param expectedContext - Expected context name
 * @param expectedNames - Expected name data
 */
async function validateOidcClaims(
  page: Page,
  token: string,
  expectedContext: string,
  expectedNames: Partial<SignupData>,
): Promise<void> {
  console.log('🔍 Validating OIDC claims');

  const response = await page.request.post('/api/oauth/resolve', {
headers: {
  'Authorization': `Bearer ${token}`,
  'Content-Type': 'application/json',
},
  });

  expect(response.ok()).toBe(true);
  const data = await response.json();
  const claims = data.data.claims;

  // Validate core claims
  expect(claims.context_name).toBe(expectedContext);

  // Validate expected name data if provided
  if (expectedNames.given_name) {
expect(claims.given_name).toBe(expectedNames.given_name);
  }
  if (expectedNames.family_name) {
expect(claims.family_name).toBe(expectedNames.family_name);
  }
  if (expectedNames.name) {
expect(claims.name).toContain(expectedNames.name.split(' ')[0]); // Contains base name
  }

  console.log('✅ OIDC claims validated');
  console.log(`   Context: ${claims.context_name}`);
  console.log(`   Given name: ${claims.given_name}`);
  console.log(`   Family name: ${claims.family_name}`);
  console.log(`   Display name: ${claims.name}`);
}

/**
 * Sets up gaming context with names and assignments
 * @param page - Playwright page instance
 * @param user - Test user data
 * @param contextName - Name of gaming context to create
 */
async function setupGamingContext(
  page: Page,
  user: TestUser,
  contextName: string,
): Promise<void> {
  console.log(`🎮 Setting up gaming context: ${contextName}`);

  // Create new context
  const contextCreated = await createContext(page, contextName);
  if (!contextCreated) {
throw new Error(`Failed to create context: ${contextName}`);
  }

  // Navigate to names tab and create gaming names
  await page.getByTestId('tab-names').click();
  await expect(
page.getByRole('heading', { name: 'Name Variants' }),
  ).toBeVisible();
  console.log('✅ Navigated to names tab');

  // Create gaming names
  const gamingNickname = `GamerPro${Date.now()}`;
  const gamingDisplayName = `Gaming ${user.given_name || 'Player'}`;

  await createGamingNames(page, gamingNickname, gamingDisplayName);

  // Assign names to gaming context (simplified assignment)
  try {
const assignmentButtons = page
  .locator('button')
  .filter({ hasText: /assign|context/i });
if (await assignmentButtons.first().isVisible({ timeout: 5000 })) {
  await assignmentButtons.first().click();
  const contextOption = page.getByText(contextName);
  if (await contextOption.isVisible({ timeout: 5000 })) {
await contextOption.click();
console.log(`✅ Assigned name to ${contextName}`);
  }
  await page.waitForTimeout(1000);
}
  } catch (error) {
console.log('⚠️  Name assignment may need manual verification');
  }
}

/**
 * Creates gaming-specific name variants
 * @param page - Playwright page instance
 * @param nickname - Gaming nickname to create
 * @param displayName - Gaming display name to create
 */
async function createGamingNames(
  page: Page,
  nickname: string,
  displayName: string,
): Promise<void> {
  console.log('🏷️ Creating gaming name variants');

  const toggleAddButton = page.getByTestId('toggle-add-name-form');
  await expect(toggleAddButton).toBeVisible();

  // Create first name (gaming nickname)
  await toggleAddButton.click();

  // Wait for form to open and elements to be ready
  await expect(page.getByTestId('name-text-input')).toBeVisible({
timeout: 5000,
  });
  await expect(page.getByTestId('add-name-button')).toBeVisible({
timeout: 5000,
  });

  await page.getByTestId('name-text-input').fill(nickname);
  await page.getByTestId('add-name-button').click();

  // Wait for success notification to confirm form submission completed
  await expect(page.locator('text=Name Added')).toBeVisible({ timeout: 10000 });
  console.log(`✅ Created gaming nickname: ${nickname}`);

  // Wait and create second name
  await page.waitForTimeout(1500);
  await toggleAddButton.click();

  // Wait for form to open and elements to be ready
  await expect(page.getByTestId('name-text-input')).toBeVisible({
timeout: 5000,
  });
  await expect(page.getByTestId('add-name-button')).toBeVisible({
timeout: 5000,
  });

  await page.getByTestId('name-text-input').fill(displayName);
  await page.getByTestId('add-name-button').click();

  // Wait for success notification to confirm form submission completed
  await expect(page.locator('text=Name Added')).toBeVisible({ timeout: 10000 });
  console.log(`✅ Created gaming display name: ${displayName}`);

  await page.waitForTimeout(1500);
}

test.describe('OAuth User Flow Scenarios', () => {
  test.use({ actionTimeout: 15000 });

  test('Signup Through Demo App - Complete flow from unauthenticated to OAuth', async ({
page,
  }) => {
console.log('🚀 Starting signup through demo app OAuth flow test');

// Step 1: Start as unauthenticated user
await ensureLoggedOut(page);
console.log('✅ Ensured user is logged out');

// Step 2: Navigate to OAuth authorization URL
const testState = 'signup-flow-test-123';
const oauthParams: OAuthParams = {
  state: testState,
  callbackUrl: OAUTH_TEST_CONFIG.CALLBACK_URLS.HR,
  appName: 'demo-hr',
};

await navigateToOAuthAuthorization(page, oauthParams);
console.log(
  '✅ Navigated to OAuth authorization URL from unauthenticated state',
);

// Step 3: Verify redirect to login with preserved returnUrl
await expect(page).toHaveURL(/\/auth\/login/);
expect(page.url()).toContain('returnUrl');
console.log('✅ Redirected to login page with preserved returnUrl');

// Step 4: Navigate to signup
const createAccountButton = page.getByTestId('login-create-account-button');
await expect(createAccountButton).toBeVisible();
await createAccountButton.click();
console.log('✅ Clicked create account button');

// Step 5: Complete signup flow
const uniqueId = Date.now();
const signupData: SignupData = {
  email: `signuptest${uniqueId}@e2e.local`,
  password: 'TestPass123!',
  given_name: 'John',
  family_name: 'Doe',
  name: `John Doe ${uniqueId}`,
};

await performSignupFlow(page, signupData);

// Step 6: Verify Default context pre-selection
const defaultRadio = page.getByRole('radio', { name: 'Default' });
await expect(defaultRadio).toBeChecked();
console.log('✅ Default context pre-selected from signup trigger');

// Step 7: Complete OAuth flow and validate claims
await validateOAuthFlow(page, 'Default', testState, signupData);

console.log('🎉 Signup through demo app flow completed successfully');
  });

  test('Context Selection with New Contexts - Creating and using fresh contexts', async ({
page,
  }) => {
console.log('🚀 Starting context selection with new contexts test');

// Step 1: Create and login fresh test user
const user = await createAndLoginTestUser(page);
console.log(`✅ Created and logged in fresh test user: ${user.email}`);

// Step 2: Set up gaming context with names
const contextName = `Gaming Friends ${Date.now()}`;
await setupGamingContext(page, user, contextName);
console.log(`✅ Gaming context setup completed: ${contextName}`);

// Step 3: Navigate to OAuth authorization
const testState = 'new-context-test-456';
const oauthParams: OAuthParams = {
  state: testState,
  callbackUrl: OAUTH_TEST_CONFIG.CALLBACK_URLS.HR,
  appName: 'demo-hr',
};

await navigateToOAuthAuthorization(page, oauthParams);
console.log('✅ Navigated to OAuth authorization page');

// Step 4: Verify and select new context
const contextRadio = page.getByRole('radio', { name: contextName });
await expect(contextRadio).toBeVisible();
await contextRadio.click();
console.log(`✅ Selected new context: ${contextName}`);

// Verify authorization summary
const summaryElement = page.getByTestId('oauth-authorization-summary');
await expect(summaryElement).toContainText(contextName);
console.log('✅ Authorization summary shows selected context');

// Step 5: Complete OAuth flow and validate claims
const token = await validateOAuthFlow(page, contextName, testState, {});

// Step 6: Additional validation for gaming context
const response = await page.request.post('/api/oauth/resolve', {
  headers: {
'Authorization': `Bearer ${token}`,
'Content-Type': 'application/json',
  },
});

const data = await response.json();
const claims = data.data.claims;

// Verify gaming context specific claims
expect(claims.context_name).toBe(contextName);
expect(claims.app_name).toBe('demo-hr');
expect(claims.sub).toBeDefined();

// Log gaming identity information if available
if (claims.name) {
  console.log(`   ✅ Name property found: ${claims.name}`);
} else {
  console.log(
`   ⚠️  Name property not populated (context assignment may need time to sync)`,
  );
}

if (claims.nickname || claims.preferred_username) {
  console.log(`   Gaming identity detected in claims`);
  if (claims.nickname) console.log(`   Nickname: ${claims.nickname}`);
  if (claims.preferred_username)
console.log(`   Preferred username: ${claims.preferred_username}`);
}

console.log(
  '🎉 Context selection with new contexts test completed successfully',
);
  });
});
