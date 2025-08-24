import { useRouter } from 'next/navigation';
import { notifications } from '@mantine/notifications';
import type { Route } from 'next';

/**
 * Utility function for creating a logout handler with a specific logout function
 *
 * @param logout - The logout function from auth context
 * @param router - Next.js router instance
 * @returns A callback function that handles the logout process
 */
export const createLogoutHandler = (
  logout: () => Promise<{ error: string | null }>,
  router: ReturnType<typeof useRouter>,
) => {
  return async () => {
try {
  const result = await logout();

  if (!result.error) {
notifications.show({
  title: 'Signed out successfully',
  message: 'You have been signed out of TrueNamePath',
  color: 'blue',
  autoClose: 3000,
});

router.replace('/auth/login' as Route);
  } else {
notifications.show({
  title: 'Logout failed',
  message: result.error,
  color: 'red',
  autoClose: 5000,
});
  }
} catch (error) {
  notifications.show({
title: 'Logout error',
message:
  error instanceof Error
? error.message
: 'An unexpected error occurred during logout',
color: 'red',
autoClose: 5000,
  });
}
  };
};
