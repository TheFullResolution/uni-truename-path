'use client';

import React, { Component, ReactNode } from 'react';
import { Container, Title, Text, Button, Alert, Box } from '@mantine/core';
import { IconAlertTriangle } from '@tabler/icons-react';

interface Props {
  children: ReactNode;
}

interface State {
  hasError: boolean;
  error?: Error;
  errorInfo?: React.ErrorInfo;
}

export class AuthErrorBoundary extends Component<Props, State> {
  constructor(props: Props) {
super(props);
this.state = { hasError: false };
  }

  static getDerivedStateFromError(error: Error): State {
// Update state so the next render will show the fallback UI
return { hasError: true, error };
  }

  componentDidCatch(error: Error, errorInfo: React.ErrorInfo) {
// Store error details for display
this.setState({
  error,
  errorInfo,
});

// In production, this would integrate with error reporting service
  }

  handleReset = () => {
// Reset the error boundary state
this.setState({ hasError: false, error: undefined, errorInfo: undefined });

// Reload the page to start fresh
window.location.reload();
  };

  render() {
if (this.state.hasError) {
  return (
<Container size='sm' mt='xl'>
  <Box style={{ textAlign: 'center' }}>
<IconAlertTriangle
  size={48}
  color='red'
  style={{ marginBottom: '1rem' }}
/>

<Title order={2} mb='md' c='red'>
  Authentication Error
</Title>

<Alert
  variant='light'
  color='red'
  mb='xl'
  styles={{
root: {
  backgroundColor: 'rgba(231, 76, 60, 0.1)',
  border: '1px solid rgba(231, 76, 60, 0.3)',
},
  }}
>
  <Text mb='sm'>
An error occurred while initializing the authentication system.
  </Text>

  {this.state.error && (
<Text size='sm' c='dimmed' style={{ fontFamily: 'monospace' }}>
  {this.state.error.message}
</Text>
  )}
</Alert>

<Button onClick={this.handleReset} color='blue' size='lg' mb='md'>
  Reload Application
</Button>

<Text size='sm' c='dimmed'>
  If this error persists, please check your browser&apos;s developer
  console for more detailed error information.
</Text>

{/* Development-only error details */}
{process.env.NODE_ENV === 'development' && this.state.error && (
  <Alert
variant='light'
color='gray'
mt='xl'
title='Development Error Details'
styles={{
  root: {
textAlign: 'left',
  },
}}
  >
<Text size='xs' style={{ fontFamily: 'monospace' }}>
  <strong>Error:</strong> {this.state.error.toString()}
</Text>

{this.state.error.stack && (
  <Text size='xs' mt='xs' style={{ fontFamily: 'monospace' }}>
<strong>Stack Trace:</strong>
<br />
{this.state.error.stack}
  </Text>
)}

{this.state.errorInfo?.componentStack && (
  <Text size='xs' mt='xs' style={{ fontFamily: 'monospace' }}>
<strong>Component Stack:</strong>
<br />
{this.state.errorInfo.componentStack}
  </Text>
)}
  </Alert>
)}
  </Box>
</Container>
  );
}

return this.props.children;
  }
}
