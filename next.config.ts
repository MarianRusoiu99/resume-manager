import type { NextConfig } from "next";
import bundleAnalyzer from '@next/bundle-analyzer';

// Bundle analyzer configuration
const withBundleAnalyzer = bundleAnalyzer({
  enabled: process.env.ANALYZE === 'true',
});

/**
 * Security Headers Configuration
 * 
 * Implements defense-in-depth security headers:
 * - CSP: Controls resource loading
 * - X-Frame-Options: Prevents clickjacking
 * - X-Content-Type-Options: Prevents MIME sniffing
 * - Referrer-Policy: Controls referrer information
 * - Permissions-Policy: Restricts browser features
 */
const securityHeaders = [
  {
    key: 'Content-Security-Policy',
    value: [
      "default-src 'self'",
      // Scripts: self + inline (required for Next.js) + Monaco CDN
      "script-src 'self' 'unsafe-eval' 'unsafe-inline' https://cdn.jsdelivr.net",
      // Styles: self + inline (required for styled components and dynamic styles) + Monaco CDN
      "style-src 'self' 'unsafe-inline' https://cdn.jsdelivr.net",
      // Images: self + data URIs (for inline images) + https (for external images)
      "img-src 'self' data: https:",
      // Fonts: self + Google Fonts + Monaco CDN
      "font-src 'self' https://fonts.gstatic.com https://cdn.jsdelivr.net",
      // Connections: self + OpenAI API + other allowed APIs + Monaco CDN
      "connect-src 'self' https://api.openai.com https://fonts.googleapis.com https://cdn.jsdelivr.net",
      // Workers: self + blob (required for Monaco Editor web workers)
      "worker-src 'self' blob:",
      // Frames: none (prevent embedding in iframes)
      "frame-ancestors 'none'",
      // Forms: self only
      "form-action 'self'",
      // Base URI: self only
      "base-uri 'self'",
      // Object: none (no plugins)
      "object-src 'none'",
    ].join('; '),
  },
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
  
  // Apply security headers to all routes
  async headers() {
    return [
      {
        // Apply to all routes
        source: '/:path*',
        headers: securityHeaders,
      },
    ];
  },
};

export default withBundleAnalyzer(nextConfig);
