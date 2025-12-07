'use client';

import { useEffect, useState } from 'react';
import dynamic from 'next/dynamic';
import Link from 'next/link';
import 'swagger-ui-react/swagger-ui.css';

// Dynamically import SwaggerUI to avoid SSR issues
const SwaggerUI = dynamic(() => import('swagger-ui-react'), { ssr: false });

export default function ApiDocsPage() {
  const [spec, setSpec] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    fetch('/api/docs')
      .then((res) => res.json())
      .then((data) => {
        setSpec(data);
        setLoading(false);
      })
      .catch((err) => {
        setError(err.message);
        setLoading(false);
      });
  }, []);

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
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
