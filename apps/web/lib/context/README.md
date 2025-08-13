# AuthProvider Usage

## Basic Setup

Wrap your app with the AuthProvider in your root layout or app component:

```tsx
import { AuthProvider } from '@/lib/context';

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
<html lang="en">
  <body>
<AuthProvider>
  {children}
</AuthProvider>
  </body>
</html>
  );
}
```

## Using Authentication State

```tsx
import { useAuth } from '@/lib/context';

function LoginForm() {
  const { login, loading, error, isAuthenticated } = useAuth();
  
  const handleSubmit = async (email: string, password: string) => {
const response = await login(email, password);
if (response.user) {
  // Login successful
  router.push('/dashboard');
} else {
  // Handle error - error state is automatically set in context
  console.error('Login failed:', response.error?.message);
}
  };

  if (isAuthenticated) {
return <div>Already logged in!</div>;
  }

  return (
<form onSubmit={(e) => {
  e.preventDefault();
  const formData = new FormData(e.target as HTMLFormElement);
  handleSubmit(
formData.get('email') as string,
formData.get('password') as string
  );
}}>
  <input name="email" type="email" required />
  <input name="password" type="password" required />
  <button type="submit" disabled={loading}>
{loading ? 'Signing in...' : 'Sign In'}
  </button>
  {error && <p>Error: {error}</p>}
</form>
  );
}
```

## Accessing User Data

```tsx
function UserProfile() {
  const { user, logout } = useAuth();

  if (!user) {
return <div>Please log in</div>;
  }

  return (
<div>
  <h1>Welcome, {user.email}</h1>
  {user.profile && (
<p>Profile ID: {user.profile.id}</p>
  )}
  <button onClick={() => logout()}>
Sign Out
  </button>
</div>
  );
}
```

## Protected Route Component

```tsx
function ProtectedContent() {
  const { isAuthenticated, loading } = useAuth();

  if (loading) {
return <div>Loading...</div>;
  }

  if (!isAuthenticated) {
return <div>Access denied. Please log in.</div>;
  }

  return <div>Protected content here</div>;
}
```

## Integration with JWT Auth System

The AuthProvider automatically integrates with the existing JWT auth utilities from `@uni-final-project/database`:

- `signInWithPassword()` - For login functionality
- `signOut()` - For logout functionality  
- `getCurrentUser()` - For retrieving current user state
- `sessionUtils.onAuthStateChange()` - For listening to auth state changes

This provides a clean React context interface over the existing JWT-based authentication system.