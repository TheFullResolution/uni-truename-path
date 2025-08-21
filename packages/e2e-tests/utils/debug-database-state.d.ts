/**
 * TypeScript declarations for debug-database-state.js
 */

export declare function debugDatabaseState(
  specificUserId?: string | null,
): Promise<{
  success: boolean;
  data?: any;
  error?: string;
}>;

export declare const DEMO_USERS: Array<{
  id: string;
  email: string;
  persona: string;
}>;
