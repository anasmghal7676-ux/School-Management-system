'use client';
import { useEffect } from 'react';
import { useRouter } from 'next/navigation';

// Dashboard index - redirect to main (/) page which is the actual dashboard
export default function DashboardPage() {
  const router = useRouter();
  useEffect(() => { router.replace('/'); }, [router]);
  return null;
}
