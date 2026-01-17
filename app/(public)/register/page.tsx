import { Metadata } from 'next';
import { PublicPage } from '@/components/layout/PublicPage';
import { RegisterForm } from './components/RegisterForm';

export const metadata: Metadata = {
  title: 'Register | Resume Optimizer',
  description: 'Create a new account to start optimizing your professional resume.',
};

export default function RegisterPage() {
  return (
    <PublicPage className="flex items-center justify-center">
      <RegisterForm />
    </PublicPage>
  );
}
