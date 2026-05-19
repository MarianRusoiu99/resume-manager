import { describe, it, expect, vi, beforeEach, type MockedFunction } from 'vitest';
import { NextRequest, NextResponse } from 'next/server';
import { proxy } from '@/proxy';
import { env } from '@/lib/config/env';
import { cookies } from 'next/headers';

// Mock dependencies
vi.mock('next/headers', () => ({
  cookies: vi.fn(),
}));

const mockCookies = cookies as unknown as MockedFunction<typeof cookies>;

vi.mock('@/lib/auth/routes', () => ({
  DEFAULT_AUTH_REDIRECT: '/login',
  shouldSkipProxy: vi.fn((path) => path.includes('.') || path.startsWith('/_next')),
  isPublicPath: vi.fn((path) => path === '/login' || path === '/public'),
}));

describe('Proxy (Middleware)', () => {
  const mockRequest = (url: string, headers: Record<string, string> = {}) => {
    return new NextRequest(new URL(url, 'http://localhost:3000'), {
      headers: new Headers(headers),
    });
  };

  beforeEach(() => {
    vi.clearAllMocks();
    // Default env setup
    vi.spyOn(env, 'isProduction', 'get').mockReturnValue(false);
    
    // Default cookie mock to prevent TypeError: Cannot read properties of undefined (reading 'get')
    mockCookies.mockReturnValue(Promise.resolve({
      get: vi.fn().mockReturnValue(undefined)
    } as unknown as Request));
  });

  describe('Host Validation', () => {
    it('should allow any host if TRUSTED_HOSTS is empty', async () => {
      vi.spyOn(env, 'trustedHosts', 'get').mockReturnValue([]);
      const req = mockRequest('http://malicious.com/');
      const res = await proxy(req);
      
      expect(res.status).not.toBe(400);
    });

    it('should block untrusted hosts if TRUSTED_HOSTS is set', async () => {
      vi.spyOn(env, 'trustedHosts', 'get').mockReturnValue(['localhost:3000', 'myapp.com']);
      
      const req = mockRequest('http://malicious.com/', { host: 'malicious.com' });
      const res = await proxy(req);
      
      expect(res.status).toBe(400);
      const body = await res.text();
      expect(body).toBe('Invalid Host');
    });

    it('should allow trusted hosts if TRUSTED_HOSTS is set', async () => {
      vi.spyOn(env, 'trustedHosts', 'get').mockReturnValue(['localhost:3000', 'myapp.com']);
      
      const req = mockRequest('http://localhost:3000/', { host: 'localhost:3000' });
      const res = await proxy(req);
      
      expect(res.status).not.toBe(400);
    });
  });

  describe('Authentication Redirects', () => {
    it('should redirect unauthenticated users to login for protected routes', async () => {
      vi.spyOn(env, 'trustedHosts', 'get').mockReturnValue([]);
      // Mock no session cookie
      mockCookies.mockReturnValue(Promise.resolve({
        get: () => undefined
      } as unknown as Request));

      const req = mockRequest('http://localhost:3000/dashboard');
      const res = await proxy(req);
      
      expect(res.status).toBe(307); // Redirect
      expect(res.headers.get('location')).toContain('/login');
      expect(res.headers.get('location')).toContain('callbackUrl=%2Fdashboard');
    });

    it('should allow unauthenticated users to access public routes', async () => {
      vi.spyOn(env, 'trustedHosts', 'get').mockReturnValue([]);
      mockCookies.mockReturnValue(Promise.resolve({
        get: () => undefined
      } as unknown as Request));

      const req = mockRequest('http://localhost:3000/public');
      const res = await proxy(req);
      
      expect(res.status).toBe(200);
    });

    it('should allow authenticated users to access protected routes', async () => {
      vi.spyOn(env, 'trustedHosts', 'get').mockReturnValue([]);
      // Mock session cookie exists
      mockCookies.mockReturnValue(Promise.resolve({
        get: (name: string) => name === 'authjs.session-token' ? { value: 'valid-token' } : undefined
      } as unknown as Request));

      const req = mockRequest('http://localhost:3000/dashboard');
      const res = await proxy(req);
      
      expect(res.status).toBe(200);
    });
  });

  describe('CSP Headers', () => {
    it('should set Content-Security-Policy header', async () => {
      vi.spyOn(env, 'trustedHosts', 'get').mockReturnValue([]);
      mockCookies.mockReturnValue(Promise.resolve({
        get: () => ({ value: 'token' })
      } as unknown as Request));

      const req = mockRequest('http://localhost:3000/dashboard');
      const res = await proxy(req);
      
      expect(res.headers.get('Content-Security-Policy')).toBeDefined();
    });

    it('should use template editor CSP for template routes', async () => {
      vi.spyOn(env, 'trustedHosts', 'get').mockReturnValue([]);
      mockCookies.mockReturnValue(Promise.resolve({
        get: () => ({ value: 'token' })
      } as unknown as Request));

      const req = mockRequest('http://localhost:3000/templates/new');
      const res = await proxy(req);
      
      const csp = res.headers.get('Content-Security-Policy');
      expect(csp).toContain('https://cdn.jsdelivr.net');
    });
  });
});
