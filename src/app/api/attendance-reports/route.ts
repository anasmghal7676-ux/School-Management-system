export const dynamic = 'force-dynamic';
import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { requireAuth } from '@/lib/api-auth';

export async function GET(req: NextRequest) {
  try {
    await requireAuth(req);
    const { searchParams } = new URL(req.url);
    const type = searchParams.get('type') || 'student'; // student | staff
    const classId = searchParams.get('classId') || '';
    const fromDate = searchParams.get('fromDate') || '';
    const toDate = searchParams.get('toDate') || '';
    const studentId = searchParams.get('studentId') || '';

    const from = fromDate ? new Date(fromDate) : new Date(new Date().setDate(1)); // start of month
    const to = toDate ? new Date(toDate + 'T23:59:59') : new Date();

    if (type === 'student') {
      const where: any = { date: { gte: from, lte: to } };
      if (classId) where.classId = classId;
      if (studentId) where.studentId = studentId;

      const records = await db.attendance.findMany({
        where,
        include: { student: { select: { id: true, fullName: true, admissionNumber: true } }, class: { select: { name: true } }, section: { select: { name: true } } },
        orderBy: { date: 'asc' },
      });

      // Daily summary
      const dailyMap: Record<string, any> = {};
      records.forEach((r: any) => {
        const d = r.date.toISOString().slice(0, 10);
        if (!dailyMap[d]) dailyMap[d] = { date: d, present: 0, absent: 0, late: 0, leave: 0, halfDay: 0, total: 0 };
        dailyMap[d].total++;
        if (r.status === 'Present') dailyMap[d].present++;
        else if (r.status === 'Absent') dailyMap[d].absent++;
        else if (r.status === 'Late') dailyMap[d].late++;
        else if (r.status === 'Leave') dailyMap[d].leave++;
        else if (r.status === 'Half-day') dailyMap[d].halfDay++;
      });

      // Student summary (for individual student)
      let studentSummary = null;
      if (studentId && records.length > 0) {
        const present = records.filter((r: any) => r.status === 'Present').length;
        const absent = records.filter((r: any) => r.status === 'Absent').length;
        const late = records.filter((r: any) => r.status === 'Late').length;
        const leave = records.filter((r: any) => r.status === 'Leave').length;
        const halfDay = records.filter((r: any) => r.status === 'Half-day').length;
        const total = records.length;
        studentSummary = { present, absent, late, leave, halfDay, total, pct: total ? Math.round((present / total) * 100) : 0 };
      }

      // Class-wise summary
      const classMap: Record<string, any> = {};
      records.forEach((r: any) => {
        const cn = `${r.class?.name || '?'} ${r.section?.name || ''}`.trim();
        if (!classMap[cn]) classMap[cn] = { class: cn, present: 0, absent: 0, total: 0 };
        classMap[cn].total++;
        if (r.status === 'Present') classMap[cn].present++;
        else if (r.status === 'Absent') classMap[cn].absent++;
      });

      const overall = {
        total: records.length,
        present: records.filter((r: any) => r.status === 'Present').length,
        absent: records.filter((r: any) => r.status === 'Absent').length,
        late: records.filter((r: any) => r.status === 'Late').length,
        leave: records.filter((r: any) => r.status === 'Leave').length,
        halfDay: records.filter((r: any) => r.status === 'Half-day').length,
      };

      const classes = await db.class.findMany({ orderBy: { name: 'asc' } });

      return NextResponse.json({
        overall,
        daily: Object.values(dailyMap).sort((a: any, b: any) => a.date.localeCompare(b.date)),
        byClass: Object.values(classMap),
        records: studentId ? records.map((r: any) => ({
          id: r.id, date: r.date, status: r.status, remarks: r.remarks,
        })) : [],
        studentSummary,
        classes,
        from: from.toISOString().slice(0, 10),
        to: to.toISOString().slice(0, 10),
      });
    }

    // Staff attendance
    const staffWhere: any = { date: { gte: from, lte: to } };
    const staffRecords = await db.staffAttendance.findMany({
      where: staffWhere,
      include: { staff: { select: { id: true, fullName: true, employeeCode: true, designation: true, department: { select: { id: true, name: true } } } } },
      orderBy: { date: 'asc' },
    });

    const staffMap: Record<string, any> = {};
    staffRecords.forEach((r: any) => {
      const sid = r.staffId;
      if (!staffMap[sid]) staffMap[sid] = {
        id: sid, name: r.staff.fullName, code: r.staff.employeeCode,
        designation: r.staff.designation, dept: r.staff.department?.name || '—',
        present: 0, absent: 0, late: 0, leave: 0, total: 0,
      };
      staffMap[sid].total++;
      if (r.status === 'Present') staffMap[sid].present++;
      else if (r.status === 'Absent') staffMap[sid].absent++;
      else if (r.status === 'Late') staffMap[sid].late++;
      else if (r.status === 'Leave') staffMap[sid].leave++;
    });

    const staffOverall = {
      total: staffRecords.length,
      present: staffRecords.filter((r: any) => r.status === 'Present').length,
      absent: staffRecords.filter((r: any) => r.status === 'Absent').length,
      late: staffRecords.filter((r: any) => r.status === 'Late').length,
      leave: staffRecords.filter((r: any) => r.status === 'Leave').length,
    };

    const dailyStaffMap: Record<string, any> = {};
    staffRecords.forEach((r: any) => {
      const d = r.date.toISOString().slice(0, 10);
      if (!dailyStaffMap[d]) dailyStaffMap[d] = { date: d, present: 0, absent: 0, late: 0, total: 0 };
      dailyStaffMap[d].total++;
      if (r.status === 'Present') dailyStaffMap[d].present++;
      else if (r.status === 'Absent') dailyStaffMap[d].absent++;
      else if (r.status === 'Late') dailyStaffMap[d].late++;
    });

    return NextResponse.json({
      overall: staffOverall,
      daily: Object.values(dailyStaffMap).sort((a: any, b: any) => a.date.localeCompare(b.date)),
      byStaff: Object.values(staffMap).sort((a: any, b: any) => b.absent - a.absent),
      from: from.toISOString().slice(0, 10),
      to: to.toISOString().slice(0, 10),
    });
  } catch (e: any) {
    return NextResponse.json({ error: e.message }, { status: 400 });
  }
}
