/**
 * Role-Based Access Control (RBAC)
 * School Management System — Session 30
 *
 * Role Hierarchy (level):
 *   10 — Super Admin     (full system access)
 *   9  — Principal       (all school operations)
 *   8  — Vice Principal  (academic + admin)
 *   7  — Administrator   (admin operations, no payroll)
 *   6  — Accountant      (finance only)
 *   5  — Coordinator     (academic operations)
 *   4  — Teacher         (own classes, marks entry)
 *   3  — Librarian       (library only)
 *   2  — Receptionist    (admissions, visitors)
 *   1  — Parent          (view own child only)
 */

export const ROLES = {
  SUPER_ADMIN:    { name: 'Super Admin',    level: 10 },
  PRINCIPAL:      { name: 'Principal',      level: 9  },
  VICE_PRINCIPAL: { name: 'Vice Principal', level: 8  },
  ADMINISTRATOR:  { name: 'Administrator',  level: 7  },
  ACCOUNTANT:     { name: 'Accountant',     level: 6  },
  COORDINATOR:    { name: 'Coordinator',    level: 5  },
  TEACHER:        { name: 'Teacher',        level: 4  },
  LIBRARIAN:      { name: 'Librarian',      level: 3  },
  RECEPTIONIST:   { name: 'Receptionist',  level: 2  },
  PARENT:         { name: 'Parent',         level: 1  },
} as const;

// ─── PERMISSION CATALOGUE ────────────────────────────────────────────────────
// Format: resource:action  (wildcards: resource:* or *:*)
export const PERMISSIONS = {
  // Students
  STUDENTS_VIEW:    'students:view',
  STUDENTS_CREATE:  'students:create',
  STUDENTS_EDIT:    'students:edit',
  STUDENTS_DELETE:  'students:delete',

  // Staff
  STAFF_VIEW:       'staff:view',
  STAFF_CREATE:     'staff:create',
  STAFF_EDIT:       'staff:edit',
  STAFF_DELETE:     'staff:delete',

  // Finance
  FEES_VIEW:        'fees:view',
  FEES_COLLECT:     'fees:collect',
  FEES_MANAGE:      'fees:manage',
  PAYROLL_VIEW:     'payroll:view',
  PAYROLL_MANAGE:   'payroll:manage',
  EXPENSES_VIEW:    'expenses:view',
  EXPENSES_APPROVE: 'expenses:approve',

  // Academic
  MARKS_VIEW:       'marks:view',
  MARKS_ENTER:      'marks:enter',
  MARKS_APPROVE:    'marks:approve',
  TIMETABLE_VIEW:   'timetable:view',
  TIMETABLE_MANAGE: 'timetable:manage',
  ATTENDANCE_VIEW:  'attendance:view',
  ATTENDANCE_MARK:  'attendance:mark',
  ATTENDANCE_EDIT:  'attendance:edit',

  // Reports
  REPORTS_VIEW:     'reports:view',
  REPORTS_EXPORT:   'reports:export',

  // Administration
  SETTINGS_VIEW:    'settings:view',
  SETTINGS_MANAGE:  'settings:manage',
  USERS_VIEW:       'users:view',
  USERS_MANAGE:     'users:manage',
  ROLES_MANAGE:     'roles:manage',

  // Library
  LIBRARY_VIEW:     'library:view',
  LIBRARY_MANAGE:   'library:manage',

  // Transport
  TRANSPORT_VIEW:   'transport:view',
  TRANSPORT_MANAGE: 'transport:manage',

  // Hostel
  HOSTEL_VIEW:      'hostel:view',
  HOSTEL_MANAGE:    'hostel:manage',
} as const;

// ─── DEFAULT ROLE PERMISSIONS ─────────────────────────────────────────────────
export const ROLE_PERMISSIONS: Record<string, string[]> = {
  'Super Admin': ['*:*'],  // All permissions

  'Principal': [
    'students:*', 'staff:*', 'fees:*', 'payroll:view',
    'marks:*', 'timetable:*', 'attendance:*',
    'reports:*', 'settings:*', 'users:view',
    'library:*', 'transport:*', 'hostel:*',
    'expenses:*',
  ],

  'Vice Principal': [
    'students:*', 'staff:view', 'staff:edit',
    'fees:view', 'marks:*', 'timetable:*',
    'attendance:*', 'reports:*', 'settings:view',
    'library:*', 'transport:view', 'hostel:view',
  ],

  'Administrator': [
    'students:*', 'staff:view', 'staff:create', 'staff:edit',
    'fees:view', 'fees:collect',
    'attendance:view', 'attendance:mark',
    'reports:view', 'reports:export',
    'settings:view', 'library:view',
    'transport:view', 'transport:manage',
    'hostel:view',
  ],

  'Accountant': [
    'fees:*', 'payroll:*', 'expenses:*',
    'reports:view', 'reports:export',
    'students:view', 'staff:view',
  ],

  'Coordinator': [
    'students:view', 'students:edit',
    'marks:*', 'timetable:*',
    'attendance:view', 'attendance:mark', 'attendance:edit',
    'reports:view', 'reports:export',
  ],

  'Teacher': [
    'students:view',
    'marks:view', 'marks:enter',
    'attendance:view', 'attendance:mark',
    'timetable:view',
    'library:view',
  ],

  'Librarian': [
    'library:*',
    'students:view',
    'reports:view',
  ],

  'Receptionist': [
    'students:view', 'students:create',
    'attendance:view',
    'fees:view', 'fees:collect',
    'transport:view',
  ],

  'Parent': [
    'students:view',
    'fees:view',
    'marks:view',
    'attendance:view',
  ],
};

// ─── ROUTE-LEVEL RBAC RULES ───────────────────────────────────────────────────
// Maps API path patterns to minimum role level required
// More specific paths override general ones
export const ROUTE_PERMISSIONS: { pattern: RegExp; minLevel: number; permission?: string }[] = [
  // Settings — admin only
  { pattern: /^\/api\/settings/,          minLevel: 7 },

  // Users & Roles — super admin only
  { pattern: /^\/api\/users/,             minLevel: 7 },
  { pattern: /^\/api\/roles/,             minLevel: 9 },

  // Payroll — accountant+
  { pattern: /^\/api\/payroll/,           minLevel: 6, permission: 'payroll:view' },
  { pattern: /^\/api\/salary/,            minLevel: 6, permission: 'payroll:view' },

  // Expenses — level 4+
  { pattern: /^\/api\/expenses/,          minLevel: 4 },
  { pattern: /^\/api\/expense-req/,  minLevel: 4 },

  // Finance
  { pattern: /^\/api\/fees/,              minLevel: 2, permission: 'fees:view' },
  { pattern: /^\/api\/fee-/,              minLevel: 2, permission: 'fees:view' },
  { pattern: /^\/api\/fees-collect/,      minLevel: 2, permission: 'fees:collect' },

  // Academic — teacher+
  { pattern: /^\/api\/marks/,             minLevel: 4, permission: 'marks:view' },
  { pattern: /^\/api\/exam-results/,      minLevel: 4 },
  { pattern: /^\/api\/grade-book/,        minLevel: 4, permission: 'marks:view' },
  { pattern: /^\/api\/attendance/,        minLevel: 2, permission: 'attendance:view' },
  { pattern: /^\/api\/timetable/,         minLevel: 4, permission: 'timetable:view' },
  { pattern: /^\/api\/cls-timetable/,   minLevel: 4 },

  // Students — receptionist+
  { pattern: /^\/api\/students/,          minLevel: 2, permission: 'students:view' },
  { pattern: /^\/api\/admission/,         minLevel: 2 },

  // Staff — teacher can view
  { pattern: /^\/api\/staff/,             minLevel: 2, permission: 'staff:view' },

  // Library
  { pattern: /^\/api\/library/,           minLevel: 3, permission: 'library:view' },
  { pattern: /^\/api\/books/,             minLevel: 3 },

  // Reports — teacher+
  { pattern: /^\/api\/reports/,           minLevel: 4, permission: 'reports:view' },

  // Transport — receptionist+
  { pattern: /^\/api\/transport/,         minLevel: 2 },
  { pattern: /^\/api\/routes/,            minLevel: 2 },
  { pattern: /^\/api\/vehicles/,          minLevel: 2 },

  // Dashboard — all authenticated
  { pattern: /^\/api\/dashboard/,         minLevel: 1 },

  // PDF — teacher+
  { pattern: /^\/api\/pdf/,               minLevel: 4 },
];

// ─── PAGE-LEVEL ACCESS RULES ──────────────────────────────────────────────────
export const PAGE_PERMISSIONS: { pattern: RegExp; minLevel: number; title: string }[] = [
  { pattern: /^\/settings/,              minLevel: 7,  title: 'Settings' },
  { pattern: /^\/users/,                 minLevel: 7,  title: 'User Management' },
  { pattern: /^\/roles/,                 minLevel: 9,  title: 'Role Management' },
  { pattern: /^\/payroll/,               minLevel: 6,  title: 'Payroll' },
  { pattern: /^\/salary/,                minLevel: 6,  title: 'Salary Management' },
  { pattern: /^\/finance/,               minLevel: 6,  title: 'Finance' },
  { pattern: /^\/fees/,                  minLevel: 2,  title: 'Fee Management' },
  { pattern: /^\/marks/,                 minLevel: 4,  title: 'Marks' },
  { pattern: /^\/grade-book/,            minLevel: 4,  title: 'Grade Book' },
  { pattern: /^\/staff/,                 minLevel: 2,  title: 'Staff' },
  { pattern: /^\/students/,              minLevel: 1,  title: 'Students' },
  { pattern: /^\/reports/,               minLevel: 4,  title: 'Reports' },
  { pattern: /^\/teacher-perf/,   minLevel: 5,  title: 'Teacher Performance' },
];

// ─── UTILITY FUNCTIONS ────────────────────────────────────────────────────────

/**
 * Check if a role's permissions include a given permission.
 * Supports wildcard: 'fees:*' matches 'fees:view', 'fees:collect', etc.
 * '*:*' matches everything.
 */
export function hasPermission(rolePermissions: string[], required: string): boolean {
  for (const perm of rolePermissions) {
    if (perm === '*:*') return true;
    if (perm === required) return true;

    const [resource, action] = perm.split(':');
    const [reqResource, reqAction] = required.split(':');

    if (resource === reqResource && action === '*') return true;
    if (resource === '*' && action === reqAction) return true;
  }
  return false;
}

/**
 * Check if role level meets minimum requirement
 */
export function hasLevel(userLevel: number, minLevel: number): boolean {
  return userLevel >= minLevel;
}

/**
 * Get permissions list for a role by name
 */
export function getPermissionsForRole(roleName: string): string[] {
  return ROLE_PERMISSIONS[roleName] || [];
}

/**
 * Check if a user (from JWT token headers) can access a route
 */
export function canAccessRoute(
  pathname: string,
  method: string,
  userLevel: number,
  userPermissions: string[]
): { allowed: boolean; reason?: string } {
  // Find matching route rule (most specific first)
  for (const rule of ROUTE_PERMISSIONS) {
    if (rule.pattern.test(pathname)) {
      // Check level
      if (!hasLevel(userLevel, rule.minLevel)) {
        return {
          allowed: false,
          reason: `Insufficient access level. Required: ${rule.minLevel}, Your level: ${userLevel}`,
        };
      }
      // Check specific permission if defined
      if (rule.permission && !hasPermission(userPermissions, rule.permission)) {
        return {
          allowed: false,
          reason: `Missing permission: ${rule.permission}`,
        };
      }
      return { allowed: true };
    }
  }
  // No specific rule — allow if authenticated
  return { allowed: true };
}

// ─── DELETE OPERATION GUARDS ─────────────────────────────────────────────────
// DELETE operations require higher level than GET/POST
export function getMinLevelForMethod(pathname: string, method: string): number {
  const isDestructive = method === 'DELETE' || method === 'PATCH';
  if (!isDestructive) return 0; // handled by route rules

  // Finance deletes need accountant level
  if (/\/(fees|payroll|expenses|salary)/.test(pathname)) return 6;
  // User/settings deletes need admin
  if (/\/(users|roles|settings)/.test(pathname)) return 7;
  // Academic deletes need coordinator
  if (/\/(marks|exam-results|attendance)/.test(pathname)) return 5;
  // General deletes need admin level 4+
  return 4;
}
