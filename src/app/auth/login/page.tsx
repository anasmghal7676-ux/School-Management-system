'use client';

import { Suspense } from 'react';
import { useState, useEffect } from 'react';
import { signIn, useSession } from 'next-auth/react';
import { useRouter, useSearchParams } from 'next/navigation';
import { School, Eye, EyeOff, Loader2, AlertCircle } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Alert, AlertDescription } from '@/components/ui/alert';

function LoginForm() {
  const router = useRouter();
  const { data: session, status } = useSession();
  const searchParams = useSearchParams();
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    if (status === 'authenticated') router.replace('/');
  }, [status, router]);

  useEffect(() => {
    if (searchParams?.get('error') === 'CredentialsSignin') {
      setError('Invalid username or password.');
    }
  }, [searchParams]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!username.trim() || !password) return;
    setLoading(true);
    setError('');
    try {
      const result = await signIn('credentials', {
        username: username.trim(),
        password,
        redirect: false,
      });
      if (result?.error) {
        setError('Invalid username or password. Account may be locked after 5 failed attempts.');
      } else {
        router.push('/');
        router.refresh();
      }
    } catch {
      setError('An unexpected error occurred. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  if (status === 'loading') {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-blue-950 to-slate-900 flex items-center justify-center p-4">
      <div className="w-full max-w-md space-y-6">
        <div className="flex flex-col items-center gap-3 text-white">
          <div className="flex items-center justify-center w-16 h-16 rounded-2xl bg-blue-600 shadow-lg shadow-blue-500/30">
            <School className="h-8 w-8" />
          </div>
          <div className="text-center">
            <h1 className="text-2xl font-bold">EduManage Pro</h1>
            <p className="text-slate-400 text-sm">School ERP System</p>
          </div>
        </div>

        <Card className="border-slate-700 bg-slate-900/80 backdrop-blur text-white shadow-xl">
          <CardHeader className="pb-4">
            <CardTitle className="text-white text-lg">Sign In</CardTitle>
            <CardDescription className="text-slate-400">
              Enter your credentials to access the system
            </CardDescription>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleSubmit} className="space-y-4">
              {error && (
                <Alert variant="destructive" className="bg-red-950 border-red-800">
                  <AlertCircle className="h-4 w-4" />
                  <AlertDescription className="text-red-200">{error}</AlertDescription>
                </Alert>
              )}
              <div className="space-y-2">
                <Label htmlFor="username" className="text-slate-300">Username or Email</Label>
                <Input
                  id="username"
                  type="text"
                  value={username}
                  onChange={(e) => setUsername(e.target.value)}
                  placeholder="admin"
                  autoComplete="username"
                  required
                  disabled={loading}
                  className="bg-slate-800 border-slate-700 text-white placeholder:text-slate-500 focus-visible:ring-blue-500"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="password" className="text-slate-300">Password</Label>
                <div className="relative">
                  <Input
                    id="password"
                    type={showPassword ? 'text' : 'password'}
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    placeholder="••••••••"
                    autoComplete="current-password"
                    required
                    disabled={loading}
                    className="bg-slate-800 border-slate-700 text-white placeholder:text-slate-500 focus-visible:ring-blue-500 pr-10"
                  />
                  <Button
                    type="button"
                    variant="ghost"
                    size="icon"
                    className="absolute right-0 top-0 h-full px-3 text-slate-400 hover:text-white hover:bg-transparent"
                    onClick={() => setShowPassword(!showPassword)}
                    disabled={loading}
                  >
                    {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                  </Button>
                </div>
              </div>
              <Button
                type="submit"
                className="w-full bg-blue-600 hover:bg-blue-500 text-white"
                disabled={loading || !username || !password}
              >
                {loading ? (
                  <><Loader2 className="mr-2 h-4 w-4 animate-spin" />Signing in…</>
                ) : 'Sign In'}
              </Button>
            </form>
          </CardContent>
        </Card>

        <p className="text-center text-xs text-slate-500">
          Default credentials: <strong className="text-slate-400">admin</strong> / <strong className="text-slate-400">Admin@123</strong>
        </p>
      </div>
    </div>
  );
}

export default function LoginPage() {
  return (
    <Suspense fallback={
      <div className="flex items-center justify-center min-h-screen bg-slate-900">
        <Loader2 className="h-8 w-8 animate-spin text-blue-500" />
      </div>
    }>
      <LoginForm />
    </Suspense>
  );
}
