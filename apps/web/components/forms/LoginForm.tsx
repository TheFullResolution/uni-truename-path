'use client';

import { useAuth } from '@/utils/context';
import {
  Alert,
  Button,
  Center,
  Divider,
  Group,
  Loader,
  PasswordInput,
  Stack,
  Text,
  TextInput,
} from '@mantine/core';
import { useForm } from '@mantine/form';
import { notifications } from '@mantine/notifications';
import { IconAlertCircle, IconCheck, IconX } from '@tabler/icons-react';
import { useCallback, useState } from 'react';
import { z } from 'zod';

// Validation schema for login form
const loginSchema = z.object({
  email: z.email({ message: 'Invalid email address' }),
  password: z
.string()
.min(8, { message: 'Password must be at least 8 characters long' }),
});

type LoginFormData = z.infer<typeof loginSchema>;

interface LoginFormProps {
  /** Called when login is successful */
  onSuccess?: () => void;
  /** Called when user clicks "Forgot Password?" */
  onForgotPassword?: () => void;
  /** Called when user clicks "Create Account" */
  onCreateAccount?: () => void;
  /** Show the divider and create account section */
  showCreateAccount?: boolean;
}

export function LoginForm({
  onSuccess,
  onForgotPassword,
  onCreateAccount,
  showCreateAccount = true,
}: LoginFormProps) {
  const {
login,
loading,
error: contextError,
getErrorMessage,
getErrorAction,
  } = useAuth();
  const [submitError, setSubmitError] = useState<string | null>(null);

  // Use Mantine form with custom Zod validation
  const form = useForm<LoginFormData>({
mode: 'uncontrolled',
initialValues: {
  email: '',
  password: '',
},
validate: {
  email: (value) => {
const result = z.string().email().safeParse(value);
return result.success ? null : 'Invalid email address';
  },
  password: (value) => {
const result = z.string().min(8).safeParse(value);
return result.success
  ? null
  : 'Password must be at least 8 characters long';
  },
},
  });

  const handleSubmit = useCallback(
async (values: LoginFormData) => {
  setSubmitError(null);

  // Additional validation with Zod schema
  const validationResult = loginSchema.safeParse(values);
  if (!validationResult.success) {
// Form validation failed
setSubmitError('Please check your input and try again.');

// Show validation error notification
notifications.show({
  title: 'Validation Error',
  message: 'Please check your email and password format',
  color: 'red',
  icon: <IconX size={16} />,
  autoClose: 4000,
});
return;
  }

  try {
const response = await login(values.email, values.password);

if (response.user) {
  // Login successful - show success notification
  notifications.show({
title: 'Welcome back!',
message: `Successfully signed in as ${response.user.email}`,
color: 'green',
icon: <IconCheck size={16} />,
autoClose: 3000,
  });

  // Clear form data for security
  form.reset();

  // Execute success callback
  onSuccess?.();
} else if (response.error) {
  // Login failed - show specific error message
  const errorMessage = getErrorMessage(response.error.code);
  setSubmitError(errorMessage);

  // Show error notification
  notifications.show({
title: 'Sign In Failed',
message: errorMessage,
color: 'red',
icon: <IconX size={16} />,
autoClose: 5000,
  });
}
  } catch {
// Login form error occurred
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
[login, onSuccess, form, getErrorMessage],
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
title='Sign In Failed'
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
  placeholder='user@example.com'
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

{/* Password Input */}
<PasswordInput
  label='Password'
  placeholder='••••••••••••••••'
  required
  disabled={loading}
  autoComplete='current-password'
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

{/* Submit and Forgot Password Buttons */}
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
{loading ? 'Signing In...' : 'Sign In'}
  </Button>

  <Button
type='button'
variant='light'
disabled={loading}
onClick={onForgotPassword}
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
Forgot Password?
  </Button>
</Group>

{/* Loading overlay when authenticating */}
{loading && (
  <Center mt='md'>
<Group gap='xs'>
  <Loader size='xs' color='blue' />
  <Text size='sm' c='dimmed'>
Authenticating with TrueNamePath...
  </Text>
</Group>
  </Center>
)}

{/* Create Account Section */}
{showCreateAccount && (
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
Don&apos;t have an account?
  </Text>
  <Button
type='button'
variant='filled'
color='blue'
disabled={loading}
onClick={onCreateAccount}
style={{
  'backgroundColor': '#3498db',
  '&:hover': {
backgroundColor: '#2980b9',
  },
}}
  >
Create Account
  </Button>
</Stack>
  </>
)}
  </Stack>
</form>
  );
}

export type { LoginFormProps };
