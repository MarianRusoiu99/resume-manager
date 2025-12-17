'use client';

import { useEffect, useState } from 'react';
import dynamic from 'next/dynamic';
import Link from 'next/link';
import { apiV1 } from '@/lib/client';
import { Spinner } from '@/components/shared';
import { apiFetch } from '@/lib/utils/api-client';
import 'swagger-ui-react/swagger-ui.css';

// Dynamically import SwaggerUI to avoid SSR issues
const SwaggerUI = dynamic(() => import('swagger-ui-react'), { ssr: false });

export default function ApiDocsPage() {
  const [spec, setSpec] = useState<Record<string, unknown> | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const load = async () => {
      try {
        const response = await apiFetch(apiV1.DOCS.url);
        if (!response.ok) {
          throw new Error((await response.text()) || 'Failed to load documentation');
        }
        const data = (await response.json()) as Record<string, unknown>;
        setSpec(data);
        // NOTE: docs endpoint is public; apiFetch keeps behavior consistent.
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Failed to load documentation');
      } finally {
        setLoading(false);
      }
    };

    load();
  }, []);

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <Spinner className="mx-auto mb-4" />
          <p className="text-gray-600">Loading API Documentation...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <h1 className="text-2xl font-bold text-red-600 mb-4">Error Loading Documentation</h1>
          <p className="text-gray-600">{error}</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-white">
      <div className="border-b bg-linear-to-r from-blue-600 to-blue-700 text-white">
        <div className="container mx-auto px-4 py-6">
          <h1 className="text-3xl font-bold mb-2">AI Resume Manager API</h1>
          <p className="text-blue-100">
            Interactive API documentation for developers. Test endpoints directly from your browser.
          </p>
        </div>
      </div>

      <div className="container mx-auto">
        {spec && <SwaggerUI spec={spec} />}
      </div>

      <footer className="border-t mt-8 py-6 bg-gray-50">
        <div className="container mx-auto px-4 text-center text-gray-600 text-sm">
          <p className="mb-2">
            <strong>Note:</strong> Most endpoints require authentication via NextAuth.js session cookies.
            Login through the main application before testing protected endpoints.
          </p>
          <p>
            Rate Limit: 5 requests per minute per endpoint |
            <Link href="/" className="text-blue-600 hover:underline ml-1">Back to Application</Link>
          </p>
        </div>
      </footer>
    </div>
  );
}
