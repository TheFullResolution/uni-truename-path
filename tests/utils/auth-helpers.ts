import { Page } from '@playwright/test';

export class AuthHelper {
  constructor(private page: Page) {}

  /**
   * Mock authentication state
   */
  async mockAuth(email: string = 'test@example.com') {
// Mock Supabase auth session
await this.page.addInitScript((userEmail) => {
  window.localStorage.setItem(
'supabase.auth.token',
JSON.stringify({
  access_token: 'mock-access-token',
  refresh_token: 'mock-refresh-token',
  user: {
id: 'mock-user-id',
email: userEmail,
created_at: new Date().toISOString(),
  },
}),
  );
}, email);
  }

  /**
   * Clear authentication state
   */
  async clearAuth() {
await this.page.evaluate(() => {
  window.localStorage.removeItem('supabase.auth.token');
  window.sessionStorage.clear();
});
  }

  /**
   * Navigate to login page
   */
  async goToLogin() {
await this.page.goto('/auth/login');
  }

  /**
   * Navigate to dashboard
   */
  async goToDashboard() {
await this.page.goto('/dashboard');
  }
}
