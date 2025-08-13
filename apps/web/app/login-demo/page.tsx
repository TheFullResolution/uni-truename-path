'use client';

import { Container, Paper, Title, Text, Group, Box } from '@mantine/core';
import { LoginForm } from '../../components/LoginForm';
import { useAuth } from '../../lib/context/AuthProvider';
import { useRouter } from 'next/navigation';

export default function LoginDemoPage() {
  const { user, logout } = useAuth();
  const router = useRouter();

  const handleLoginSuccess = () => {
console.log('Login successful! Redirecting...');
router.push('/demo'); // Redirect to demo page after successful login
  };

  const handleForgotPassword = () => {
console.log('Forgot password clicked');
// In a real app, this would navigate to forgot password page
alert('Forgot password functionality would be implemented here');
  };

  const handleCreateAccount = () => {
console.log('Create account clicked');
// In a real app, this would navigate to signup page
alert('Create account functionality would be implemented here');
  };

  if (user) {
return (
  <Container size='sm' py='xl'>
<Paper p='xl' radius='md' withBorder>
  <Title order={2} mb='md'>
Already Logged In
  </Title>
  <Text mb='lg'>
You are currently logged in as: <strong>{user.email}</strong>
  </Text>
  <Group>
<button
  onClick={() => router.push('/demo')}
  style={{
padding: '12px 24px',
backgroundColor: '#3498db',
color: 'white',
border: 'none',
borderRadius: '4px',
cursor: 'pointer',
  }}
>
  Go to Demo
</button>
<button
  onClick={() => logout()}
  style={{
padding: '12px 24px',
backgroundColor: '#6c757d',
color: 'white',
border: 'none',
borderRadius: '4px',
cursor: 'pointer',
  }}
>
  Sign Out
</button>
  </Group>
</Paper>
  </Container>
);
  }

  return (
<Box
  style={{
minHeight: '100vh',
backgroundColor: '#f8f9fa',
padding: '40px 20px',
  }}
>
  <Container size='sm'>
<Paper p='xl' radius='md' withBorder>
  <Title order={2} mb='xs' style={{ color: '#2c3e50' }}>
Sign In
  </Title>
  <Text size='sm' c='dimmed' mb='lg'>
Test the LoginForm component with Mantine integration
  </Text>

  <LoginForm
onSuccess={handleLoginSuccess}
onForgotPassword={handleForgotPassword}
onCreateAccount={handleCreateAccount}
showCreateAccount={true}
  />
</Paper>

<Paper
  p='md'
  radius='md'
  withBorder
  mt='md'
  style={{ backgroundColor: '#e8f4fd' }}
>
  <Title order={4} mb='sm' style={{ color: '#2c3e50' }}>
Test Credentials
  </Title>
  <Text size='sm' c='dimmed'>
Use any valid email format and password with at least 8 characters
to test the form validation. The form includes proper error handling
and loading states.
  </Text>
</Paper>
  </Container>
</Box>
  );
}
