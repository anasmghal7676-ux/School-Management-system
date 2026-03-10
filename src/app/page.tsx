import { redirect } from 'next/navigation';

// Root / redirects to dashboard (which auth middleware protects)
export default function RootPage() {
  redirect('/dashboard');
}
