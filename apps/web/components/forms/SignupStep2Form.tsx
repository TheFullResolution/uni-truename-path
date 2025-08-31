'use client';

import {
  Alert,
  Button,
  Group,
  Loader,
  Stack,
  Text,
  TextInput,
} from '@mantine/core';
import { useForm } from '@mantine/form';
import { IconCheck, IconX } from '@tabler/icons-react';
import { useCallback } from 'react';
import { z } from 'zod';
import useSWRMutation from 'swr/mutation';
import { notifications } from '@mantine/notifications';
import { useRouter, useSearchParams } from 'next/navigation';
import type { Route } from 'next';

import { createMutationFetcher, formatSWRError } from '@/utils/swr-fetcher';
import type { SignupStep1Data } from './SignupStep1Form';

// Validation schema for step 2 signup form (OIDC name properties)
// eslint-disable-next-line @typescript-eslint/no-unused-vars
const signupStep2Schema = z.object({
  given_name: z
.string()
.trim()
.min(1, { message: 'Given name is required' })
.max(100, { message: 'Given name must be less than 100 characters' }),

  family_name: z
.string()
.trim()
.min(1, { message: 'Family name is required' })
.max(100, { message: 'Family name must be less than 100 characters' }),

  display_name: z
.string()
.trim()
.max(200, { message: 'Display name must be less than 200 characters' })
.optional()
.transform((val) => (val === '' ? undefined : val)),

  nickname: z
.string()
.trim()
.max(100, { message: 'Nickname must be less than 100 characters' })
.optional()
.transform((val) => (val === '' ? undefined : val)),

  preferred_username: z
.string()
.trim()
.max(50, { message: 'Username must be less than 50 characters' })
.optional()
.transform((val) => (val === '' ? undefined : val)),
});

export type SignupStep2Data = z.infer<typeof signupStep2Schema>;

interface SignupStep2FormProps {
  /** Step 1 data (email, password, consent) */
  step1Data: SignupStep1Data;
  /** Called when signup is successfully completed (optional - form redirects internally) */
  onComplete?: () => void;
  /** Called when user clicks "Back" to step 1 */
  onBack: () => void;
}

export function SignupStep2Form({
  step1Data,
  onComplete: _onComplete, // eslint-disable-line @typescript-eslint/no-unused-vars
  onBack,
}: SignupStep2FormProps) {
  const router = useRouter();
  const searchParams = useSearchParams();

  // Use Mantine form with controlled mode
  const form = useForm<SignupStep2Data>({
mode: 'controlled',
initialValues: {
  given_name: '',
  family_name: '',
  display_name: '',
  nickname: '',
  preferred_username: '',
},
validate: {
  given_name: (value) => {
const result = z.string().trim().min(1).max(100).safeParse(value);
return result.success ? null : 'Given name is required';
  },
  family_name: (value) => {
const result = z.string().trim().min(1).max(100).safeParse(value);
return result.success ? null : 'Family name is required';
  },
  display_name: (value) => {
if (!value || value.trim() === '') return null; // Optional field
const result = z.string().max(200).safeParse(value);
return result.success
  ? null
  : 'Display name must be less than 200 characters';
  },
  nickname: (value) => {
if (!value || value.trim() === '') return null; // Optional field
const result = z.string().max(100).safeParse(value);
return result.success
  ? null
  : 'Nickname must be less than 100 characters';
  },
  preferred_username: (value) => {
if (!value || value.trim() === '') return null; // Optional field
const result = z.string().max(50).safeParse(value);
return result.success
  ? null
  : 'Username must be less than 50 characters';
  },
},
  });

  // Clean SWR mutation for signup - redirect to login on success
  const { trigger: submitSignup, isMutating: loading } = useSWRMutation(
'/api/auth/signup',
createMutationFetcher('POST'),
{
  onSuccess: () => {
notifications.show({
  title: 'Account Created Successfully!',
  message: 'Please log in with your new account',
  color: 'green',
  icon: <IconCheck size={16} />,
  autoClose: 5000,
});

// Preserve returnUrl parameter if present (for OAuth flows)
const returnUrl = searchParams.get('returnUrl');
const loginUrl = returnUrl
  ? `/auth/login?signup=success&returnUrl=${encodeURIComponent(returnUrl)}`
  : '/auth/login?signup=success';

router.push(loginUrl as Route);
  },
  onError: (error) => {
const errorMessage = formatSWRError(error);
notifications.show({
  title: 'Account Creation Failed',
  message: errorMessage,
  color: 'red',
  icon: <IconX size={16} />,
  autoClose: 6000,
});
  },
},
  );

  const handleSubmit = useCallback(
async (values: SignupStep2Data) => {
  // Combine step 1 and step 2 data for complete signup request
  const signupData = {
...step1Data,
...values,
  };

  await submitSignup(signupData);
},
[step1Data, submitSignup],
  );

  return (
<form onSubmit={form.onSubmit(handleSubmit)} noValidate>
  <Stack gap='md'>
<Text size='lg' fw={600} c='gray.8' mb='md'>
  Step 2: Name Setup
</Text>

<Text size='sm' c='gray.6' mb='md'>
  These OIDC-compliant name properties will be used for context-aware
  identity management.
</Text>

{/* Error handling is done via notifications in useSWRMutation */}

{/* Given Name Input (Required) */}
<TextInput
  label='Given Name'
  placeholder='Your first name'
  required
  disabled={loading}
  data-autofocus
  autoComplete='given-name'
  data-testid='signup-given-name-input'
  {...form.getInputProps('given_name')}
/>

{/* Family Name Input (Required) */}
<TextInput
  label='Family Name'
  placeholder='Your last name / surname'
  required
  disabled={loading}
  autoComplete='family-name'
  data-testid='signup-family-name-input'
  {...form.getInputProps('family_name')}
/>

{/* Display Name Input (Optional) */}
<TextInput
  label='Display Name'
  placeholder='Full name as you want it displayed (optional)'
  disabled={loading}
  autoComplete='name'
  data-testid='signup-display-name-input'
  {...form.getInputProps('display_name')}
/>

{/* Nickname Input (Optional) */}
<TextInput
  label='Nickname'
  placeholder='Casual name or alias (optional)'
  disabled={loading}
  autoComplete='nickname'
  data-testid='signup-nickname-input'
  {...form.getInputProps('nickname')}
/>

{/* Preferred Username Input (Optional) */}
<TextInput
  label='Preferred Username'
  placeholder='Preferred username (optional)'
  disabled={loading}
  autoComplete='username'
  data-testid='signup-preferred-username-input'
  {...form.getInputProps('preferred_username')}
/>

{/* OIDC Information Notice */}
<Alert
  variant='light'
  color='blue'
  styles={{
root: {
  backgroundColor: 'rgba(52, 152, 219, 0.1)',
  border: '1px solid rgba(52, 152, 219, 0.3)',
},
  }}
>
  <Text size='xs' c='dimmed' lh={1.4}>
<Text component='span' fw={500}>
  OIDC Compliance:
</Text>{' '}
These name properties follow OpenID Connect Core 1.0 specification
and will create a default &quot;Professional&quot; context for your
identity management.
  </Text>
</Alert>

{/* Action Buttons */}
<Group mt='lg' gap='sm'>
  <Button
type='submit'
loading={loading}
disabled={loading}
color='green'
variant='filled'
size='md'
data-testid='signup-step2-submit'
leftSection={
  loading ? (
<Loader size='xs' color='white' />
  ) : (
<IconCheck size={16} />
  )
}
  >
{loading ? 'Creating Account...' : 'Complete Registration'}
  </Button>

  <Button
type='button'
variant='outline'
color='gray'
disabled={loading}
onClick={onBack}
size='md'
  >
Back
  </Button>
</Group>

{/* Loading indicator */}
{loading && (
  <Group justify='center' mt='md'>
<Group gap='xs'>
  <Loader size='xs' color='blue' />
  <Text size='sm' c='dimmed'>
Setting up your TrueNamePath identity...
  </Text>
</Group>
  </Group>
)}
  </Stack>
</form>
  );
}
