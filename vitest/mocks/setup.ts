// Setup mocks for Next.js modules that don't work in vitest

import { vi } from 'vitest';

// Mock server-only - it does nothing in tests
vi.mock('server-only', () => ({}));

// Mock next/navigation for client components
vi.mock('next/navigation', () => ({
  useRouter: () => ({
    push: vi.fn(),
    replace: vi.fn(),
    prefetch: vi.fn(),
    back: vi.fn(),
  }),
  useSearchParams: () => ({
    get: vi.fn(),
  }),
  useParams: () => ({}),
  usePathname: () => '/',
  redirect: vi.fn((url: string) => {
    throw new Error(`Redirect to: ${url}`);
  }),
  notFound: vi.fn(() => {
    throw new Error('Not found');
  }),
}));

// Mock next/headers for server components
vi.mock('next/headers', () => ({
  cookies: vi.fn(),
  headers: vi.fn(),
}));
