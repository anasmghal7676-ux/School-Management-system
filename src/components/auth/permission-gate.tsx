'use client';

interface Props {
  permission: string;
  minLevel?: number;
  fallback?: React.ReactNode;
  children: React.ReactNode;
}

// Auth disabled - always show children
export function PermissionGate({ children }: Props) {
  return <>{children}</>;
}
