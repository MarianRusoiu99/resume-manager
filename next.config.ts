import type { NextConfig } from "next";
import bundleAnalyzer from '@next/bundle-analyzer';
import { env } from './lib/config/env';

// Bundle analyzer configuration
const withBundleAnalyzer = bundleAnalyzer({
  enabled: env.shouldAnalyze,
});

/**
 * Security Headers Configuration
 *
 * Implements defense-in-depth security headers.
 * Note: CSP is set in `middleware.ts` because Next.js `headers()` routing
 * can't express a safe "catch-all except ..." without unsupported regex.
 */

const securityHeadersBase = [
  {
    key: 'X-Frame-Options',
    value: 'DENY',
  },
  {
    key: 'X-Content-Type-Options',
    value: 'nosniff',
  },
  {
    key: 'Referrer-Policy',
    value: 'strict-origin-when-cross-origin',
  },
  {
    key: 'Permissions-Policy',
    value: 'camera=(), microphone=(), geolocation=(), interest-cohort=()',
  },
  {
    key: 'X-DNS-Prefetch-Control',
    value: 'on',
  },
  {
    key: 'Strict-Transport-Security',
    value: 'max-age=31536000; includeSubDomains',
  },
];

const nextConfig: NextConfig = {
  output: 'standalone', // Enable for Docker builds

  // Transpile packages that use CSS imports in node_modules
  // Required for BlockNote and Mantine dependencies in Docker builds
  transpilePackages: [
    '@blocknote/core',
    '@blocknote/react',
    '@blocknote/mantine',
    '@mantine/core',
    '@mantine/hooks',
    '@tiptap/extension-gapcursor',
    '@tiptap/extension-history',
  ],

  // Avoid bundling large server-only dependencies into route chunks.
  // These are only needed at runtime in Node.js.
  serverExternalPackages: ['puppeteer', 'pdf-parse', 'pdfjs-dist', '@napi-rs/canvas'],

  experimental: {
    // Reduce import cost for packages with large export surfaces.
    optimizePackageImports: ['lucide-react', '@radix-ui/react-icons'],
  },

  // Apply security headers to routes.
  // CSP is applied in `middleware.ts`.
  async headers() {
    return [
      {
        source: '/:path*',
        headers: securityHeadersBase,
      },
    ];
  },
};

export default withBundleAnalyzer(nextConfig);
