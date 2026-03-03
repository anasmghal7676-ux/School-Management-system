import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { requireAuth } from '@/lib/auth';

export async function GET(req: NextRequest) {
  try {
    await requireAuth(req);
    const { searchParams } = new URL(req.url);
    const search = searchParams.get('search') || '';
    const department = searchParams.get('department') || '';
    const role = searchParams.get('role') || '';

    const where: any = { status: 'Active' };
    if (search) where.OR = [{ fullName: { contains: search, mode: 'insensitive' } }, { designation: { contains: search, mode: 'insensitive' } }, { email: { contains: search, mode: 'insensitive' } }];
    if (department) where.department = { contains: department, mode: 'insensitive' };
    if (role) where.role = role;

    const staff = await prisma.staff.findMany({
      where,
      select: {
        id: true, fullName: true, designation: true, department: true,
        email: true, phone: true, photo: true, role: true, joinDate: true,
        qualification: true, experience: true, address: true, emergencyContact: true,
      },
      orderBy: [{ department: 'asc' }, { fullName: 'asc' }],
    });

    // Group by department
    const departments = [...new Set(staff.map((s: any) => s.department).filter(Boolean))].sort();
    const roles = [...new Set(staff.map((s: any) => s.role).filter(Boolean))].sort();

    // Group staff by department
    const grouped: Record<string, any[]> = {};
    staff.forEach((s: any) => {
      const dept = s.department || 'General';
      if (!grouped[dept]) grouped[dept] = [];
      grouped[dept].push(s);
    });

    return NextResponse.json({ staff, grouped, departments, roles, total: staff.length });
  } catch (e: any) { return NextResponse.json({ error: e.message }, { status: 400 }); }
}
