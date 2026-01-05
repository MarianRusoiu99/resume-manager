'use client';

import { useActionState, useEffect, Suspense } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import Link from 'next/link';
import { loginAction } from '@/app/actions/auth';
import { sanitizeCallbackUrl } from '@/lib/utils/redirects';
import { DEFAULT_LOGIN_REDIRECT } from '@/lib/auth/routes';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Button } from '@/components/ui/button';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { PublicPage } from '@/components/layout/PublicPage';

function LoginForm() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const callbackUrl = sanitizeCallbackUrl(searchParams.get('callbackUrl'), DEFAULT_LOGIN_REDIRECT);
  const registered = searchParams.get('registered');

  const [state, action, pending] = useActionState(loginAction, undefined);

  // Redirect on successful login
  useEffect(() => {
    if (state?.success) {
      router.push(callbackUrl);
      router.refresh();
    }
  }, [state?.success, callbackUrl, router]);

  return (
    <Card className="w-full max-w-md">
      <CardHeader className="space-y-1">
        <CardTitle className="text-2xl font-bold text-center">
          Sign in to Resume Manager
        </CardTitle>
        <CardDescription className="text-center">
          Or{' '}
          <Link
            href="/register"
            className="font-medium text-primary hover:underline"
          >
            create a new account
          </Link>
        </CardDescription>
      </CardHeader>

      <CardContent>
        <form action={action} className="space-y-4">
          {registered && (
            <Alert>
              <AlertDescription>
                Account created successfully. Please sign in.
              </AlertDescription>
            </Alert>
          )}

          {state?.message && !state.success && (
            <Alert variant="destructive">
              <AlertDescription>{state.message}</AlertDescription>
            </Alert>
          )}

          <div className="space-y-2">
            <Label htmlFor="email">Email address</Label>
            <Input
              id="email"
              name="email"
              type="email"
              autoComplete="email"
              required
              placeholder="you@example.com"
              aria-describedby={state?.errors?.email ? 'email-error' : undefined}
            />
            {state?.errors?.email && (
              <p id="email-error" className="text-sm text-destructive">
                {state.errors.email[0]}
              </p>
            )}
          </div>

          <div className="space-y-2">
            <Label htmlFor="password">Password</Label>
            <Input
              id="password"
              name="password"
              type="password"
              autoComplete="current-password"
              required
              placeholder="••••••••"
              aria-describedby={state?.errors?.password ? 'password-error' : undefined}
            />
            {state?.errors?.password && (
              <p id="password-error" className="text-sm text-destructive">
                {state.errors.password[0]}
              </p>
            )}
          </div>

          <Button type="submit" disabled={pending} className="w-full">
            {pending ? 'Signing in...' : 'Sign in'}
          </Button>
        </form>
      </CardContent>
    </Card>
  );
}

function LoginFormSkeleton() {
  return (
    <Card className="w-full max-w-md">
      <CardHeader className="space-y-1">
        <CardTitle className="text-2xl font-bold text-center">
          Sign in to Resume Manager
        </CardTitle>
        <CardDescription className="text-center">Loading...</CardDescription>
      </CardHeader>
      <CardContent>
        <div className="animate-pulse space-y-4">
          <div className="h-10 bg-muted rounded" />
          <div className="h-10 bg-muted rounded" />
          <div className="h-10 bg-muted rounded" />
        </div>
      </CardContent>
    </Card>
  );
}

export default function LoginPage() {
  return (
    <PublicPage className="flex items-center justify-center">
      <Suspense fallback={<LoginFormSkeleton />}>
        <LoginForm />
      </Suspense>
    </PublicPage>
  );
}
