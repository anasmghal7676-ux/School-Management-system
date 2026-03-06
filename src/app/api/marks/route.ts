export const dynamic = 'force-dynamic';
import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { getAuthContext, requireAccess } from '@/lib/api-auth'

const SCHOOL_ID = process.env.SCHOOL_ID || 'default-school';

// GET /api/marks?examId=&classId=&scheduleId=
export async function GET(request: NextRequest) {
  try {
    const sp         = request.nextUrl.searchParams;
    const examId     = sp.get('examId')     || '';
    const classId    = sp.get('classId')    || '';
    const scheduleId = sp.get('scheduleId') || '';

    if (!scheduleId && !examId) {
      return NextResponse.json({ success: false, message: 'scheduleId or examId required' }, { status: 400 });
    }

    const where: any = {};
    if (scheduleId) where.examScheduleId = scheduleId;
    else if (examId) {
      const schedules = await db.examSchedule.findMany({
        where: { examId, ...(classId ? { classId } : {}) },
        select: { id: true },
      });
      where.examScheduleId = { in: schedules.map(s => s.id) };
    }

    const marks = await db.mark.findMany({
      where,
      include: {
        student: { select: { id: true, fullName: true, rollNumber: true, admissionNumber: true } },
        examSchedule: {
          select: {
            id: true, maxMarks: true, passMarks: true, examDate: true,
            subject: { select: { id: true, name: true } },
          },
        },
      },
      orderBy: [{ examSchedule: { examDate: 'asc' } }],
    });

    // Fetch students for the class (for pending entry)
    let students: any[] = [];
    if (classId) {
      students = await db.student.findMany({
        where: { currentClassId: classId, status: 'active', schoolId: SCHOOL_ID },
        select: { id: true, fullName: true, rollNumber: true, admissionNumber: true },
        orderBy: [{ rollNumber: 'asc' }, { fullName: 'asc' }],
      });
    }

    const markMap = Object.fromEntries(marks.map(m => [m.studentId, m]));
    const summary = {
      total:   students.length || marks.length,
      entered: marks.filter(m => m.marksObtained != null || m.isAbsent).length,
      absent:  marks.filter(m => m.isAbsent).length,
      passed:  marks.filter(m => {
        const s  = m.examSchedule;
        return m.marksObtained != null && s?.passMarks != null && m.marksObtained >= s.passMarks;
      }).length,
    };

    return NextResponse.json({
      success: true,
      data: { marks, students, markMap: Object.fromEntries(marks.map(m => [m.studentId, { marksObtained: m.marksObtained, isAbsent: m.isAbsent, remarks: m.remarks }])), summary },
    });
  } catch (error) {
    console.error('Marks GET error:', error);
    return NextResponse.json({ success: false, message: 'Failed to fetch marks' }, { status: 500 });
  }
}

// POST /api/marks — bulk upsert
// body: { scheduleId, entries: [{ studentId, marksObtained, isAbsent, remarks, enteredBy }] }
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { scheduleId, entries, enteredBy } = body;

    if (!scheduleId || !Array.isArray(entries)) {
      return NextResponse.json({ success: false, message: 'scheduleId and entries[] required' }, { status: 400 });
    }

    const results = await Promise.allSettled(
      entries.map(async (entry: any) => {
        const { studentId, marksObtained, isAbsent, remarks } = entry;
        return db.mark.upsert({
          where:  { examScheduleId_studentId: { examScheduleId: scheduleId, studentId } },
          create: {
            examScheduleId: scheduleId,
            studentId,
            marksObtained: isAbsent ? null : (marksObtained != null ? parseFloat(marksObtained) : null),
            isAbsent:      isAbsent || false,
            remarks:       remarks || null,
            enteredBy:     enteredBy || null,
            entryDate:     new Date(),
          },
          update: {
            marksObtained: isAbsent ? null : (marksObtained != null ? parseFloat(marksObtained) : null),
            isAbsent:      isAbsent || false,
            remarks:       remarks || null,
            enteredBy:     enteredBy || null,
            entryDate:     new Date(),
          },
        });
      })
    );

    const saved  = results.filter(r => r.status === 'fulfilled').length;
    const failed = results.filter(r => r.status === 'rejected').length;

    return NextResponse.json({ success: true, data: { saved, failed, total: entries.length } });
  } catch (error) {
    console.error('Marks POST error:', error);
    return NextResponse.json({ success: false, message: 'Failed to save marks' }, { status: 500 });
  }
}

// PATCH — verify marks (department head sign-off)
export async function PATCH(request: NextRequest) {
  const auth = getAuthContext(request)
  const denied = requireAccess(auth, { minLevel: 5, permission: 'marks:approve' })
  if (denied) return denied

  try {
    const body = await request.json();
    const { markIds, verifiedBy } = body;

    if (!markIds?.length || !verifiedBy) {
      return NextResponse.json({ success: false, message: 'markIds[] and verifiedBy required' }, { status: 400 });
    }

    await db.mark.updateMany({
      where: { id: { in: markIds } },
      data:  { verifiedBy, verificationDate: new Date() },
    });

    return NextResponse.json({ success: true, data: { verified: markIds.length } });
  } catch (error) {
    console.error('Marks PATCH error:', error);
    return NextResponse.json({ success: false, message: 'Verification failed' }, { status: 500 });
  }
}
