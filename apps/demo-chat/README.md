# Demo Chat Application

Modern chat platform showcasing TrueNamePath OAuth integration with real-time messaging capabilities and context-aware identity resolution.

## Overview

This demo application demonstrates how chat platforms can integrate with TrueNamePath's OAuth system to provide context-aware name resolution. Users can appear with different names based on the context (professional, personal, gaming, etc.) within the same chat platform.

## Features (Planned)

- **OAuth 2.0 Integration**: Seamless authentication with TrueNamePath
- **Context-Aware Identities**: Display appropriate names based on chat context
- **Real-time Messaging**: Modern chat interface with instant messaging
- **Identity Resolution**: Automatic name resolution based on user consent and context
- **Modern UI**: Clean, responsive interface built with Mantine components

## Technology Stack

- **Frontend**: React 19 + TypeScript
- **Build Tool**: Vite
- **UI Framework**: Mantine UI 8.2.4
- **Styling**: PostCSS with Mantine preset
- **Development Port**: 4001

## Development

### Prerequisites

- Node.js (LTS version recommended)
- yarn package manager

### Getting Started

1. Navigate to the demo-chat directory:

   ```bash
   cd apps/demo-chat
   ```

2. Install dependencies:

   ```bash
   yarn install
   ```

3. Start the development server:

   ```bash
   yarn dev
   ```

4. Open your browser and navigate to:
   ```
   http://localhost:4001
   ```

### Available Scripts

- `yarn dev` - Start development server (port 4001)
- `yarn build` - Build for production
- `yarn preview` - Preview production build
- `yarn type-check` - Run TypeScript type checking
- `yarn lint` - Run linting (to be configured)
- `yarn test` - Run tests (to be configured)

## Configuration

The application configuration is managed in `src/config.ts`:

- **App Name**: `demo-chat`
- **Development Port**: `4001`
- **Production Domain**: `demo-chat-truename.vercel.app`
- **OAuth Scope**: `openid profile`

## Project Status

**Current Phase**: Scaffolding Complete ✅
**Next Phase**: OAuth Integration (Step 16.x)

This application is part of the TrueNamePath university project demonstrating advanced OAuth integration patterns for chat platforms.

## Notes

- Runs on port 4001 to avoid conflicts with main app (3000) and demo-hr (4000)
- Styling and detailed OAuth functionality will be implemented in subsequent steps
- Part of the broader TrueNamePath ecosystem demonstrating context-aware identity management
