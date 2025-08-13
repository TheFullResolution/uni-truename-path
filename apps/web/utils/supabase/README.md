# Official Supabase SSR Utils

This directory contains official Supabase SSR patterns matching the exact documentation patterns.

## Files

- **`client.ts`** - Browser client using `createBrowserClient`
- **`server.ts`** - Server client using `createServerClient` with Next.js cookies
- **`middleware.ts`** - Middleware helper with `updateSession` and route protection

## Usage

### Browser Components

```typescript
import { createClient } from '@/utils/supabase/client';

export default function Page() {
  const supabase = createClient();
  // Use supabase client in browser components
}
```

### Server Components

```typescript
import { createClient } from '@/utils/supabase/server';

export default async function Page() {
  const supabase = await createClient();
  // Use supabase client in server components
}
```

### Middleware

```typescript
import { updateSession } from '@/utils/supabase/middleware';

export async function middleware(request) {
  return await updateSession(request);
}
```

## Environment Variables

Uses consistent `NEXT_PUBLIC_*` variables:

- `NEXT_PUBLIC_SUPABASE_URL`
- `NEXT_PUBLIC_SUPABASE_ANON_KEY`

## Route Protection

The middleware automatically protects these routes:

- `/dashboard/*`
- `/profile/*`
- `/settings/*`
- `/contexts/*`

Public routes (no authentication required):

- `/auth/login`
- `/auth/signup`
- `/auth/forgot-password`
- `/demo`
- `/`

## Migration from Legacy

The `@uni-final-project/database` package still provides the legacy client functions for backward compatibility, but new code should use these official patterns.
