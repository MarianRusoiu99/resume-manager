import { Suspense } from 'react';
import { Metadata } from 'next';
import { PublicPage } from '@/components/layout/PublicPage';
import { LoginForm, LoginFormSkeleton } from './components/LoginForm';

export const metadata: Metadata = {
  title: 'Login | Resume Optimizer',
  description: 'Sign in to your account to manage and optimize your resumes.',
};

export default function LoginPage() {
  return (
    <PublicPage className="flex items-center justify-center">
      <Suspense fallback={<LoginFormSkeleton />}>
        <LoginForm />
      </Suspense>
    </PublicPage>
  );
}
