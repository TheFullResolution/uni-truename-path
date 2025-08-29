import { useState } from 'react';
import { Button } from '@mantine/core';
import { modals } from '@mantine/modals';
import { notifications } from '@mantine/notifications';
import { IconTrash } from '@tabler/icons-react';
import { useAuth } from '@/utils/context';
import { revokeConnectedApp } from '@/utils/oauth/revocation-frontend';

interface AppRevocationButtonProps {
  clientId: string;
  appName: string;
  onRevoked: (clientId: string) => void;
}

export function AppRevocationButton({
  clientId,
  appName,
  onRevoked,
}: AppRevocationButtonProps) {
  const [loading, setLoading] = useState(false);
  const { user } = useAuth();

  const handleRevoke = () => {
modals.openConfirmModal({
  title: `Revoke ${appName}?`,
  children: `This will terminate access for ${appName}`,
  labels: { confirm: 'Revoke', cancel: 'Cancel' },
  confirmProps: { color: 'red' },
  onConfirm: async () => {
setLoading(true);
const result = await revokeConnectedApp(clientId, user?.id || '');
notifications.show({
  title: result.success ? 'Revoked' : 'Failed',
  message: result.message,
  color: result.success ? 'green' : 'red',
});
if (result.success) onRevoked(clientId);
setLoading(false);
  },
});
  };

  return (
<Button
  variant='light'
  color='red'
  size='sm'
  leftSection={<IconTrash size={16} />}
  onClick={handleRevoke}
  loading={loading}
>
  Revoke
</Button>
  );
}
