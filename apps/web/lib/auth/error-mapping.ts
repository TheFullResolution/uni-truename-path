import type { AuthErrorCode } from './supabase-auth';

/**
 * User-friendly error message mapping for authentication errors
 * 
 * This system provides actionable, user-friendly messages for authentication
 * error codes from the backend auth system. Messages are designed to help
 * users understand what went wrong and what they can do to resolve the issue.
 */

/**
 * Interface for error message configuration
 */
interface ErrorMessageConfig {
  /** Primary user-facing message */
  message: string;
  /** Optional detailed explanation */
  details?: string;
  /** Suggested action for the user */
  action?: string;
}

/**
 * Comprehensive mapping of authentication error codes to user-friendly messages
 */
const ERROR_MESSAGE_MAP: Record<AuthErrorCode, ErrorMessageConfig> = {
  'AUTHENTICATION_REQUIRED': {
message: 'Please sign in to continue',
details: 'You need to be logged in to access this feature',
action: 'Sign in to your account or create a new one'
  },
  'AUTHENTICATION_FAILED': {
message: 'Sign in failed',
details: 'The email address or password you entered is incorrect',
action: 'Check your credentials and try again'
  },
  'TOKEN_VERIFICATION_FAILED': {
message: 'Your session has expired',
details: 'For security reasons, you need to sign in again',
action: 'Please sign in again to continue'
  }
};

/**
 * Default error message for unknown error codes
 */
const DEFAULT_ERROR_MESSAGE: ErrorMessageConfig = {
  message: 'Something went wrong',
  details: 'An unexpected error occurred while processing your request',
  action: 'Please try again or contact support if the problem continues'
};

/**
 * Get user-friendly error message for an authentication error code
 * 
 * @param code - Authentication error code from the backend
 * @returns User-friendly error message
 */
export const getErrorMessage = (code: AuthErrorCode): string => {
  const errorConfig = ERROR_MESSAGE_MAP[code] || DEFAULT_ERROR_MESSAGE;
  return errorConfig.message;
};

/**
 * Get detailed error information including message, details, and suggested action
 * 
 * @param code - Authentication error code from the backend
 * @returns Complete error configuration object
 */
export const getErrorDetails = (code: AuthErrorCode): ErrorMessageConfig => {
  return ERROR_MESSAGE_MAP[code] || DEFAULT_ERROR_MESSAGE;
};

/**
 * Get a complete error description combining message and details
 * 
 * @param code - Authentication error code from the backend
 * @returns Combined message and details for comprehensive error display
 */
export const getFullErrorMessage = (code: AuthErrorCode): string => {
  const errorConfig = ERROR_MESSAGE_MAP[code] || DEFAULT_ERROR_MESSAGE;
  
  if (errorConfig.details) {
return `${errorConfig.message}. ${errorConfig.details}`;
  }
  
  return errorConfig.message;
};

/**
 * Get suggested user action for an error
 * 
 * @param code - Authentication error code from the backend
 * @returns Suggested action text or null if no specific action is available
 */
export const getErrorAction = (code: AuthErrorCode): string | null => {
  const errorConfig = ERROR_MESSAGE_MAP[code] || DEFAULT_ERROR_MESSAGE;
  return errorConfig.action || null;
};

/**
 * Check if an error code requires user authentication
 * 
 * @param code - Authentication error code from the backend
 * @returns True if the error indicates authentication is required
 */
export const isAuthenticationRequired = (code: AuthErrorCode): boolean => {
  return code === 'AUTHENTICATION_REQUIRED' || code === 'TOKEN_VERIFICATION_FAILED';
};

/**
 * Check if an error code indicates invalid credentials
 * 
 * @param code - Authentication error code from the backend
 * @returns True if the error indicates invalid login credentials
 */
export const isCredentialsError = (code: AuthErrorCode): boolean => {
  return code === 'AUTHENTICATION_FAILED';
};