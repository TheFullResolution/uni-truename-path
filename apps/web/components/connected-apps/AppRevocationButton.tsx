import { Button } from '@mantine/core';
import { modals } from '@mantine/modals';
import { notifications } from '@mantine/notifications';
import { IconTrash } from '@tabler/icons-react';
import useSWRMutation from 'swr/mutation';
import { createMutationFetcher, formatSWRError } from '@/utils/swr-fetcher';
import type { RevokeAppResponseData, RevokeAppRequest } from '@/types/oauth';

interface AppRevocationButtonProps {
  clientId: string;
  appName: string;
  onRevalidate?: () => void;
}

export function AppRevocationButton({
  clientId,
  appName,
  onRevalidate,
}: AppRevocationButtonProps) {
  // Mutation for revoking app access with proper typing
  const { trigger: revokeApp, isMutating } = useSWRMutation<
RevokeAppResponseData,
Error,
string,
RevokeAppRequest
  >('/api/oauth/revoke', createMutationFetcher('POST'), {
onSuccess: (data) => {
  notifications.show({
title: 'Revoked',
message:
  data.revoked_sessions === 0
? 'Application access was already inactive'
: `Successfully revoked access for all ${data.revoked_sessions} active session${data.revoked_sessions !== 1 ? 's' : ''}`,
color: 'green',
  });
  // Use the revalidate function passed from parent (following NamesTab pattern)
  onRevalidate?.();
},
onError: (error) => {
  notifications.show({
title: 'Failed',
message: formatSWRError(error),
color: 'red',
  });
},
  });

  const handleRevoke = () => {
modals.openConfirmModal({
  title: `Revoke ${appName}?`,
  children: `This will terminate access for ${appName}`,
  labels: { confirm: 'Revoke', cancel: 'Cancel' },
  confirmProps: { color: 'red' },
  onConfirm: () => {
revokeApp({
  client_id: clientId,
  remove_assignment: true,
});
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
  loading={isMutating}
>
  Revoke
</Button>
  );
}
