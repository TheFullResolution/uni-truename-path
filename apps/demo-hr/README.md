# Demo HR Application

**Status**: Architecture Planning Phase (Step 16.4.0)  
**Purpose**: Demonstrate TrueNamePath OAuth integration in a professional HR context

### Technical Configuration

**Port**: 4000 (fixed assignment to avoid collisions)  
**App Name**: `demo-hr` (consistent kebab-case naming)  
**Tech Stack**: Vite + React 19 + TypeScript  
**Domain (dev)**: `localhost:4000`  
**Domain (prod)**: `demo-hr-truename.vercel.app`

### Port Allocation Strategy

- **Port 3000**: TrueNamePath main web app
- **Port 4000**: Demo HR app (this app) - **FIXED**
- **Port 4001**: Reserved for Demo Chat app

---

## Project Overview

The Demo HR app showcases TrueNamePath's context-aware identity management in a professional Human Resources environment. It demonstrates how applications can integrate with TrueNamePath's OAuth 2.0 system to receive context-appropriate names for employees, respecting user preferences while meeting business requirements.

**Key Features**:

- OAuth 2.0 integration with TrueNamePath API
- Professional context demonstration (HR use case)
- OIDC-compliant identity resolution
- Context-aware name display
- Simple two-page architecture

---

## Architecture Plan

### Core Components

#### 1. **App.tsx** - Main Application Router

```
📁 src/
├── App.tsx # Main app with routing logic
├── main.tsx   # Vite entry point
└── components/
├── LoginPage.tsx  # OAuth landing page
├── Dashboard.tsx  # HR dashboard interface
└── utils/
└── oauth.ts   # OAuth integration utilities
```

#### 2. **LoginPage Component** - OAuth Landing Page

- **Purpose**: Professional landing page with TrueNamePath branding
- **Features**:
  - "Sign in with TrueNamePath" OAuth button
  - HR-focused messaging and value proposition
  - Professional styling distinct from TrueNamePath main app
  - App description and context explanation

#### 3. **Dashboard Component** - HR Interface

- **Purpose**: Authenticated dashboard displaying employee identity information
- **Features**:
  - Full OIDC claims display (`sub`, `name`, `given_name`, `family_name`, `nickname`, `preferred_username`)
  - Professional context demonstration for HR use case
  - Context-aware identity presentation
  - Logout functionality
  - Clean, professional UI suitable for HR environments

#### 4. **OAuth Utilities** - Integration Library

- **File**: `utils/oauth.ts`
- **Purpose**: Abstraction layer for TrueNamePath OAuth integration
- **Features**:
  - Client ID registration and management
  - Token exchange and storage (localStorage)
  - Bearer token authentication
  - Complete OIDC claims resolution
  - Error handling and validation

---

## Development Plan

### Implementation Epic Steps

The Demo HR app will be implemented across the following sequential steps:

#### **16.4.1 - Landing Page** 🔲

- Create professional landing page with HR branding
- Implement "Sign in with TrueNamePath" OAuth button
- Add contextual messaging about HR identity management
- Apply professional styling and responsive design

#### **16.4.2 - OAuth Integration Library** 🔲

- Create `truename-oauth.ts` helper library
- Implement client ID registration flow
- Add token exchange and management logic
- Create authentication state utilities
- Add localStorage session management

#### **16.4.3 - OAuth Callback Handler** 🔲

- Create `/callback` route component
- Extract and validate OAuth tokens from URL parameters
- Exchange session token for full OIDC claims via Bearer authentication
- Parse complete OIDC response with all 6 standard properties
- Store user data locally for dashboard display

#### **16.4.4 - HR Dashboard Page** 🔲

- Create authenticated dashboard interface
- Display complete OIDC claims object professionally
- Show context-appropriate identity information for HR use case
- Demonstrate professional name display (`display_name`, `given_name`, `family_name`)
- Implement logout and session management

#### **16.4.5 - Professional Styling** 🔲

- Apply professional HR theme and branding
- Ensure visual distinction from TrueNamePath main application
- Implement responsive design for various screen sizes
- Create consistent visual hierarchy and typography

#### **16.4.6 - Production Deployment** 🔲

- Configure Vercel deployment pipeline
- Set up environment variables for production
- Deploy to `demo-hr-truename.vercel.app`
- Validate production OAuth flow end-to-end

---

## Technical Implementation

### OAuth Integration Flow

```
1. Landing Page → GET /api/oauth/apps/demo-hr
   ← Returns client_id for (demo-hr.vercel.app, demo-hr)

2. OAuth Button → Redirect to:
   /auth/oauth-authorize?client_id=tnp_xxx&return_url=...&state=...

3. User Context Selection → POST /api/oauth/authorize
   ← Returns redirect_url with session token

4. Callback Handler → POST /api/oauth/resolve
   Authorization: Bearer tnp_[session_token]
   ← Returns complete OIDC claims object
```

### Client Configuration

```typescript
// OAuth configuration
const config = {
  appName: 'demo-hr',
  apiBaseUrl: process.env.VITE_TRUENAME_API_URL || 'http://localhost:3000',
  redirectUri: `${window.location.origin}/callback`,
  scopes: ['profile', 'name'],
};

// Client ID registration
const clientResponse = await fetch(
  `${config.apiBaseUrl}/api/oauth/apps/${config.appName}`,
  {
headers: { Origin: window.location.origin },
  },
);
```

### OIDC Claims Structure

```typescript
interface OIDCClaims {
  sub: string; // User identifier
  name: string; // Full display name
  given_name: string; // First name
  family_name: string; // Last name
  nickname: string; // Informal name
  preferred_username: string; // Username/handle
}
```

---

## Configuration Management

All configuration is managed through TypeScript constants in `/src/config.ts`:

```typescript
// Development configuration
APP_CONFIG.APP_NAME = 'demo-hr';
APP_CONFIG.DOMAIN.DEV = 'localhost:4000';
TRUENAME_API.BASE_URL.DEV = 'http://localhost:3000';

// Production configuration
APP_CONFIG.DOMAIN.PROD = 'demo-hr-truename.vercel.app';
TRUENAME_API.BASE_URL.PROD = 'https://truename.path';
```

**No environment variables needed** - configuration is compile-time constants for simplicity.

---

## OAuth Client ID System

### Client Registration

The Demo HR app uses TrueNamePath's OAuth client ID system:

- **Client ID Format**: `tnp_[16 hex chars]` (e.g., `tnp_8a61f9b3a7aba766`)
- **Identity Key**: `(publisher_domain, app_name)` tuple
- **Dynamic Registration**: Automatic client ID generation on first access
- **Security**: Domain verification via Origin/Referer headers

### Session Management

- **Session Tokens**: `tnp_[32 hex chars]` format
- **Token TTL**: 2 hours
- **Storage**: localStorage for demo purposes
- **Authentication**: Bearer token for API calls

---

## Development Commands

```bash
# Development server (port 3001)
yarn dev

# Production build
yarn build

# Preview production build
yarn preview

# Type checking
yarn type-check

# Linting (to be configured)
yarn lint
```

---

## Academic Context

This is a university final project demonstrating advanced web design principles:

- **OAuth 2.0 Integration**: Industry-standard authentication protocol
- **Context-Aware Identity**: Dynamic name resolution based on application context
- **GDPR Compliance**: Privacy-by-design data handling
- **Modern React**: React 19 with TypeScript and functional components
- **Professional UI/UX**: HR-appropriate interface design

The application prioritizes technical demonstration over production concerns, focusing on clean architecture, modern development practices, and innovative identity management concepts.

---

## Security Considerations

- **Domain Verification**: Origin headers validate app identity
- **Token Security**: Cryptographically random session tokens with expiry
- **CSRF Protection**: State parameter validation in OAuth flow
- **Data Minimization**: Only request necessary OIDC claims
- **Local Storage**: Session tokens stored client-side (demo only)

---

## Next Steps

1. **Step 16.4.1**: Implement professional landing page with OAuth integration
2. **Step 16.4.2**: Create OAuth utility library for TrueNamePath integration
3. **Step 16.4.3**: Build callback handler for token exchange
4. **Step 16.4.4**: Develop HR dashboard with OIDC claims display

**Goal**: Complete functional demo application showcasing context-aware identity management for HR use cases, ready for academic presentation and evaluation.
