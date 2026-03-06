'use client';
// Auth disabled - always render children
export default function PermissionGate({ children }: { children: React.ReactNode }) {
  return <>{children}</>;
}
export function usePermissions() {
  return { hasPermission: () => true, hasRole: () => true };
}
