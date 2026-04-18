export const dynamic = 'force-dynamic';
import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { requireAuth } from '@/lib/api-auth';

// GET /api/attendance/summary?studentId=&classId=&sectionId=&from=&to=&month=YYYY-MM
// Returns attendance counts and percentage per student or class
export async function GET(request: NextRequest) {
  const { error } = await requireAuth();
  if (error) return error;

  try {
    const sp        = request.nextUrl.searchParams;
    const studentId = sp.get('studentId') || '';
    const classId   = sp.get('classId')   || '';
    const sectionId = sp.get('sectionId') || '';
    const month     = sp.get('month')     || ''; // YYYY-MM
    const from      = sp.get('from')      || '';
    const to        = sp.get('to')        || '';

    // Build date range
    let dateFilter: { gte?: Date; lte?: Date } = {};
    if (month) {
      const [y, m] = month.split('-').map(Number);
      dateFilter.gte = new Date(y, m - 1, 1);
      dateFilter.lte = new Date(y, m, 0, 23, 59, 59);
    } else if (from || to) {
      if (from) dateFilter.gte = new Date(from);
      if (to)   dateFilter.lte = new Date(to + 'T23:59:59');
    }

    const where: any = {};
    if (Object.keys(dateFilter).length) where.date = dateFilter;
    if (studentId) where.studentId = studentId;
    if (sectionId) where.sectionId = sectionId;
    if (classId && !sectionId) {
      const sections = await db.section.findMany({ where: { classId }, select: { id: true } });
      where.sectionId = { in: sections.map(s => s.id) };
    }

    // Group attendance by studentId + status
    const grouped = await db.attendance.groupBy({
      by: ['studentId', 'status'],
      where,
      _count: { _all: true },
    });

    // Reshape into per-student summary
    const summaryMap = new Map<string, {
      present: number; absent: number; late: number; leave: number; halfDay: number; total: number;
    }>();

    for (const row of grouped) {
      const sid = row.studentId;
      if (!summaryMap.has(sid)) {
        summaryMap.set(sid, { present: 0, absent: 0, late: 0, leave: 0, halfDay: 0, total: 0 });
      }
      const rec = summaryMap.get(sid)!;
      const count = row._count._all;
      rec.total += count;
      switch (row.status) {
        case 'Present':  rec.present  += count; break;
        case 'Absent':   rec.absent   += count; break;
        case 'Late':     rec.late     += count; break;
        case 'Leave':    rec.leave    += count; break;
        case 'Half-day': rec.halfDay  += count; break;
      }
    }

    // If single student — also fetch their name
    if (studentId) {
      const student = await db.student.findUnique({
        where: { id: studentId },
        select: { fullName: true, admissionNumber: true,
                  class: { select: { name: true } },
                  section: { select: { name: true } } },
      });
      const rec = summaryMap.get(studentId) ?? { present:0, absent:0, late:0, leave:0, halfDay:0, total:0 };
      const percentage = rec.total > 0 ? Math.round(((rec.present + rec.late * 0.5) / rec.total) * 100) : 0;
      return NextResponse.json({
        success: true,
        data: { studentId, student, ...rec, percentage },
      });
    }

    // Multiple students — return array
    const data = Array.from(summaryMap.entries()).map(([sid, rec]) => {
      const percentage = rec.total > 0 ? Math.round(((rec.present + rec.late * 0.5) / rec.total) * 100) : 0;
      return { studentId: sid, ...rec, percentage };
    });

    return NextResponse.json({ success: true, data, total: data.length });
  } catch (e: any) {
    return NextResponse.json({ success: false, error: e.message }, { status: 500 });
  }
}
