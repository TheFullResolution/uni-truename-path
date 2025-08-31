'use client';

import { Button, PasswordInput, Stack, Text } from '@mantine/core';
import { useForm } from '@mantine/form';
import { notifications } from '@mantine/notifications';
import { IconCheck, IconX } from '@tabler/icons-react';
import useSWRMutation from 'swr/mutation';

import { createMutationFetcher, formatSWRError } from '@/utils/swr-fetcher';
import {
  validatePassword,
  validatePasswordConfirmation,
  PASSWORD_HELPER_TEXT,
} from '@/utils/validation/password';
import { NOTIFICATION_SUCCESS_TIMEOUT } from '@/utils/constants/timeouts';

interface PasswordChangeData {
  newPassword: string;
  confirmPassword: string;
}

export function PasswordChangeForm() {
  const passwordForm = useForm<PasswordChangeData>({
mode: 'controlled',
initialValues: {
  newPassword: '',
  confirmPassword: '',
},
validate: {
  newPassword: (value) => validatePassword(value),
  confirmPassword: (value, values) =>
validatePasswordConfirmation(value, values.newPassword),
},
  });

  const { trigger: updatePassword, isMutating: passwordLoading } =
useSWRMutation('/api/settings/password', createMutationFetcher('POST'), {
  onSuccess: () => {
notifications.show({
  title: 'Password Updated',
  message: 'Your password has been changed successfully',
  color: 'green',
  icon: <IconCheck size={16} />,
  autoClose: NOTIFICATION_SUCCESS_TIMEOUT,
});
passwordForm.reset();
  },
  onError: (error) => {
const errorMessage = formatSWRError(error);
notifications.show({
  title: 'Password Update Failed',
  message: errorMessage,
  color: 'red',
  icon: <IconX size={16} />,
  autoClose: 6000,
});
  },
});

  const handlePasswordChange = async (values: PasswordChangeData) => {
await updatePassword({
  new_password: values.newPassword,
});
  };

  return (
<form onSubmit={passwordForm.onSubmit(handlePasswordChange)} noValidate>
  <Stack gap='md'>
<Text size='sm' fw={500} c='gray.7'>
  Change Password
</Text>

<PasswordInput
  label='New Password'
  placeholder='Enter your new password'
  required
  disabled={passwordLoading}
  autoComplete='new-password'
  description={PASSWORD_HELPER_TEXT}
  {...passwordForm.getInputProps('newPassword')}
/>

<PasswordInput
  label='Confirm New Password'
  placeholder='Confirm your new password'
  required
  disabled={passwordLoading}
  autoComplete='new-password'
  {...passwordForm.getInputProps('confirmPassword')}
/>

<Button
  type='submit'
  variant='filled'
  size='md'
  loading={passwordLoading}
  leftSection={<IconCheck size={16} />}
  color='blue'
>
  Update Password
</Button>
  </Stack>
</form>
  );
}
