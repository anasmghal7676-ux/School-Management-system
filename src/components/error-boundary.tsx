'use client';

import React, { Component, ReactNode } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { AlertTriangle, RefreshCw, Home } from 'lucide-react';
import Link from 'next/link';

interface Props { children: ReactNode; fallback?: ReactNode; pageName?: string; }
interface State { hasError: boolean; error?: Error; errorInfo?: string; }

export class ErrorBoundary extends Component<Props, State> {
  constructor(props: Props) {
    super(props);
    this.state = { hasError: false };
  }

  static getDerivedStateFromError(error: Error): State {
    return { hasError: true, error };
  }

  componentDidCatch(error: Error, info: React.ErrorInfo) {
    console.error('ErrorBoundary caught:', error, info);
    this.setState({ errorInfo: info.componentStack || '' });
  }

  render() {
    if (this.state.hasError) {
      if (this.props.fallback) return this.props.fallback;

      return (
        <div className="p-6 flex items-center justify-center min-h-[400px]">
          <Card className="max-w-md w-full border-red-200">
            <CardContent className="p-8 text-center">
              <div className="h-16 w-16 rounded-full bg-red-100 flex items-center justify-center mx-auto mb-4">
                <AlertTriangle className="h-8 w-8 text-red-500" />
              </div>
              <h2 className="text-lg font-bold text-gray-900 mb-2">Something went wrong</h2>
              <p className="text-sm text-gray-500 mb-2">
                {this.props.pageName ? `Error loading ${this.props.pageName}` : 'An unexpected error occurred'}
              </p>
              {this.state.error && (
                <p className="text-xs font-mono bg-red-50 text-red-700 p-3 rounded-lg mb-4 text-left break-all">
                  {this.state.error.message}
                </p>
              )}
              <div className="flex gap-3 justify-center">
                <Button variant="outline" onClick={() => this.setState({ hasError: false, error: undefined })}>
                  <RefreshCw className="h-4 w-4 mr-2" />Try Again
                </Button>
                <Button asChild>
                  <Link href="/dashboard"><Home className="h-4 w-4 mr-2" />Dashboard</Link>
                </Button>
              </div>
            </CardContent>
          </Card>
        </div>
      );
    }
    return this.props.children;
  }
}

// Simpler functional wrapper for pages
export function PageErrorBoundary({ children, pageName }: { children: ReactNode; pageName?: string }) {
  return <ErrorBoundary pageName={pageName}>{children}</ErrorBoundary>;
}
