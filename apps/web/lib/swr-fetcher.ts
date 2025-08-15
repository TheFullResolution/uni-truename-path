// TrueNamePath: SWR Fetcher Utilities for Cookie-Based Authentication
// Shared utilities for data fetching with SWR using cookie-based authentication
// Date: August 14, 2025
// Academic project infrastructure following dashboard authentication patterns

/**
 * Type-safe SWR fetcher for GET requests with cookie-based authentication
 * Provides full TypeScript support by preserving type information through generics
 * Follows the same pattern as the dashboard for 100% authentication consistency
 *
 * @template T - Type of the data expected from the API response
 * @param url - API endpoint URL
 * @returns Promise resolving to the typed data from successful API response
 * @throws Error if request fails or response indicates failure
 */
export async function swrFetcher<T = unknown>(url: string): Promise<T> {
  const response = await fetch(url, {
method: 'GET',
headers: {
  'Content-Type': 'application/json',
},
// Cookie-based auth - NO Authorization headers (dashboard pattern)
credentials: 'include',
  });

  if (!response.ok) {
const errorText = await response.text();
throw new Error(`HTTP ${response.status}: ${errorText}`);
  }

  const result = await response.json();

  // Handle JSend format responses
  if (result.success === false) {
throw new Error(result.message || 'API request failed');
  }

  // Return the data portion of JSend response with proper typing
  return result.data as T;
}

/**
 * Factory function to create type-safe mutation fetchers for different HTTP methods
 * Supports POST, PUT, DELETE with cookie-based authentication and full type safety
 *
 * @template TResponse - Type of the response data expected from the API
 * @template TArg - Type of the argument/body data to send with the request
 * @param method - HTTP method (POST, PUT, DELETE)
 * @returns Type-safe SWR mutation fetcher function
 */
export function createMutationFetcher<TResponse = unknown, TArg = unknown>(
  method: 'POST' | 'PUT' | 'DELETE' = 'POST',
) {
  return async (url: string, { arg }: { arg?: TArg }): Promise<TResponse> => {
const response = await fetch(url, {
  method,
  headers: {
'Content-Type': 'application/json',
  },
  // Cookie-based auth - NO Authorization headers (dashboard pattern)
  credentials: 'include',
  body: arg ? JSON.stringify(arg) : undefined,
});

if (!response.ok) {
  const errorText = await response.text();
  throw new Error(`HTTP ${response.status}: ${errorText}`);
}

const result = await response.json();

// Handle JSend format responses
if (result.success === false) {
  throw new Error(result.message || `${method} request failed`);
}

// Return the data portion of JSend response with proper typing
return result.data as TResponse;
  };
}

/**
 * Error handling utility for SWR error boundaries
 * Extracts meaningful error messages from various error types
 *
 * @param error - Error object from SWR
 * @returns Formatted error message for UI display
 */
export function formatSWRError(error: unknown): string {
  if (!error) return 'Unknown error occurred';

  if (typeof error === 'string') return error;

  if (
error &&
typeof error === 'object' &&
'message' in error &&
typeof error.message === 'string'
  ) {
return error.message;
  }

  if (error && typeof error === 'object' && 'response' in error) {
const response = error.response;
if (response && typeof response === 'object' && 'data' in response) {
  const data = response.data;
  if (
data &&
typeof data === 'object' &&
'message' in data &&
typeof data.message === 'string'
  ) {
return data.message;
  }
}
  }

  return 'An error occurred while processing your request';
}
