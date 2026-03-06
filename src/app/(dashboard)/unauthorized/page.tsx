'use client';

export const dynamic = "force-dynamic"

import { useSearchParams } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { ShieldX, ArrowLeft, Home } from 'lucide-react';
import Link from 'next/link';
import { Suspense } from 'react';

function UnauthorizedContent() {
  const params = useSearchParams();
  const page     = params.get('page')     || 'this page';
  const required = params.get('required') || '';

  const levelNames: Record<string,string> = {
    '10': 'Super Admin', '9': 'Principal', '8': 'Vice Principal',
    '7': 'Administrator', '6': 'Accountant', '5': 'Coordinator',
    '4': 'Teacher', '3': 'Librarian', '2': 'Receptionist', '1': 'Parent',
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 to-slate-800 flex items-center justify-center p-6">
      <Card className="max-w-md w-full text-center shadow-2xl border-0">
        <CardContent className="p-10">
          {/* Icon */}
          <div className="h-24 w-24 rounded-full bg-red-100 flex items-center justify-center mx-auto mb-6">
            <ShieldX className="h-12 w-12 text-red-500" />
          </div>

          <h1 className="text-2xl font-bold text-gray-900 mb-2">Access Denied</h1>
          <p className="text-gray-500 mb-6">
            You don't have permission to access <strong>{page}</strong>.
            {required && (
              <span className="block mt-2 text-sm">
                Required role: <span className="font-semibold text-blue-600">{levelNames[required] || `Level ${required}+`}</span>
              </span>
            )}
          </p>

          <div className="bg-amber-50 border border-amber-200 rounded-xl p-4 mb-6 text-sm text-amber-700 text-left">
            <p className="font-semibold mb-1">💡 What can you do?</p>
            <ul className="space-y-1">
              <li>• Contact your system administrator</li>
              <li>• Request elevated permissions for your role</li>
              <li>• Return to the dashboard</li>
            </ul>
          </div>

          <div className="flex gap-3 justify-center">
            <Button variant="outline" asChild>
              <Link href="javascript:history.back()">
                <ArrowLeft className="h-4 w-4 mr-2" />Go Back
              </Link>
            </Button>
            <Button asChild>
              <Link href="/dashboard">
                <Home className="h-4 w-4 mr-2" />Dashboard
              </Link>
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}

export default function UnauthorizedPage() {
  return (
    <Suspense fallback={<div className="min-h-screen bg-slate-900 flex items-center justify-center"><div className="h-8 w-8 rounded-full border-4 border-white/20 border-t-white animate-spin" /></div>}>
      <UnauthorizedContent />
    </Suspense>
  );
}
