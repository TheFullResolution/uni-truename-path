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
import { IconAlertCircle, IconCheck } from '@tabler/icons-react';
import { useCallback, useState } from 'react';
import { z } from 'zod';

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
  /** Called when step 2 is successfully completed */
  onComplete: (data: SignupStep2Data) => Promise<void>;
  /** Called when user clicks "Back" to step 1 */
  onBack: () => void;
  /** Loading state during account creation */
  loading?: boolean;
  /** Error message to display */
  error?: string | null;
}

export function SignupStep2Form({
  onComplete,
  onBack,
  loading = false,
  error = null,
}: SignupStep2FormProps) {
  const [submitError, setSubmitError] = useState<string | null>(null);

  // Use Mantine form with custom Zod validation
  const form = useForm<SignupStep2Data>({
mode: 'uncontrolled',
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

  const handleSubmit = useCallback(
async (values: SignupStep2Data) => {
  setSubmitError(null);
  try {
await onComplete(values);
  } catch (err) {
const errorMessage =
  err instanceof Error ? err.message : 'An unexpected error occurred';
setSubmitError(errorMessage);
  }
},
[onComplete],
  );

  const displayError = error || submitError;

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

{/* Error Alert */}
{displayError && (
  <Alert
variant='light'
color='red'
title='Account Creation Error'
icon={<IconAlertCircle size={16} />}
styles={{
  root: {
backgroundColor: 'rgba(231, 76, 60, 0.1)',
border: '1px solid rgba(231, 76, 60, 0.3)',
  },
}}
  >
<Text size='sm'>{displayError}</Text>
  </Alert>
)}

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
  styles={(theme) => ({
label: {
  fontWeight: 500,
  marginBottom: theme.spacing.xs,
  color: theme.colors.gray[8],
},
input: {
  '&:focus': {
borderColor: theme.colors.blue[5],
boxShadow: `0 0 0 2px rgba(52, 152, 219, 0.2)`,
  },
},
  })}
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
  styles={(theme) => ({
label: {
  fontWeight: 500,
  marginBottom: theme.spacing.xs,
  color: theme.colors.gray[8],
},
input: {
  '&:focus': {
borderColor: theme.colors.blue[5],
boxShadow: `0 0 0 2px rgba(52, 152, 219, 0.2)`,
  },
},
  })}
/>

{/* Display Name Input (Optional) */}
<TextInput
  label='Display Name'
  placeholder='Full name as you want it displayed (optional)'
  disabled={loading}
  autoComplete='name'
  data-testid='signup-display-name-input'
  {...form.getInputProps('display_name')}
  styles={(theme) => ({
label: {
  fontWeight: 500,
  marginBottom: theme.spacing.xs,
  color: theme.colors.gray[8],
},
input: {
  '&:focus': {
borderColor: theme.colors.blue[5],
boxShadow: `0 0 0 2px rgba(52, 152, 219, 0.2)`,
  },
},
  })}
/>

{/* Nickname Input (Optional) */}
<TextInput
  label='Nickname'
  placeholder='Casual name or alias (optional)'
  disabled={loading}
  autoComplete='nickname'
  data-testid='signup-nickname-input'
  {...form.getInputProps('nickname')}
  styles={(theme) => ({
label: {
  fontWeight: 500,
  marginBottom: theme.spacing.xs,
  color: theme.colors.gray[8],
},
input: {
  '&:focus': {
borderColor: theme.colors.blue[5],
boxShadow: `0 0 0 2px rgba(52, 152, 219, 0.2)`,
  },
},
  })}
/>

{/* Preferred Username Input (Optional) */}
<TextInput
  label='Preferred Username'
  placeholder='Preferred username (optional)'
  disabled={loading}
  autoComplete='username'
  data-testid='signup-preferred-username-input'
  {...form.getInputProps('preferred_username')}
  styles={(theme) => ({
label: {
  fontWeight: 500,
  marginBottom: theme.spacing.xs,
  color: theme.colors.gray[8],
},
input: {
  '&:focus': {
borderColor: theme.colors.blue[5],
boxShadow: `0 0 0 2px rgba(52, 152, 219, 0.2)`,
  },
},
  })}
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
  <Text size='xs' c='dimmed' style={{ lineHeight: 1.4 }}>
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
style={{
  'backgroundColor': '#27ae60',
  '&:hover': {
backgroundColor: '#229954',
  },
  '&:disabled': {
backgroundColor: '#95a5a6',
opacity: 0.7,
  },
}}
  >
{loading ? 'Creating Account...' : 'Complete Registration'}
  </Button>

  <Button
type='button'
variant='outline'
disabled={loading}
onClick={onBack}
size='md'
style={{
  'borderColor': '#6c757d',
  'color': '#6c757d',
  '&:hover': {
backgroundColor: '#f8f9fa',
borderColor: '#5a6268',
color: '#5a6268',
  },
  '&:disabled': {
opacity: 0.5,
  },
}}
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
