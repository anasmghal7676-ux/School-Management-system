export const dynamic = 'force-dynamic';
import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';

// GET /api/teach-portal?staffId=&date=
export async function GET(request: NextRequest) {
  try {
    const sp      = request.nextUrl.searchParams;
    const staffId = sp.get('staffId') || '';
    const date    = sp.get('date')    || new Date().toISOString().slice(0, 10);

    if (!staffId) {
      return NextResponse.json({ success: false, message: 'staffId required' }, { status: 400 });
    }

    const staff = await db.staff.findUnique({
      where: { id: staffId },
      select: {
        id: true, firstName: true, lastName: true, designation: true,
        employeeCode: true, email: true, phone: true,
        department: { select: { name: true } },
      },
    });
    if (!staff) return NextResponse.json({ success: false, message: 'Staff not found' }, { status: 404 });

    const today    = new Date(date);
    const dayOfWeek = today.getDay() === 0 ? 7 : today.getDay(); // 1=Mon..7=Sun

    // Today's timetable
    const timetable = await db.timetable.findMany({
      where: { teacherId: staffId },
      include: {
        slot:    true,
        section: { select: { name: true, class: { select: { name: true } } } },
      },
      orderBy: [{ slot: { dayOfWeek: 'asc' } }, { slot: { periodNumber: 'asc' } }],
    });

    const todaySchedule = timetable.filter(t => t.slot.dayOfWeek === dayOfWeek);

    // Enrich with subjects
    const subjectIds = Array.from(new Set(timetable.map(t => t.subjectId).filter(Boolean))) as string[];
    const subjects   = subjectIds.length > 0
      ? await db.subject.findMany({ where: { id: { in: subjectIds } }, select: { id: true, name: true } })
      : [];
    const subMap = Object.fromEntries(subjects.map(s => [s.id, s]));

    // Sections this teacher teaches
    const uniqueSections = Array.from(new Map(timetable.map(t => [t.sectionId, t.section])).entries());

    // Attendance marked today for teacher's sections
    const sectionIds = uniqueSections.map(([sid]) => sid).filter(Boolean) as string[];

    const todayStart = new Date(date);
    const todayEnd   = new Date(date + 'T23:59:59');

    const attendanceToday = sectionIds.length > 0
      ? await db.attendance.findMany({
          where: { date: { gte: todayStart, lte: todayEnd }, student: { currentSectionId: { in: sectionIds } } },
          select: { studentId: true, status: true, student: { select: { currentSectionId: true } } },
        })
      : [];

    // Section attendance summary
    const sectionAttSummary = uniqueSections.map(([sid, section]) => {
      const att = attendanceToday.filter(a => a.student.currentSectionId === sid);
      return {
        sectionId:   sid,
        sectionName: section?.name,
        className:   section?.class?.name,
        present:     att.filter(a => a.status === 'Present').length,
        absent:      att.filter(a => a.status === 'Absent').length,
        total:       att.length,
        marked:      att.length > 0,
      };
    });

    // Upcoming homework assigned by this teacher
    const homework = await db.homework.findMany({
      where: {
        assignedBy:     `${staff.firstName} ${staff.lastName}`,
        submissionDate: { gte: new Date() },
      },
      include: {
        class:   { select: { name: true } },
        section: { select: { name: true } },
      },
      orderBy: { submissionDate: 'asc' },
      take: 5,
    });

    // Pending leave requests
    const pendingLeaves = await db.leaveApplication.findMany({
      where: { applicantId: staffId, status: 'Pending' },
      orderBy: { createdAt: 'desc' },
      take: 3,
    });

    // Monthly attendance summary (current month)
    const monthStart = new Date(today.getFullYear(), today.getMonth(), 1);
    const staffAtt   = await db.staffAttendance.findMany({
      where: { staffId, date: { gte: monthStart } },
      select: { status: true },
    });
    const staffAttSummary = {
      present:  staffAtt.filter(a => a.status === 'Present').length,
      absent:   staffAtt.filter(a => a.status === 'Absent').length,
      late:     staffAtt.filter(a => a.status === 'Late').length,
      total:    staffAtt.length,
    };

    return NextResponse.json({
      success: true,
      data: {
        staff,
        todaySchedule: todaySchedule.map(t => ({ ...((t) as any), subject: t.subjectId ? subMap[t.subjectId] : null })),
        fullTimetable: timetable.map(t => ({ ...((t) as any), subject: t.subjectId ? subMap[t.subjectId] : null })),
        sections:      uniqueSections.map(([sid, section]) => ({ id: sid, ...((section) as any) })),
        sectionAttSummary,
        homework,
        pendingLeaves,
        staffAttSummary,
        dayOfWeek,
      },
    });
  } catch (error) {
    console.error('Teacher portal GET error:', error);
    return NextResponse.json({ success: false, message: 'Failed to fetch teacher data' }, { status: 500 });
  }
}
