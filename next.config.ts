import type { NextConfig } from 'next';
import bundleAnalyzer from '@next/bundle-analyzer';
import { env } from './lib/config/env';

const withBundleAnalyzer = bundleAnalyzer({
  enabled: env.shouldAnalyze,
});

const securityHeadersBase = [
  { key: 'X-Frame-Options', value: 'DENY' },
  { key: 'X-Content-Type-Options', value: 'nosniff' },
  { key: 'Referrer-Policy', value: 'strict-origin-when-cross-origin' },
  { key: 'Permissions-Policy', value: 'camera=(), microphone=(), geolocation=(), interest-cohort=()' },
  { key: 'X-DNS-Prefetch-Control', value: 'on' },
  { key: 'Strict-Transport-Security', value: 'max-age=31536000; includeSubDomains' },
];

const nextConfig: NextConfig = {
  output: 'standalone',
  transpilePackages: [
    '@blocknote/core',
    '@blocknote/react',
    '@blocknote/mantine',
    '@mantine/core',
    '@mantine/hooks',
    '@tiptap/extension-gapcursor',
    '@tiptap/extension-history',
    '@tiptap/extensions',
  ],
  serverExternalPackages: ['puppeteer', 'pdf-parse', 'pdfjs-dist', '@napi-rs/canvas'],
  experimental: {
    optimizePackageImports: ['lucide-react', '@radix-ui/react-icons'],
  },
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
