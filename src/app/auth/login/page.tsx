'use client';

import { useState } from 'react';
import { signIn } from 'next-auth/react';
import { useRouter, useSearchParams } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Loader2, School, Lock, User, AlertCircle, Eye, EyeOff, ChevronRight } from 'lucide-react';
import { Suspense } from 'react';

const DEMO_ACCOUNTS = [
  { label: 'Super Admin',  username: 'admin',        role: 'Full access' },
  { label: 'Principal',    username: 'principal',    role: 'School management' },
  { label: 'Accountant',   username: 'accountant',   role: 'Finance only' },
  { label: 'Teacher',      username: 'teacher1',     role: 'Marks & attendance' },
  { label: 'Receptionist', username: 'receptionist', role: 'Front desk' },
];

function LoginForm() {
  const router       = useRouter();
  const searchParams = useSearchParams();
  const callbackUrl  = searchParams.get('callbackUrl') || '/dashboard';
  const [loading,  setLoading]  = useState(false);
  const [error,    setError]    = useState('');
  const [showPw,   setShowPw]   = useState(false);
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault(); setError(''); setLoading(true);
    try {
      const result = await signIn('credentials', { username, password, redirect: false });
      if (result?.error) setError('Invalid username or password.');
      else if (result?.ok) { router.push(callbackUrl); router.refresh(); }
    } catch { setError('Unexpected error.'); } finally { setLoading(false); }
  };

  return (
    <div className="min-h-screen flex bg-gradient-to-br from-slate-900 via-blue-950 to-slate-900">
      <div className="hidden lg:flex flex-col justify-between w-2/5 p-12 bg-gradient-to-b from-blue-600 to-blue-800 text-white">
        <div className="flex items-center gap-3">
          <div className="h-10 w-10 rounded-xl bg-white/20 flex items-center justify-center"><School className="h-6 w-6 text-white" /></div>
          <span className="font-bold text-lg">Al-Noor Academy</span>
        </div>
        <div>
          <h1 className="text-4xl font-bold mb-4 leading-tight">School Management System</h1>
          <p className="text-blue-100 text-lg">Complete administration solution for modern schools.</p>
          <div className="grid grid-cols-2 gap-3 mt-8">
            {['173 Modules','244 API Routes','PDF Generation','Role-Based Access'].map(f => (
              <div key={f} className="bg-white/10 rounded-xl p-3 text-sm font-medium">{f}</div>
            ))}
          </div>
        </div>
        <p className="text-blue-200 text-sm">© 2025 Al-Noor Academy · Next.js 16 + Prisma</p>
      </div>

      <div className="flex-1 flex items-center justify-center p-8">
        <div className="w-full max-w-md">
          <div className="bg-white rounded-2xl shadow-2xl p-8">
            <h2 className="text-2xl font-bold text-gray-900 mb-1">Welcome back</h2>
            <p className="text-gray-500 text-sm mb-6">Sign in to your account to continue</p>
            {error && (
              <Alert variant="destructive" className="mb-4">
                <AlertCircle className="h-4 w-4" /><AlertDescription>{error}</AlertDescription>
              </Alert>
            )}
            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="space-y-1.5">
                <Label className="text-sm font-medium text-gray-700">Username or Email</Label>
                <div className="relative">
                  <User className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
                  <Input value={username} onChange={e => setUsername(e.target.value)} className="pl-10 h-11" placeholder="username or email" disabled={loading} required autoComplete="username" autoFocus />
                </div>
              </div>
              <div className="space-y-1.5">
                <Label className="text-sm font-medium text-gray-700">Password</Label>
                <div className="relative">
                  <Lock className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
                  <Input type={showPw ? 'text' : 'password'} value={password} onChange={e => setPassword(e.target.value)} className="pl-10 pr-10 h-11" placeholder="password" disabled={loading} required autoComplete="current-password" />
                  <button type="button" className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600" onClick={() => setShowPw(p => !p)}>
                    {showPw ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                  </button>
                </div>
              </div>
              <Button type="submit" className="w-full h-11 bg-blue-600 hover:bg-blue-700 text-white font-medium" disabled={loading}>
                {loading ? <><Loader2 className="mr-2 h-4 w-4 animate-spin" />Signing in...</> : <>Sign In <ChevronRight className="ml-2 h-4 w-4" /></>}
              </Button>
            </form>
            <div className="mt-6 pt-5 border-t border-gray-100">
              <p className="text-xs font-semibold text-gray-400 uppercase tracking-wider mb-3">Quick Demo Login</p>
              <div className="space-y-1.5">
                {DEMO_ACCOUNTS.map(a => (
                  <button key={a.username} type="button" onClick={() => { setUsername(a.username); setPassword('admin123'); }}
                    className={`w-full flex items-center justify-between px-3 py-2.5 rounded-xl text-sm border transition-all ${username === a.username ? 'bg-blue-50 border-blue-300 text-blue-700' : 'border-gray-100 hover:border-blue-200 hover:bg-blue-50 text-gray-700'}`}>
                    <span className="flex items-center gap-2">
                      <span className="font-semibold">{a.label}</span>
                      <span className="text-xs text-gray-400">{a.role}</span>
                    </span>
                    <code className="text-xs text-gray-500 bg-gray-100 px-1.5 py-0.5 rounded">{a.username}</code>
                  </button>
                ))}
              </div>
              <p className="text-center text-xs text-gray-400 mt-3">All accounts use password: <code className="bg-gray-100 px-1.5 py-0.5 rounded">admin123</code></p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

export default function LoginPage() {
  return (
    <Suspense fallback={<div className="min-h-screen bg-slate-900 flex items-center justify-center"><Loader2 className="h-8 w-8 animate-spin text-white" /></div>}>
      <LoginForm />
    </Suspense>
  );
}
