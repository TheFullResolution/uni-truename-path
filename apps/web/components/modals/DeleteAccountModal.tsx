'use client';

import {
  Modal,
  Text,
  Button,
  Group,
  Stack,
  Alert,
  TextInput,
  Loader,
} from '@mantine/core';
import {
  IconAlertTriangle,
  IconTrash,
  IconExclamationCircle,
} from '@tabler/icons-react';
import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { notifications } from '@mantine/notifications';
import { useAuth } from '@/utils/context/AuthProvider';
import { createClient } from '@/utils/supabase/client';
import { NOTIFICATION_ACCOUNT_DELETED_TIMEOUT } from '@/utils/constants/timeouts';
import { clearAllSWRCache } from '@/utils/swr/cache-utils';

interface DeleteAccountModalProps {
  opened: boolean;
  onClose: () => void;
}

export function DeleteAccountModal({
  opened,
  onClose,
}: DeleteAccountModalProps) {
  const router = useRouter();
  const { user } = useAuth();
  const [confirmationStep, setConfirmationStep] = useState<
'initial' | 'confirm'
  >('initial');
  const [emailConfirmation, setEmailConfirmation] = useState('');
  const [isDeleting, setIsDeleting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const isEmailValid = emailConfirmation === user?.email;

  const handleInitialConfirm = () => {
setConfirmationStep('confirm');
setError(null);
  };

  const handleFinalConfirm = async () => {
if (!isEmailValid) {
  setError('Email confirmation does not match your account email');
  return;
}

setIsDeleting(true);
setError(null);

try {
  const response = await fetch('/api/settings/account', {
method: 'DELETE',
headers: {
  'Content-Type': 'application/json',
},
body: JSON.stringify({
  email: emailConfirmation,
}),
  });

  const result = await response.json();

  if (!response.ok || result.status === 'error') {
const errorMessage =
  result.details || result.message || 'Failed to delete account';
setError(errorMessage);
return;
  }

  // Success - account deleted, clear client-side auth and redirect
  notifications.show({
title: 'Account Deleted',
message: 'Your account has been permanently deleted',
color: 'green',
autoClose: NOTIFICATION_ACCOUNT_DELETED_TIMEOUT,
  });

  // CRITICAL: Clear client-side authentication state
  // The server already signed out, but we need to clear browser state
  try {
const supabase = createClient();
await supabase.auth.signOut();
  } catch {
// Continue with redirect even if signOut fails
// Client-side signOut failure is non-critical since server already handled the signout
  }

  // Clear all SWR cache to prevent data leakage
  await clearAllSWRCache();

  // Close modal and redirect (use replace to prevent back navigation)
  handleClose();
  router.replace('/auth/account-deleted');
} catch (err) {
  console.error('Delete account error:', err);
  setError('An unexpected error occurred. Please try again.');
} finally {
  setIsDeleting(false);
}
  };

  const handleClose = () => {
setConfirmationStep('initial');
setEmailConfirmation('');
setError(null);
onClose();
  };

  if (!user) {
return null;
  }

  return (
<Modal
  opened={opened}
  onClose={isDeleting ? () => {} : handleClose}
  title={
confirmationStep === 'initial'
  ? 'Delete Account'
  : 'Confirm Account Deletion'
  }
  centered
  size='lg'
  closeOnClickOutside={!isDeleting}
  closeOnEscape={!isDeleting}
>
  <Stack gap='md'>
{confirmationStep === 'initial' ? (
  <>
{/* Initial warning screen */}
<Alert
  icon={<IconAlertTriangle size={16} />}
  title='Permanent Action'
  color='red'
  variant='light'
>
  <Text size='sm'>
You are about to permanently delete your TrueNamePath account.
This action cannot be undone and will result in:
  </Text>
</Alert>

{/* What will be deleted */}
<Stack gap='xs'>
  <Text size='sm' fw={500} c='dimmed'>
The following data will be permanently removed:
  </Text>
  <Stack gap='xs' pl='md'>
<Text size='sm'>• Your profile and account information</Text>
<Text size='sm'>• All name variants and identity data</Text>
<Text size='sm'>• All contexts and context assignments</Text>
<Text size='sm'>• Connected app authorizations</Text>
<Text size='sm'>• Audit logs and activity history</Text>
<Text size='sm'>• All consent records</Text>
  </Stack>
</Stack>

{/* Additional warnings */}
<Alert
  icon={<IconExclamationCircle size={16} />}
  title='Important Considerations'
  color='orange'
  variant='light'
>
  <Stack gap='xs'>
<Text size='sm'>
  • Connected applications will no longer be able to access your
  identity data
</Text>
<Text size='sm'>
  • This action affects all OAuth integrations immediately
</Text>
<Text size='sm'>
  • You will need to create a new account to use TrueNamePath
  again
</Text>
  </Stack>
</Alert>

<Group justify='flex-end' mt='md'>
  <Button
onClick={handleClose}
variant='light'
size='md'
disabled={isDeleting}
data-testid='modal-cancel-button'
  >
Cancel
  </Button>
  <Button
onClick={handleInitialConfirm}
variant='filled'
color='red'
size='md'
disabled={isDeleting}
leftSection={<IconTrash size={16} />}
data-testid='modal-continue-button'
  >
I Understand - Continue
  </Button>
</Group>
  </>
) : (
  <>
{/* Email confirmation screen */}
<Alert
  icon={<IconExclamationCircle size={16} />}
  title='Type Your Email to Confirm'
  color='red'
>
  <Text size='sm' mb='md'>
To prevent accidental deletion, please type your email address
exactly as shown below to confirm this permanent action.
  </Text>
  <Text size='sm' fw={500} c='dark'>
Your Email: {user.email}
  </Text>
</Alert>

<TextInput
  label='Email Confirmation'
  description='Type your email address exactly as shown above'
  placeholder='Enter your email address'
  value={emailConfirmation}
  onChange={(event) => {
setEmailConfirmation(event.currentTarget.value);
if (error) setError(null);
  }}
  disabled={isDeleting}
  error={error}
  required
  data-testid='email-confirmation-input'
/>

{/* Final warning */}
<Alert
  icon={<IconAlertTriangle size={16} />}
  title='Final Warning'
  color='red'
  variant='filled'
>
  <Text size='sm' fw={500}>
This will permanently delete your account and all associated
data. This action cannot be undone.
  </Text>
</Alert>

<Group justify='flex-end' mt='md'>
  <Button
onClick={() => {
  setConfirmationStep('initial');
  setEmailConfirmation('');
  setError(null);
}}
variant='light'
size='md'
disabled={isDeleting}
data-testid='modal-back-button'
  >
Back
  </Button>
  <Button
onClick={handleFinalConfirm}
variant='filled'
color='red'
size='md'
disabled={!isEmailValid || isDeleting}
loading={isDeleting}
leftSection={
  isDeleting ? <Loader size={16} /> : <IconTrash size={16} />
}
data-testid='modal-confirm-delete-button'
  >
{isDeleting ? 'Deleting Account...' : 'Delete My Account'}
  </Button>
</Group>
  </>
)}
  </Stack>
</Modal>
  );
}
