'use client';
// Auth disabled - pass-through component
export default function AuthGuard({ children }: { children: React.ReactNode }) {
  return <>{children}</>;
}
