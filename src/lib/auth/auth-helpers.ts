import { hash, compare } from 'bcryptjs';
import { db } from '@/lib/db';

export interface Permission {
  module: string;
  action: string;
  scope?: string;
}

export interface UserWithRole {
  id: string;
  username: string;
  email: string;
  firstName: string;
  lastName: string;
  role: {
    id: string;
    name: string;
    level: number;
    permissions: Permission[];
  };
  schoolId?: string | null;
  isActive: boolean;
  twoFactorEnabled: boolean;
}

/**
 * Hash a password using bcrypt
 */
export async function hashPassword(password: string): Promise<string> {
  return hash(password, 12);
}

/**
 * Verify a password against a hash
 */
export async function verifyPassword(
  password: string,
  hash: string
): Promise<boolean> {
  return compare(password, hash);
}

/**
 * Check if user has specific permission
 */
export async function hasPermission(
  userId: string,
  requiredPermission: Permission,
  scope?: string
): Promise<boolean> {
  const user = await db.user.findUnique({
    where: { id: userId },
    include: { role: true },
  });

  if (!user || !user.isActive) {
    return false;
  }

  const permissions = user.role.permissions
    ? (typeof user.role.permissions === 'string' ? JSON.parse(user.role.permissions) : user.role.permissions as any[])
    : [];

  // Check for exact permission match
  const hasExactPermission = permissions.some(
    (p: Permission) =>
      p.module === requiredPermission.module &&
      p.action === requiredPermission.action &&
      (!requiredPermission.scope || p.scope === requiredPermission.scope)
  );

  if (hasExactPermission) {
    return true;
  }

  // Check for wildcard permissions
  const hasWildcardPermission = permissions.some(
    (p: Permission) =>
      p.module === requiredPermission.module &&
      (p.action === '*' || p.action === 'all') &&
      (!requiredPermission.scope || p.scope === '*' || p.scope === 'all')
  );

  return hasWildcardPermission;
}

/**
 * Check if user has any of the specified permissions
 */
export async function hasAnyPermission(
  userId: string,
  requiredPermissions: Permission[]
): Promise<boolean> {
  for (const permission of requiredPermissions) {
    if (await hasPermission(userId, permission)) {
      return true;
    }
  }
  return false;
}

/**
 * Check if user has all of the specified permissions
 */
export async function hasAllPermissions(
  userId: string,
  requiredPermissions: Permission[]
): Promise<boolean> {
  for (const permission of requiredPermissions) {
    if (!(await hasPermission(userId, permission))) {
      return false;
    }
  }
  return true;
}

/**
 * Get user by ID with role
 */
export async function getUserById(
  userId: string
): Promise<UserWithRole | null> {
  const user = await db.user.findUnique({
    where: { id: userId },
    include: { role: true },
  });

  if (!user) {
    return null;
  }

  const permissions = user.role.permissions
    ? (typeof user.role.permissions === 'string' ? JSON.parse(user.role.permissions) : user.role.permissions as any[])
    : [];

  return {
    id: user.id,
    username: user.username,
    email: user.email,
    firstName: user.firstName,
    lastName: user.lastName,
    role: {
      id: user.role.id,
      name: user.role.name,
      level: user.role.level,
      permissions,
    },
    schoolId: user.schoolId,
    isActive: user.isActive,
    twoFactorEnabled: user.twoFactorEnabled,
  };
}

/**
 * Check if user account is locked
 */
export async function isAccountLocked(userId: string): Promise<boolean> {
  const user = await db.user.findUnique({
    where: { id: userId },
    select: { lockedUntil: true },
  });

  if (!user || !user.lockedUntil) {
    return false;
  }

  return user.lockedUntil > new Date();
}

/**
 * Lock user account
 */
export async function lockAccount(
  userId: string,
  durationMinutes: number = 30
): Promise<void> {
  await db.user.update({
    where: { id: userId },
    data: {
      lockedUntil: new Date(Date.now() + durationMinutes * 60 * 1000),
    },
  });
}

/**
 * Unlock user account
 */
export async function unlockAccount(userId: string): Promise<void> {
  await db.user.update({
    where: { id: userId },
    data: {
      lockedUntil: null,
      failedLoginAttempts: 0,
    },
  });
}

/**
 * Record login attempt
 */
export async function recordLoginAttempt(
  userId: string | null,
  username: string,
  email: string | null,
  ipAddress: string,
  userAgent: string | null,
  success: boolean,
  failureReason?: string
): Promise<void> {
  await db.loginAttempt.create({
    data: {
      userId,
      username,
      email,
      ipAddress,
      userAgent,
      success,
      failureReason,
    },
  });
}

/**
 * Validate password strength
 */
export function validatePasswordStrength(password: string): {
  isValid: boolean;
  score: number;
  errors: string[];
} {
  const errors: string[] = [];
  let score = 0;

  // Length check
  if (password.length < 8) {
    errors.push('Password must be at least 8 characters long');
  } else {
    score += 20;
  }

  if (password.length > 12) {
    score += 10;
  }

  // Uppercase check
  if (/[A-Z]/.test(password)) {
    score += 20;
  } else {
    errors.push('Password must contain at least one uppercase letter');
  }

  // Lowercase check
  if (/[a-z]/.test(password)) {
    score += 15;
  } else {
    errors.push('Password must contain at least one lowercase letter');
  }

  // Number check
  if (/[0-9]/.test(password)) {
    score += 15;
  } else {
    errors.push('Password must contain at least one number');
  }

  // Special character check
  if (/[^A-Za-z0-9]/.test(password)) {
    score += 20;
  } else {
    errors.push('Password must contain at least one special character');
  }

  return {
    isValid: errors.length === 0 && score >= 60,
    score,
    errors,
  };
}
