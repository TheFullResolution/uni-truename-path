# Authentication Error Mapping System

This module provides user-friendly error message mapping for authentication errors in the TrueNamePath application.

## Overview

The error mapping system converts backend `AuthErrorCode` values into user-friendly messages that help users understand what went wrong and what they can do to fix it.

## Available Error Codes

- `AUTHENTICATION_REQUIRED` - User needs to sign in to access a feature
- `AUTHENTICATION_FAILED` - Invalid credentials or authentication failure
- `TOKEN_VERIFICATION_FAILED` - Session expired or invalid token

## Usage Examples

### Basic Error Message

```typescript
import { getErrorMessage } from '@/lib/auth';

const handleAuthError = (errorCode: AuthErrorCode) => {
  const message = getErrorMessage(errorCode);
  console.log(message);
  // Output: "Please sign in to continue" for AUTHENTICATION_REQUIRED
};
```

### Detailed Error Information

```typescript
import { getErrorDetails } from '@/lib/auth';

const showDetailedError = (errorCode: AuthErrorCode) => {
  const details = getErrorDetails(errorCode);
  
  console.log(details.message);// "Please sign in to continue"
  console.log(details.details);// "You need to be logged in to access this feature"  
  console.log(details.action); // "Sign in to your account or create a new one"
};
```

### Error Type Checking

```typescript
import { isAuthenticationRequired, isCredentialsError } from '@/lib/auth';

const handleError = (errorCode: AuthErrorCode) => {
  if (isAuthenticationRequired(errorCode)) {
// Redirect to login page
router.push('/login');
  } else if (isCredentialsError(errorCode)) {
// Show inline form validation error
setFieldError('credentials', getErrorMessage(errorCode));
  }
};
```

### Integration with AuthProvider

```typescript
import { useAuth, getErrorMessage } from '@/lib/auth';

const LoginForm = () => {
  const { error } = useAuth();
  
  return (
<form>
  {error && (
<Alert color="red">
  {getErrorMessage(error)}
</Alert>
  )}
  {/* form fields */}
</form>
  );
};
```

### Complete Error Display Component

```typescript
import { getErrorDetails } from '@/lib/auth';
import { Alert, Stack, Text, Button } from '@mantine/core';

interface AuthErrorDisplayProps {
  errorCode: AuthErrorCode;
  onRetry?: () => void;
}

const AuthErrorDisplay = ({ errorCode, onRetry }: AuthErrorDisplayProps) => {
  const errorDetails = getErrorDetails(errorCode);
  
  return (
<Alert color="red" title={errorDetails.message}>
  <Stack gap="sm">
{errorDetails.details && (
  <Text size="sm">{errorDetails.details}</Text>
)}
{errorDetails.action && (
  <Text size="sm" fw={500}>{errorDetails.action}</Text>
)}
{onRetry && (
  <Button size="sm" variant="light" onClick={onRetry}>
Try Again
  </Button>
)}
  </Stack>
</Alert>
  );
};
```

## API Reference

### Functions

- `getErrorMessage(code: AuthErrorCode): string` - Get basic user-friendly error message
- `getErrorDetails(code: AuthErrorCode): ErrorMessageConfig` - Get complete error configuration
- `getFullErrorMessage(code: AuthErrorCode): string` - Get message + details combined
- `getErrorAction(code: AuthErrorCode): string | null` - Get suggested user action
- `isAuthenticationRequired(code: AuthErrorCode): boolean` - Check if error requires login
- `isCredentialsError(code: AuthErrorCode): boolean` - Check if error is credentials-related

### Types

- `AuthErrorCode` - Union type of available error codes
- `ErrorMessageConfig` - Configuration object with message, details, and action