'use client';

import { useActionState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { registerAction } from '@/app/actions/auth';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Button } from '@/components/ui/button';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { PublicPage } from '@/components/layout/PublicPage';

export default function RegisterPage() {
  const router = useRouter();
  const [state, action, pending] = useActionState(registerAction, undefined);

  // Redirect on successful registration
  useEffect(() => {
    if (state?.success) {
      router.push('/login?registered=true');
    }
  }, [state?.success, router]);

  return (
    <PublicPage className="flex items-center justify-center">
      <Card className="w-full max-w-md">
        <CardHeader className="space-y-1">
          <CardTitle className="text-2xl font-bold text-center">
            Create your account
          </CardTitle>
          <CardDescription className="text-center">
            Already have an account?{' '}
            <Link
              href="/login"
              className="font-medium text-primary hover:underline"
            >
              Sign in
            </Link>
          </CardDescription>
        </CardHeader>

        <CardContent>
          <form action={action} className="space-y-4">
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
                autoComplete="new-password"
                required
                placeholder="••••••••"
                aria-describedby={state?.errors?.password ? 'password-error' : undefined}
              />
              {state?.errors?.password && (
                <div id="password-error" className="text-sm text-destructive">
                  <p>Password must:</p>
                  <ul className="list-disc list-inside">
                    {state.errors.password.map((error) => (
                      <li key={error}>{error}</li>
                    ))}
                  </ul>
                </div>
              )}
              <p className="text-xs text-muted-foreground">
                Must be at least 8 characters with a letter and number
              </p>
            </div>

            <Button type="submit" disabled={pending} className="w-full">
              {pending ? 'Creating account...' : 'Create account'}
            </Button>
          </form>
        </CardContent>
      </Card>
    </PublicPage>
  );
}
