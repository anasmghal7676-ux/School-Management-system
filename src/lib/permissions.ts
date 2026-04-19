// src/lib/permissions.ts — Centralized permission definitions
// Used by role-permissions route and RBAC checks

export const ALL_PERMISSIONS: Record<string, string[]> = {
  dashboard: ['view_dashboard', 'view_analytics'],
  students: ['view_students', 'create_student', 'edit_student', 'delete_student', 'export_students'],
  staff: ['view_staff', 'create_staff', 'edit_staff', 'delete_staff'],
  fees: ['view_fees', 'collect_fees', 'create_fee_structure', 'edit_fee_structure', 'delete_fees', 'export_fees'],
  payroll: ['view_payroll', 'process_payroll', 'edit_payroll', 'view_salary_slips'],
  attendance: ['view_attendance', 'mark_attendance', 'edit_attendance', 'view_reports'],
  exams: ['view_exams', 'create_exam', 'enter_marks', 'publish_results', 'delete_exam'],
  library: ['view_library', 'issue_books', 'return_books', 'manage_library'],
  transport: ['view_transport', 'manage_routes', 'assign_students'],
  hostel: ['view_hostel', 'manage_rooms', 'assign_students_hostel'],
  accounts: ['view_accounts', 'create_voucher', 'edit_accounts', 'delete_accounts'],
  reports: ['view_reports', 'export_reports', 'print_reports'],
  settings: ['view_settings', 'edit_settings', 'manage_users', 'manage_roles'],
  communication: ['view_messages', 'send_messages', 'send_broadcast'],
  inventory: ['view_inventory', 'manage_inventory'],
  assets: ['view_assets', 'manage_assets'],
  hr: ['view_hr', 'manage_hr', 'view_appraisals', 'manage_appraisals'],
};

export type PermissionModule = keyof typeof ALL_PERMISSIONS;
export type Permission = string;
