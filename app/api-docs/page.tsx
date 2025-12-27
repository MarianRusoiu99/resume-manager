import { notFound } from 'next/navigation';
import { env } from '@/lib/config';
import ApiDocsClient from './ApiDocsClient';

export default function ApiDocsPage() {
  if (env.isProduction) {
    notFound();
  }

  return <ApiDocsClient />;
}
