# AuthGuard Component

The `AuthGuard` component provides route protection and authentication handling for the TrueNamePath application.

## Overview

AuthGuard is a React component that wraps your application routes to provide automatic authentication checking and route protection. It integrates seamlessly with the `AuthProvider` context and provides flexible fallback handling for unauthenticated users.

## Features

- **Automatic Route Protection**: Redirects unauthenticated users to login page
- **Loading States**: Shows loading UI while checking authentication status
- **Custom Fallbacks**: Support for custom components instead of automatic redirects
- **Error Handling**: Graceful error display for authentication issues
- **Flexible Configuration**: Optional authentication and custom redirect paths
- **Current Path Preservation**: Maintains redirect URL for post-login navigation

## Basic Usage

```tsx
import { AuthGuard } from './components/auth/AuthGuard';

// Basic protection - redirects to /login if not authenticated
export function ProtectedPage() {
  return (
<AuthGuard>
  <YourProtectedContent />
</AuthGuard>
  );
}
```

## Props

| Prop  | Type  | Default | Description|
| ***REMOVED***---- | ***REMOVED******REMOVED***--- | ***REMOVED***-- | ***REMOVED******REMOVED******REMOVED******REMOVED******REMOVED***- |
| `children`| `React.ReactNode` | -   | Content to render when authenticated   |
| `fallback`| `React.ComponentType` | `undefined` | Custom component for unauthenticated state |
| `requireAuth` | `boolean` | `true`  | Whether authentication is required |
| `redirectTo`  | `string`  | `'/login'`  | Custom redirect path for unauthenticated users |

## Usage Examples

### 1. Basic Protection

```tsx
<AuthGuard>
  <Dashboard />
</AuthGuard>
```

### 2. Custom Fallback Component

```tsx
function LoginPrompt() {
  return (
<Card>
  <Text>Please log in to continue</Text>
  <Button href='/login'>Login</Button>
</Card>
  );
}

<AuthGuard fallback={LoginPrompt}>
  <UserProfile />
</AuthGuard>;
```

### 3. Optional Authentication

```tsx
// Content visible to all users, but can check auth status inside
<AuthGuard requireAuth={false}>
  <PublicContent />
</AuthGuard>
```

### 4. Custom Redirect Path

```tsx
<AuthGuard redirectTo='/admin/login'>
  <AdminPanel />
</AuthGuard>
```

## Integration with AuthProvider

AuthGuard relies on the `AuthProvider` context for authentication state:

```tsx
// App setup
function App() {
  return (
<AuthProvider>
  <AuthGuard>
<YourApp />
  </AuthGuard>
</AuthProvider>
  );
}
```

## Authentication States

The component handles different authentication states:

1. **Loading**: Shows loading spinner while checking auth status
2. **Authenticated**: Renders protected content
3. **Unauthenticated**: Redirects to login or shows fallback
4. **Error**: Displays error message for auth failures

## Redirect Behavior

When redirecting unauthenticated users:

- Current path is preserved as `?redirect=` query parameter
- Allows post-login redirect to original destination
- Only applies when `requireAuth=true` and no custom fallback provided

## Error Handling

AuthGuard handles authentication errors gracefully:

- Network errors during auth check
- Invalid or expired tokens
- Authentication service failures

Error states show user-friendly messages and don't block the application.

## Performance Considerations

- Uses React hooks for efficient state management
- Prevents unnecessary redirects with loading state checks
- Integrates with AuthProvider's session management
- Minimal re-renders through proper dependency arrays

## Integration Notes

- Must be used within `AuthProvider` context
- Works with Next.js App Router navigation
- Compatible with Mantine UI components
- Follows TrueNamePath design system patterns
