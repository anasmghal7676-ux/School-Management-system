export const dynamic = 'force-dynamic';
import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { requireAuth } from '@/lib/api-auth';

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

export async function GET(req: NextRequest) {
  try {
    await requireAuth(req);
    const roles = await db.role.findMany({ orderBy: { level: 'desc' } });
    const userCounts = await db.user.groupBy({ by: ['role'], _count: { id: true } });
    const countMap: Record<string, number> = {};
    userCounts.forEach((u: any) => { countMap[u.role] = u._count.id; });
    const rolesWithCount = roles.map((r: any) => ({ ...r, userCount: countMap[r.name] || 0 }));
    return NextResponse.json({ roles: rolesWithCount, allPermissions: ALL_PERMISSIONS });
  } catch (e: any) {
    return NextResponse.json({ error: e.message }, { status: 400 });
  }
}

export async function POST(req: NextRequest) {
  try {
    await requireAuth(req);
    const { name, description, permissions, level } = await req.json();
    const role = await db.role.create({
      data: { name, description, permissions: JSON.stringify(permissions || []), level: level || 1 },
    });
    return NextResponse.json({ role });
  } catch (e: any) {
    return NextResponse.json({ error: e.message }, { status: 400 });
  }
}

export async function PATCH(req: NextRequest) {
  try {
    await requireAuth(req);
    const { id, name, description, permissions, level } = await req.json();
    const role = await db.role.update({
      where: { id },
      data: { name, description, permissions: JSON.stringify(permissions), level },
    });
    return NextResponse.json({ role });
  } catch (e: any) {
    return NextResponse.json({ error: e.message }, { status: 400 });
  }
}

export async function DELETE(req: NextRequest) {
  try {
    await requireAuth(req);
    const { id } = await req.json();
    await db.role.delete({ where: { id } });
    return NextResponse.json({ ok: true });
  } catch (e: any) {
    return NextResponse.json({ error: e.message }, { status: 400 });
  }
}
