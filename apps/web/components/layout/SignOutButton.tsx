'use client';

import { Button } from '@mantine/core';
import { IconLogout } from '@tabler/icons-react';
import { useRouter } from 'next/navigation';
import { useCallback } from 'react';
import { useAuth } from '@/utils/context';
import { createLogoutHandler } from '@/utils/utils';

export function SignOutButton() {
  const { logout, loading } = useAuth();
  const router = useRouter();

  const handleLogout = useCallback(
() => createLogoutHandler(logout, router)(),
[logout, router],
  );

  return (
<Button
  leftSection={<IconLogout size={16} />}
  variant='subtle'
  color='red'
  onClick={handleLogout}
  loading={loading}
  disabled={loading}
  size='sm'
  data-testid='sign-out-button'
>
  Sign Out
</Button>
  );
}
