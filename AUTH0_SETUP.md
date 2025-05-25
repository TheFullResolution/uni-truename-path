# Auth0 Integration Setup for TrueNamePath

This guide explains how to integrate Auth0 with TrueNamePath for academic demonstration purposes.

## 🎯 Purpose in Academic Context

Auth0 provides the JWT tokens that carry audience (`aud`) and scope information to the TrueNamePath context engine. This demonstrates enterprise-grade identity federation while keeping the focus on your novel name resolution logic.

## 🔧 Auth0 Setup Steps

### 1. Create Auth0 Application

1. Go to [auth0.com](https://auth0.com) and create account
2. Create new application:
   - **Name**: `TrueNamePath Demo`
   - **Type**: Single Page Application
   - **Technology**: React

### 2. Configure Application Settings

In Auth0 Dashboard > Applications > TrueNamePath Demo:

```bash
# Application Settings
Allowed Callback URLs: http://localhost:3000/api/auth/callback
Allowed Logout URLs: http://localhost:3000
Allowed Web Origins: http://localhost:3000
```

### 3. Environment Variables

Add to `apps/web/.env.local`:
```bash
# Auth0 Configuration
AUTH0_SECRET='your-32-character-secret'
AUTH0_BASE_URL='http://localhost:3000'
AUTH0_ISSUER_BASE_URL='https://your-tenant.auth0.com'
AUTH0_CLIENT_ID='your-client-id'
AUTH0_CLIENT_SECRET='your-client-secret'

# Custom scopes for TrueNamePath
AUTH0_SCOPE='openid profile email'
```

### 4. Install Auth0 SDK

```bash
cd apps/web
yarn add @auth0/nextjs-auth0
```

### 5. Create Auth0 API Route

Create `apps/web/app/api/auth/[...auth0]/route.ts`:
```typescript
import { handleAuth } from '@auth0/nextjs-auth0';

export const GET = handleAuth();
```

### 6. Add Auth0 Provider

Update `apps/web/app/layout.tsx`:
```typescript
import { UserProvider } from '@auth0/nextjs-auth0/client';

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
<html lang="en">
  <body>
<UserProvider>
  <MantineProvider theme={theme}>
{children}
  </MantineProvider>
</UserProvider>
  </body>
</html>
  );
}
```

## 🧪 Academic Demonstration

### Testing Different Audiences

Create test users in Auth0 with custom claims:

```typescript
// Auth0 Action: Add Custom Claims
exports.onExecutePostLogin = async (event, api) => {
  const namespace = 'https://truename.path/';
  
  // Add audience-specific claims
  if (event.user.email?.includes('hr')) {
api.accessToken.setCustomClaim(`${namespace}audience`, 'hr');
  } else if (event.user.email?.includes('slack')) {
api.accessToken.setCustomClaim(`${namespace}audience`, 'slack');
  }
  
  api.accessToken.setCustomClaim(`${namespace}purpose`, 'demo');
};
```

### Demo Component with Auth

```typescript
import { useUser } from '@auth0/nextjs-auth0/client';

export default function AuthenticatedDemo() {
  const { user, error, isLoading } = useUser();

  if (isLoading) return <div>Loading...</div>;
  if (error) return <div>{error.message}</div>;

  if (user) {
return (
  <div>
<h2>Welcome {user.name}</h2>
<TrueNamePathDemo audience={user['https://truename.path/audience']} />
  </div>
);
  }

  return <a href="/api/auth/login">Login</a>;
}
```

## 🎓 Academic Benefits

1. **Industry Standard**: Demonstrates knowledge of OAuth 2.0/OIDC
2. **Separation of Concerns**: Auth0 handles identity, TrueNamePath handles name resolution
3. **Real JWTs**: Actual signed tokens with audience claims
4. **Scalable Pattern**: Shows how enterprise systems integrate identity providers

## 📋 Testing Checklist

- [ ] Login/logout flows work
- [ ] JWT tokens contain custom audience claims
- [ ] TrueNamePath context engine receives and validates tokens
- [ ] Different users see appropriate name variants
- [ ] Audit log captures authentication context

## 🔒 Security Notes

- Auth0 handles password policies and MFA
- JWT tokens are signed and validated
- Custom claims carry audience context securely
- Session management follows Auth0 best practices

This setup demonstrates enterprise-grade identity integration while keeping your academic focus on the novel name resolution algorithm.