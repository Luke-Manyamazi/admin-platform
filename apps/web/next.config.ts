import type { NextConfig } from 'next';

/**
 * Next.js configuration for the ADMIN Connect buyer portal.
 *
 * Port: 3000
 * API Gateway: http://localhost:3001/api/v1
 */
const nextConfig: NextConfig = {
  reactStrictMode: true,

  // Transpile monorepo packages so Next.js can process their TypeScript
  transpilePackages: ['@admin-platform/ui', '@admin-platform/types'],

  // Allow images from AWS S3 (factory documents, profile photos)
  images: {
    remotePatterns: [
      {
        protocol: 'https',
        hostname: '**.amazonaws.com',
        pathname: '/**',
      },
    ],
  },

  // Forward API requests — avoids CORS in browser during development
  async rewrites() {
    return [
      {
        source: '/api/proxy/:path*',
        destination: `${process.env['NEXT_PUBLIC_API_URL'] ?? 'http://localhost:3001/api/v1'}/:path*`,
      },
    ];
  },
};

export default nextConfig;
