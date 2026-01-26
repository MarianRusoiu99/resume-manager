import { defineConfig } from 'vitest/config';
import react from '@vitejs/plugin-react';
import path from 'path';

// Plugin to mock server-only module during import analysis
function mockServerOnly() {
  return {
    name: 'mock-server-only',
    enforce: 'pre' as const,
    resolveId(source: string) {
      if (source === 'server-only') {
        return { id: 'virtual:server-only' };
      }
    },
    load(id: string) {
      if (id === 'virtual:server-only') {
        return '';
      }
    },
  };
}

export default defineConfig({
  plugins: [react(), mockServerOnly()],
  test: {
    environment: 'jsdom',
    globals: true,
    setupFiles: ['./vitest.setup.ts', './lib/test/setup.ts'],
    testTimeout: 10000,
    exclude: [
      'node_modules/**',
      '.next/**',
      'dist/**',
      'coverage/**',
      'components/error-boundaries/ErrorBoundary.test.tsx',
    ],
    coverage: {
      provider: 'v8',
      reporter: ['text', 'json', 'html'],
      exclude: [
        'node_modules/',
        '.next/',
        'coverage/',
        '**/*.config.*',
        '**/*.d.ts',
        '**/types.ts',
      ],
      thresholds: {
        lines: 70,
        functions: 70,
        branches: 70,
        statements: 70,
      },
    },
  },
  resolve: {
    alias: {
      '@': path.resolve(__dirname, './'),
      '@/lib': path.resolve(__dirname, './lib'),
      '@/app': path.resolve(__dirname, './app'),
    },
  },
});
