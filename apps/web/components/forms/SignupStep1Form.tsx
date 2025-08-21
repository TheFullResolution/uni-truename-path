'use client';

import {
  Alert,
  Button,
  Checkbox,
  Group,
  Loader,
  PasswordInput,
  Stack,
  Text,
  TextInput,
} from '@mantine/core';
import { useForm } from '@mantine/form';
import { IconAlertCircle } from '@tabler/icons-react';
import { useCallback, useState } from 'react';
import { z } from 'zod';

// Validation schema for step 1 signup form (email/password only)
// eslint-disable-next-line @typescript-eslint/no-unused-vars
const signupStep1Schema = z
  .object({
email: z.string().email({ message: 'Invalid email address' }),
password: z
  .string()
  .min(8, { message: 'Password must be at least 8 characters long' })
  .regex(/[A-Z]/, {
message: 'Password must contain at least one uppercase letter',
  })
  .regex(/[a-z]/, {
message: 'Password must contain at least one lowercase letter',
  })
  .regex(/[0-9]/, { message: 'Password must contain at least one number' }),
confirmPassword: z.string(),
agreeToTerms: z.boolean().refine((val) => val === true, {
  message: 'You must agree to the Privacy Policy and Terms of Service',
}),
consentToProcessing: z.boolean().refine((val) => val === true, {
  message:
'Consent to context-aware name processing is required for core functionality',
}),
allowMarketing: z.boolean().optional(),
  })
  .refine((data) => data.password === data.confirmPassword, {
message: 'Passwords do not match',
path: ['confirmPassword'],
  });

export type SignupStep1Data = z.infer<typeof signupStep1Schema>;

interface SignupStep1FormProps {
  /** Called when step 1 is successfully completed */
  onStepComplete: (data: SignupStep1Data) => void;
  /** Called when user clicks "Back to Sign In" */
  onBackToLogin?: () => void;
  /** Show the back to login option */
  showBackToLogin?: boolean;
  /** Loading state from parent */
  loading?: boolean;
}

export function SignupStep1Form({
  onStepComplete,
  onBackToLogin,
  showBackToLogin = true,
  loading = false,
}: SignupStep1FormProps) {
  const [submitError, setSubmitError] = useState<string | null>(null);

  // Use Mantine form with custom Zod validation
  const form = useForm<SignupStep1Data>({
mode: 'uncontrolled',
initialValues: {
  email: '',
  password: '',
  confirmPassword: '',
  agreeToTerms: false,
  consentToProcessing: false,
  allowMarketing: false,
},
validate: {
  email: (value) => {
const result = z.string().email().safeParse(value);
return result.success ? null : 'Invalid email address';
  },
  password: (value) => {
const result = z
  .string()
  .min(8)
  .regex(/[A-Z]/)
  .regex(/[a-z]/)
  .regex(/[0-9]/)
  .safeParse(value);
if (!result.success) {
  return 'Password must be at least 8 characters with uppercase, lowercase, and number';
}
return null;
  },
  confirmPassword: (value, values) => {
if (value !== values.password) {
  return 'Passwords do not match';
}
return null;
  },
  agreeToTerms: (value) => {
return value
  ? null
  : 'You must agree to the Privacy Policy and Terms of Service';
  },
  consentToProcessing: (value) => {
return value
  ? null
  : 'Consent to processing is required for core functionality';
  },
},
  });

  const handleSubmit = useCallback(
async (values: SignupStep1Data) => {
  setSubmitError(null);
  onStepComplete(values);
},
[onStepComplete],
  );

  return (
<form onSubmit={form.onSubmit(handleSubmit)} noValidate>
  <Stack gap='md'>
<Text size='lg' fw={600} c='gray.8' mb='md'>
  Step 1: Account Setup
</Text>

{/* Error Alert */}
{submitError && (
  <Alert
variant='light'
color='red'
title='Validation Error'
icon={<IconAlertCircle size={16} />}
styles={{
  root: {
backgroundColor: 'rgba(231, 76, 60, 0.1)',
border: '1px solid rgba(231, 76, 60, 0.3)',
  },
}}
  >
<Text size='sm'>{submitError}</Text>
  </Alert>
)}

{/* Email Input */}
<TextInput
  label='Email Address'
  placeholder='you@example.com'
  required
  disabled={loading}
  data-autofocus
  autoComplete='email'
  data-testid='signup-email-input'
  {...form.getInputProps('email')}
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

{/* Password Input */}
<PasswordInput
  label='Password'
  placeholder='••••••••••••••••'
  required
  disabled={loading}
  autoComplete='new-password'
  data-testid='signup-password-input'
  {...form.getInputProps('password')}
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

{/* Confirm Password Input */}
<PasswordInput
  label='Confirm Password'
  placeholder='••••••••••••••••'
  required
  disabled={loading}
  autoComplete='new-password'
  data-testid='signup-confirm-password-input'
  {...form.getInputProps('confirmPassword')}
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

{/* GDPR Consent Checkboxes */}
<Stack gap='sm' mt='md'>
  <Text fw={500} size='sm' c='gray.8'>
Consent & Privacy
  </Text>

  {/* Required: Terms and Privacy Policy */}
  <Checkbox
label={
  <Text size='sm'>
I agree to the Privacy Policy and Terms of Service{' '}
<Text component='span' c='red' fw={500}>
  *
</Text>
  </Text>
}
disabled={loading}
data-testid='signup-terms-checkbox'
{...form.getInputProps('agreeToTerms', { type: 'checkbox' })}
styles={(theme) => ({
  label: {
fontSize: theme.fontSizes.sm,
lineHeight: 1.4,
cursor: 'pointer',
  },
  input: {
'cursor': 'pointer',
'&:focus': {
  outline: `2px solid ${theme.colors.blue[5]}`,
  outlineOffset: '2px',
},
  },
})}
  />

  {/* Required: Core Processing Consent */}
  <Checkbox
label={
  <Text size='sm'>
I consent to context-aware name processing (required for core
functionality){' '}
<Text component='span' c='red' fw={500}>
  *
</Text>
  </Text>
}
disabled={loading}
data-testid='signup-consent-checkbox'
{...form.getInputProps('consentToProcessing', { type: 'checkbox' })}
styles={(theme) => ({
  label: {
fontSize: theme.fontSizes.sm,
lineHeight: 1.4,
cursor: 'pointer',
  },
  input: {
'cursor': 'pointer',
'&:focus': {
  outline: `2px solid ${theme.colors.blue[5]}`,
  outlineOffset: '2px',
},
  },
})}
  />

  {/* Optional: Marketing Consent */}
  <Checkbox
label={
  <Text size='sm'>
Send me product updates and research findings (optional)
  </Text>
}
disabled={loading}
{...form.getInputProps('allowMarketing', { type: 'checkbox' })}
styles={(theme) => ({
  label: {
fontSize: theme.fontSizes.sm,
lineHeight: 1.4,
cursor: 'pointer',
color: theme.colors.gray[7],
  },
  input: {
'cursor': 'pointer',
'&:focus': {
  outline: `2px solid ${theme.colors.blue[5]}`,
  outlineOffset: '2px',
},
  },
})}
  />
</Stack>

{/* GDPR Data Processing Notice */}
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
  Data Processing:
</Text>{' '}
Your data will be processed according to GDPR guidelines. You can
withdraw consent, request data export, or delete your account at any
time.
  </Text>
</Alert>

{/* Continue Button */}
<Group mt='lg' gap='sm'>
  <Button
type='submit'
disabled={loading}
color='blue'
variant='filled'
size='md'
data-testid='signup-step1-submit'
leftSection={
  loading ? <Loader size='xs' color='white' /> : undefined
}
style={{
  'backgroundColor': '#3498db',
  '&:hover': {
backgroundColor: '#2980b9',
  },
  '&:disabled': {
backgroundColor: '#95a5a6',
opacity: 0.7,
  },
}}
  >
Continue to Name Setup
  </Button>

  {showBackToLogin && (
<Button
  type='button'
  variant='light'
  disabled={loading}
  onClick={onBackToLogin}
  size='md'
  style={{
'backgroundColor': '#6c757d',
'color': 'white',
'&:hover': {
  backgroundColor: '#5a6268',
},
'&:disabled': {
  opacity: 0.5,
},
  }}
>
  Back to Sign In
</Button>
  )}
</Group>
  </Stack>
</form>
  );
}
