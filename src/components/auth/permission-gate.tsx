'use client';
import { useSession } from "next-auth/react";

interface Props {
  permission: string;
  minLevel?: number;
  fallback?: React.ReactNode;
  children: React.ReactNode;
}

export function PermissionGate({ permission, minLevel, fallback = null, children }: Props) {
  const { data: session } = useSession();
  if (!session) return <>{fallback}</>;
  const hasPermission =
    session.user.permissions?.includes(permission) ||
    session.user.permissions?.includes("*:*");
  const hasLevel = minLevel ? session.user.roleLevel >= minLevel : true;
  return hasPermission && hasLevel ? <>{children}</> : <>{fallback}</>;
}
