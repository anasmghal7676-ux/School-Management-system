'use client';
import { useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { AlertTriangle, RefreshCw } from 'lucide-react';

export default function GlobalError({ error, reset }: { error: Error & { digest?: string }; reset: () => void }) {
  useEffect(() => { console.error('Global error:', error); }, [error]);
  return (
    <html><body>
      <div className="min-h-screen flex items-center justify-center bg-gray-50 p-6">
        <div className="text-center max-w-md">
          <div className="h-20 w-20 rounded-full bg-red-100 flex items-center justify-center mx-auto mb-5">
            <AlertTriangle className="h-10 w-10 text-red-500" />
          </div>
          <h1 className="text-2xl font-bold text-gray-900 mb-2">Application Error</h1>
          <p className="text-gray-500 mb-6">{error.message || 'An unexpected error occurred. Please try again.'}</p>
          <Button onClick={() => reset()}><RefreshCw className="h-4 w-4 mr-2" />Try Again</Button>
        </div>
      </div>
    </body></html>
  );
}
