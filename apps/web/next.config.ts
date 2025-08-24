import type { NextConfig } from 'next';

const nextConfig: NextConfig = {
  reactStrictMode: true,

  // Enable typed routes for compile-time type safety
  typedRoutes: true,

  experimental: {
optimizePackageImports: ['@mantine/core', '@mantine/hooks'],
  },

  async headers() {
return [
  {
// Apply security headers to API routes
source: '/api/:path*',
headers: [
  {
key: 'X-Content-Type-Options',
value: 'nosniff',
  },
  {
key: 'X-Frame-Options',
value: 'DENY',
  },
  {
key: 'X-XSS-Protection',
value: '1; mode=block',
  },
  {
key: 'Referrer-Policy',
value: 'strict-origin-when-cross-origin',
  },
  {
key: 'Permissions-Policy',
value: 'camera=(), microphone=(), geolocation=()',
  },
],
  },
];
  },
};

export default nextConfig;
