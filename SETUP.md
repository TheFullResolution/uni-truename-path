# Complete Setup Guide

This guide walks you through setting up your production environment for the university final project. Follow these steps to deploy your monorepo to production with Supabase, Vercel, and GitHub Actions.

## 📋 Prerequisites

- [Node.js 18+](https://nodejs.org/)
- [Yarn 4.5+](https://yarnpkg.com/)
- [Git](https://git-scm.com/)
- [Docker Desktop](https://www.docker.com/products/docker-desktop/) (for local Supabase)
- GitHub account
- Vercel account
- Supabase account

## 🗄️ Supabase Setup

### 1. Create Supabase Project

1. Go to [supabase.com](https://supabase.com) and sign up/login
2. Click "New Project"
3. Choose organization and fill project details:
   - **Name**: `uni-final-project-prod`
   - **Database Password**: Generate a strong password
   - **Region**: Choose closest to your users
4. Wait for project creation (2-3 minutes)

### 2. Configure Database

1. **Get Project Credentials**
   ```bash
   # In your Supabase dashboard, go to Settings > API
   # Copy these values:
   SUPABASE_URL=https://your-project-ref.supabase.co
   SUPABASE_ANON_KEY=your-anon-key
   SUPABASE_SERVICE_ROLE_KEY=your-service-role-key
   ```

2. **Run Migrations**
   ```bash
   # Link your local project to Supabase
   supabase login
   supabase link --project-ref your-project-ref
   
   # Push your local schema to production
   supabase db push
   ```

3. **Configure Row Level Security**
   - Your migrations already include RLS policies
   - Verify in Supabase Dashboard > Authentication > Policies
   - Ensure policies are enabled for `profiles` and `names` tables

### 3. Setup Authentication (Optional)

If you plan to add user authentication:

1. **Configure Auth Providers** (Dashboard > Authentication > Providers)
   - Email/Password: Enabled by default
   - Google/GitHub: Configure OAuth if needed

2. **Email Templates** (Dashboard > Authentication > Email Templates)
   - Customize signup/reset password emails
   - Update redirect URLs to your domain

3. **Auth Settings** (Dashboard > Authentication > Settings)
   - **Site URL**: `https://your-app.vercel.app`
   - **Redirect URLs**: Add your production URLs

## 🚀 Vercel Deployment

### 1. Create Vercel Project

1. Go to [vercel.com](https://vercel.com) and login with GitHub
2. Click "New Project"
3. Import your GitHub repository
4. **Framework**: Next.js (auto-detected)
5. **Root Directory**: `apps/web`
6. Click "Deploy"

### 2. Configure Environment Variables

In Vercel Dashboard > Settings > Environment Variables, add:

```bash
# Production Database
SUPABASE_URL=https://your-project-ref.supabase.co
SUPABASE_ANON_KEY=your-anon-key

# Optional: Analytics, monitoring, etc.
NEXT_PUBLIC_APP_ENV=production
```

### 3. Build Settings

Vercel should auto-detect your monorepo. If not, configure:

- **Framework**: Next.js
- **Root Directory**: `apps/web`
- **Build Command**: `cd ../.. && yarn build --filter=uni-final-project-web`
- **Output Directory**: `apps/web/.next`

### 4. Domain Configuration

1. **Add Custom Domain** (optional)
   - Go to Vercel Dashboard > Domains
   - Add your custom domain
   - Configure DNS as instructed

2. **Update Supabase URLs**
   - Update auth redirect URLs in Supabase Dashboard
   - Add your production domain to allowed origins

## 🔐 GitHub Actions Setup

### 1. Repository Secrets

In GitHub repository > Settings > Secrets and Variables > Actions, add:

```bash
# Supabase
SUPABASE_ACCESS_TOKEN=your-access-token  # From Supabase Dashboard > Settings > Access Tokens
SUPABASE_URL=https://your-project-ref.supabase.co
SUPABASE_ANON_KEY=your-anon-key

# Vercel (Optional for deployment)
VERCEL_TOKEN=your-vercel-token   # From Vercel > Settings > Tokens
VERCEL_ORG_ID=your-org-id   # From vercel.json or CLI
VERCEL_PROJECT_ID=your-project-id   # From vercel.json or CLI
```

### 2. Supabase Access Token

1. Go to [Supabase Dashboard](https://supabase.com/dashboard) > Settings > Access Tokens
2. Click "Generate new token"
3. Name: `GitHub Actions CI`
4. Copy the token and add to GitHub secrets as `SUPABASE_ACCESS_TOKEN`

### 3. Enable GitHub Actions

Your repository already includes workflows in `.github/workflows/`:
- `ci.yml` - Runs tests on every push/PR
- `release.yml` - Deploys to production on main branch

The workflows will automatically:
- ✅ Run TypeScript compilation
- ✅ Run ESLint checks
- ✅ Run Playwright E2E tests
- ✅ Deploy to Vercel (if configured)

## 🔧 Environment Configuration

### Local Development (.env.local)

Create `apps/web/.env.local`:
```bash
# Local Supabase (when running supabase start)
SUPABASE_URL=http://127.0.0.1:54321
SUPABASE_ANON_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZS1kZW1vIiwicm9sZSI6ImFub24iLCJleHAiOjE5ODM4MTI5OTZ9.CRXP1A7WOeoJeXxjNni43kdQwgnWNReilDMblYTn_I0

# Development settings
NEXT_PUBLIC_APP_ENV=development
```

### Production Environment

Set in Vercel Dashboard > Settings > Environment Variables:
```bash
SUPABASE_URL=https://your-project-ref.supabase.co
SUPABASE_ANON_KEY=your-production-anon-key
NEXT_PUBLIC_APP_ENV=production
```

## 🧪 Testing Setup

### 1. Playwright Configuration

Your tests are configured to run against local Supabase by default. For CI:

1. **GitHub Actions** automatically starts Supabase
2. **Local testing** requires `supabase start`
3. **Custom test database** (optional):
   ```bash
   # Create separate test project in Supabase
   # Update playwright.config.ts with test credentials
   ```

### 2. Test Data Management

Your tests automatically:
- ✅ Create test data before each test
- ✅ Clean up after each test
- ✅ Use isolated test scenarios
- ✅ Test real database operations

## 📊 Monitoring & Analytics

### 1. Supabase Analytics

- **Dashboard**: Monitor database performance
- **Logs**: Real-time application logs
- **Auth**: User authentication metrics

### 2. Vercel Analytics

- **Performance**: Core Web Vitals
- **Usage**: Page views and user behavior
- **Errors**: Runtime error tracking

### 3. Optional Third-Party Tools

Consider adding:
- **Sentry**: Error monitoring
- **LogRocket**: Session replay
- **Posthog**: Product analytics

## 🚦 Deployment Checklist

### Before First Deployment

- [ ] Supabase project created and configured
- [ ] Database migrations applied
- [ ] Environment variables set in Vercel
- [ ] GitHub secrets configured
- [ ] Domain configured (if using custom domain)

### Pre-Production Testing

```bash
# Local testing
supabase start
yarn dev
yarn test:e2e

# Build verification
yarn build
yarn type-check
yarn lint
```

### Post-Deployment Verification

- [ ] App loads at production URL
- [ ] Database connectivity works
- [ ] Authentication flows (if implemented)
- [ ] All features functional
- [ ] Performance metrics acceptable

## 🆘 Troubleshooting

### Common Issues

1. **Build Failures**
   ```bash
   # Clear cache and rebuild
   yarn clean
   rm -rf node_modules
   yarn install
   yarn build
   ```

2. **Database Connection Issues**
   - Verify environment variables
   - Check Supabase project status
   - Ensure RLS policies allow access

3. **Import/Package Issues**
   ```bash
   # Rebuild workspace packages
   yarn install
   turbo run build --force
   ```

4. **Test Failures**
   ```bash
   # Check if Supabase is running
   supabase status
   
   # Reset database
   supabase db reset
   yarn db:types
   ```

### Getting Help

- **Supabase**: [docs.supabase.com](https://docs.supabase.com)
- **Vercel**: [vercel.com/docs](https://vercel.com/docs)
- **Next.js**: [nextjs.org/docs](https://nextjs.org/docs)
- **Playwright**: [playwright.dev](https://playwright.dev)

## 🎯 Next Steps

After completing this setup:

1. **Add Features**: Implement your application logic
2. **Customize UI**: Build your user interface with Mantine
3. **Add Authentication**: Implement user login/signup
4. **Optimize Performance**: Monitor and improve app speed
5. **Scale Infrastructure**: Upgrade Supabase/Vercel plans as needed

Your production-ready infrastructure is now set up! 🎉