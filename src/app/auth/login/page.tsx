'use client';
import { useEffect } from 'react';
import { useRouter } from 'next/navigation';

export default function LoginPage() {
  const router = useRouter();
  useEffect(() => { router.replace('/dashboard'); }, [router]);
  return (
    <div style={{ display: 'flex', height: '100vh', alignItems: 'center', justifyContent: 'center', background: '#0f172a', color: 'white', fontFamily: 'sans-serif', fontSize: 18 }}>
      Loading dashboard...
    </div>
  );
}
