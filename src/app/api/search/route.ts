export const dynamic = 'force-dynamic';
import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';

export async function GET(request: NextRequest) {
  try {
    const q = request.nextUrl.searchParams.get('q') || '';
    if (!q || q.length < 2) {
      return NextResponse.json({ results: [] });
    }

    const search = { contains: q, mode: 'insensitive' as const };
    const results: any[] = [];

    // Search students
    const students = await db.student.findMany({
      where: {
        OR: [
          { firstName: search }, { lastName: search }, { admissionNumber: search },
          { email: search }, { fatherPhone: search },
        ],
      },
      take: 10,
      select: { id: true, firstName: true, lastName: true, admissionNumber: true, currentClassId: true },
    });
    students.forEach(s => results.push({
      id: s.id, type: 'student',
      label: `${s.firstName} ${s.lastName}`,
      sub: `Admission: ${s.admissionNumber}${s.currentClassId ? ` • ${s.currentClassId}` : ''}`,
      href: `/students/${s.id}`,
    }));

    // Search staff/users
    const staff = await db.user.findMany({
      where: {
        OR: [{ firstName: search }, { lastName: search }, { email: search }],
      },
      take: 10,
      select: { id: true, firstName: true, lastName: true, email: true, role: { select: { name: true } } },
    });
    staff.forEach(s => results.push({
      id: s.id, type: 'staff',
      label: `${s.firstName} ${s.lastName}`,
      sub: `${s.email}${s.role?.name ? ` • ${s.role.name}` : ''}`,
      href: `/staff/${s.id}`,
    }));

    // Search classes
    const classes = await db.class.findMany({
      where: { OR: [{ name: search }, { code: search }] },
      take: 8,
      select: { id: true, name: true, code: true, level: true },
    });
    classes.forEach(c => results.push({
      id: c.id, type: 'class',
      label: c.name,
      sub: `Code: ${c.code}${c.level ? ` • ${c.level}` : ''}`,
      href: `/classes`,
    }));

    // Search subjects
    const subjects = await db.subject.findMany({
      where: { OR: [{ name: search }, { code: search }] },
      take: 8,
      select: { id: true, name: true, code: true },
    });
    subjects.forEach(s => results.push({
      id: s.id, type: 'subject',
      label: s.name,
      sub: `Code: ${s.code}`,
      href: `/subjects`,
    }));

    // Search events (if model exists)
    try {
      const events = await (db as any).schoolEvent?.findMany?.({
        where: { OR: [{ title: search }, { description: search }] },
        take: 6,
        select: { id: true, title: true, startDate: true },
      });
      if (events) {
        events.forEach((e: any) => results.push({
          id: e.id, type: 'event',
          label: e.title,
          sub: e.startDate ? new Date(e.startDate).toLocaleDateString() : '',
          href: `/calendar`,
        }));
      }
    } catch { /* model may not exist */ }

    return NextResponse.json({ results, total: results.length });
  } catch (error) {
    console.error('Search error:', error);
    return NextResponse.json({ results: [], error: 'Search failed' }, { status: 500 });
  }
}
