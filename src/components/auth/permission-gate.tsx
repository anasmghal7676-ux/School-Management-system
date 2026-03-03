'use client';

import { useSession } from 'next-auth/react';
import { ReactNode } from 'react';

export interface Permission {
  module: string;
  action: string;
  scope?: string;
}

interface PermissionGateProps {
  permission: Permission | Permission[];
  fallback?: ReactNode;
  children: ReactNode;
}

export function PermissionGate({
  permission,
  fallback = null,
  children,
}: PermissionGateProps) {
  const { data: session } = useSession();

  if (!(session?.user as any)?.role?.permissions) {
    return <>{fallback}</>;
  }

  const userPermissions = (session.user as any)?.role.permissions as Permission[];
  const requiredPermissions = Array.isArray(permission)
    ? permission
    : [permission];

  const hasAccess = requiredPermissions.some((required) =>
    userPermissions.some(
      (userPerm) =>
        (userPerm.module === required.module || userPerm.module === '*') &&
        (userPerm.action === required.action || userPerm.action === '*') &&
        (!required.scope ||
          userPerm.scope === required.scope ||
          userPerm.scope === '*' ||
          userPerm.scope === 'all')
    )
  );

  return hasAccess ? <>{children}</> : <>{fallback}</>;
}

interface RoleGateProps {
  allowedRoles: string[];
  fallback?: ReactNode;
  children: ReactNode;
}

export function RoleGate({
  allowedRoles,
  fallback = null,
  children,
}: RoleGateProps) {
  const { data: session } = useSession();

  if (!(session?.user as any)?.role?.name) {
    return <>{fallback}</>;
  }

  const hasAccess = allowedRoles.includes((session.user as any)?.role.name);

  return hasAccess ? <>{children}</> : <>{fallback}</>;
}
