'use client';

import { useState, useCallback } from 'react';
import {
  TextInput,
  PasswordInput,
  Button,
  Group,
  Alert,
  Stack,
  Text,
  Loader,
  Center,
  Checkbox,
  Divider,
} from '@mantine/core';
import { useForm } from '@mantine/form';
import { notifications } from '@mantine/notifications';
import { IconAlertCircle, IconCheck, IconX } from '@tabler/icons-react';
import { z } from 'zod';
import { useAuth } from '../lib/context';
import { getErrorMessage, getErrorAction } from '../lib/auth';

// Validation schema for signup form
const signupSchema = z
  .object({
email: z.email({ message: 'Invalid email address' }),
legalName: z
  .string()
  .min(1, { message: 'Legal name is required' })
  .max(100, { message: 'Legal name must be less than 100 characters' }),
preferredName: z
  .string()
  .max(100, { message: 'Preferred name must be less than 100 characters' })
  .optional(),
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

type SignupFormDataInternal = z.infer<typeof signupSchema>;

interface SignupFormProps {
  /** Called when signup is successful */
  onSuccess?: () => void;
  /** Called when user clicks "Back to Sign In" */
  onBackToLogin?: () => void;
  /** Show the divider and back to login section */
  showBackToLogin?: boolean;
}

export function SignupForm({
  onSuccess,
  onBackToLogin,
  showBackToLogin = true,
}: SignupFormProps) {
  const { signup, loading, error: contextError } = useAuth();
  const [submitError, setSubmitError] = useState<string | null>(null);

  // Use Mantine form with custom Zod validation
  const form = useForm<SignupFormDataInternal>({
mode: 'uncontrolled',
initialValues: {
  email: '',
  legalName: '',
  preferredName: '',
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
  legalName: (value) => {
const result = z.string().min(1).max(100).safeParse(value);
return result.success ? null : 'Legal name is required';
  },
  preferredName: (value) => {
if (!value) return null; // Optional field
const result = z.string().max(100).safeParse(value);
return result.success
  ? null
  : 'Preferred name must be less than 100 characters';
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
async (values: SignupFormDataInternal) => {
  setSubmitError(null);

  // Additional validation with Zod schema
  const validationResult = signupSchema.safeParse(values);
  if (!validationResult.success) {
// Form validation failed
const firstError = validationResult.error.issues[0];
setSubmitError(
  firstError?.message || 'Please check your input and try again.',
);

// Show validation error notification
notifications.show({
  title: 'Validation Error',
  message: firstError?.message || 'Please check all required fields',
  color: 'red',
  icon: <IconX size={16} />,
  autoClose: 4000,
});
return;
  }

  try {
// Call signup with enhanced signature from AuthProvider
const response = await signup(
  values.email,
  values.password,
  values.legalName,
  values.preferredName || undefined,
);

if (response.user) {
  // Signup successful - show success notification
  notifications.show({
title: 'Welcome to TrueNamePath!',
message: `Account created successfully for ${response.user.email}`,
color: 'green',
icon: <IconCheck size={16} />,
autoClose: 5000,
  });

  // Clear form data for security
  form.reset();

  // Execute success callback
  onSuccess?.();
} else if (response.error) {
  // Signup failed - show specific error message
  const errorMessage = getErrorMessage(response.error.code);
  setSubmitError(errorMessage);

  // Show error notification
  notifications.show({
title: 'Account Creation Failed',
message: errorMessage,
color: 'red',
icon: <IconX size={16} />,
autoClose: 5000,
  });
}
  } catch {
// Signup form error occurred
const errorMessage = 'An unexpected error occurred. Please try again.';
setSubmitError(errorMessage);

// Show system error notification
notifications.show({
  title: 'System Error',
  message: errorMessage,
  color: 'red',
  icon: <IconX size={16} />,
  autoClose: 5000,
});
  }
},
[signup, onSuccess, form],
  );

  // Determine which error to show
  const displayError =
contextError || (submitError ? ('AUTHENTICATION_FAILED' as const) : null);

  const errorMessage =
displayError === 'AUTHENTICATION_FAILED' && submitError
  ? submitError
  : displayError
? getErrorMessage(displayError)
: null;

  return (
<form onSubmit={form.onSubmit(handleSubmit)} noValidate>
  <Stack gap='md'>
{/* Error Alert */}
{displayError && (
  <Alert
variant='light'
color='red'
title='Account Creation Failed'
icon={<IconAlertCircle size={16} />}
styles={{
  root: {
backgroundColor: 'rgba(231, 76, 60, 0.1)',
border: '1px solid rgba(231, 76, 60, 0.3)',
  },
}}
  >
<Stack gap='xs'>
  <Text size='sm'>{errorMessage}</Text>
  {getErrorAction(displayError) && (
<Text size='xs' c='dimmed'>
  {getErrorAction(displayError)}
</Text>
  )}
</Stack>
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
  aria-describedby={form.errors.email ? 'email-error' : undefined}
/>

{/* Legal Name Input */}
<TextInput
  label='Full Legal Name'
  placeholder='Your official legal name'
  required
  disabled={loading}
  autoComplete='name'
  {...form.getInputProps('legalName')}
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
  aria-describedby={
form.errors.legalName ? 'legal-name-error' : undefined
  }
/>

{/* Preferred Name Input (Optional) */}
<TextInput
  label='Preferred Display Name'
  placeholder="How you'd like to be called (optional)"
  disabled={loading}
  autoComplete='nickname'
  {...form.getInputProps('preferredName')}
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
  aria-describedby={
form.errors.preferredName ? 'preferred-name-error' : undefined
  }
/>

{/* Password Input */}
<PasswordInput
  label='Password'
  placeholder='••••••••••••••••'
  required
  disabled={loading}
  autoComplete='new-password'
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
  aria-describedby={form.errors.password ? 'password-error' : undefined}
/>

{/* Confirm Password Input */}
<PasswordInput
  label='Confirm Password'
  placeholder='••••••••••••••••'
  required
  disabled={loading}
  autoComplete='new-password'
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
  aria-describedby={
form.errors.confirmPassword ? 'confirm-password-error' : undefined
  }
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
aria-describedby={
  form.errors.agreeToTerms ? 'terms-error' : undefined
}
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
aria-describedby={
  form.errors.consentToProcessing ? 'consent-error' : undefined
}
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

{/* Submit and Back Buttons */}
<Group mt='lg' gap='sm'>
  <Button
type='submit'
loading={loading}
disabled={loading}
color='blue'
variant='filled'
size='md'
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
{loading ? 'Creating Account...' : 'Create Account'}
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

{/* Loading overlay when authenticating */}
{loading && (
  <Center mt='md'>
<Group gap='xs'>
  <Loader size='xs' color='blue' />
  <Text size='sm' c='dimmed'>
Creating your TrueNamePath account...
  </Text>
</Group>
  </Center>
)}

{/* Back to Login Section */}
{showBackToLogin && (
  <>
<Divider
  label=''
  my='lg'
  styles={{
root: {
  borderColor: '#dee2e6',
},
  }}
/>

<Stack gap='sm' align='center'>
  <Text size='sm' c='dimmed'>
Already have an account?
  </Text>
  <Button
type='button'
variant='filled'
color='blue'
disabled={loading}
onClick={onBackToLogin}
style={{
  'backgroundColor': '#3498db',
  '&:hover': {
backgroundColor: '#2980b9',
  },
}}
  >
Sign In
  </Button>
</Stack>
  </>
)}
  </Stack>
</form>
  );
}

export type { SignupFormProps };
