export const dynamic = 'force-dynamic';
import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'
import { requireAuth } from '@/lib/api-auth';

// This route provides data for client-side PDF generation
// The actual PDF creation happens in the browser using jsPDF
export async function GET(request: NextRequest) {
  const { error } = await requireAuth();
  if (error) return error;

  const { searchParams } = new URL(request.url)
  const type      = searchParams.get('type')
  const studentId = searchParams.get('studentId')
  const staffId   = searchParams.get('staffId')
  const month     = searchParams.get('month')
  const year      = searchParams.get('year')
  const term      = searchParams.get('term')

  try {
    switch (type) {
      // ── Fee Challan Data ──────────────────────────────────────────────────
      case 'fee-challan': {
        if (!studentId) return NextResponse.json({ success: false, error: 'studentId required' }, { status: 400 })
        
        const student = await db.student.findUnique({
          where: { id: studentId },
          include: {
            class:   { select: { name: true } },
            section: { select: { name: true } },
          },
        })
        
        const fees = await db.feePayment.findMany({
          where: { studentId, status: { in: ['Pending', 'Partial'] } },
          include: { feeType: { select: { name: true } } },
          orderBy: { createdAt: 'asc' },
        })
        
        const challanNo = `CH-${new Date().getFullYear()}-${String(student?.admissionNumber || Date.now()).slice(-4)}-${String(Date.now()).slice(-4)}`
        const dueDate   = new Date(Date.now() + 10 * 86400000).toLocaleDateString('en-PK')
        
        return NextResponse.json({
          success: true,
          data: { student, fees, challanNo, dueDate, month: new Date().toLocaleString('en-PK', { month: 'long', year: 'numeric' }) }
        })
      }

      // ── Report Card Data ──────────────────────────────────────────────────
      case 'report-card': {
        if (!studentId) return NextResponse.json({ success: false, error: 'studentId required' }, { status: 400 })

        const student = await db.student.findUnique({
          where: { id: studentId },
          include: {
            class:   { select: { name: true, classTeacher: { include: { select: { fullName: true } } } } },
            section: { select: { name: true } },
          },
        })
        
        const marks = await db.mark.findMany({
          where: { studentId, ...(term ? { exam: { term } } : {}) },
          include: {
            
            examSchedule: { include: { exam: { select: { name: true, maxTotalMarks: true } } } },
          },
          orderBy: { createdAt: 'asc' },
        })
        
        const attendance = await db.attendance.groupBy({
          by: ['status'],
          where: { studentId },
          _count: true,
        })
        
        const totalAtt   = attendance.reduce((s: number, a: any) => s + a._count, 0)
        const presentAtt = attendance.find((a: any) => a.status === 'Present')?._count || 0
        
        const academicYear = await db.academicYear.findFirst({ where: { isCurrent: true } })
        
        return NextResponse.json({
          success: true,
          data: {
            student,
            marks: marks.map(m => ({
              subject: m.examSchedule?.subjectId || '',
              obtainedMarks: m.marksObtained ?? 0,
              totalMarks: m.examSchedule?.exam?.maxTotalMarks || 100,
            })),
            term: term || 'Annual',
            academicYear: academicYear?.name || new Date().getFullYear().toString(),
            attendance: { present: presentAtt, total: totalAtt },
          }
        })
      }

      // ── Salary Slip Data ──────────────────────────────────────────────────
      case 'salary-slip': {
        if (!staffId) return NextResponse.json({ success: false, error: 'staffId required' }, { status: 400 })
        
        const staff = await db.staff.findUnique({
          where: { id: staffId },
          include: {
            department: { select: { name: true } },
          },
        })
        
        const payroll = await db.payroll.findFirst({
          where: {
            staffId,
            ...(month ? { month: parseInt(month) } : {}),
            ...(year  ? { year:  parseInt(year) }  : {}),
          },
          orderBy: { createdAt: 'desc' },
        })
        
        return NextResponse.json({
          success: true,
          data: {
            staff,
            payroll,
            month: month || new Date().toLocaleString('default', { month: 'long' }),
            year:  year  || new Date().getFullYear().toString(),
          }
        })
      }

      // ── TC Data ───────────────────────────────────────────────────────────
      case 'tc': {
        const tcId = searchParams.get('tcId')
        if (!tcId && !studentId) return NextResponse.json({ success: false, error: 'tcId or studentId required' }, { status: 400 })
        
        const tcStudent = await db.student.findFirst({
          where: studentId ? { id: studentId } : undefined,
          include: {
            class:   { select: { name: true } },
            section: { select: { name: true } },
          },
        })
        
        return NextResponse.json({ success: true, data: { student: tcStudent, issuedDate: new Date().toISOString(), tcNumber: 'TC-' + Date.now() } })
      }

      // ── Student ID Card Data ───────────────────────────────────────────────
      case 'id-cards': {
        const classId = searchParams.get('classId')
        const where: any = { status: 'active' }
        if (classId) where.classId = classId
        
        const students = await db.student.findMany({
          where,
          include: {
            class:   { select: { name: true } },
            section: { select: { name: true } },
          },
          take: 200,
          orderBy: [{ class: { name: 'asc' } }, { fullName: 'asc' }],
        })
        
        return NextResponse.json({ success: true, data: students })
      }

      // ── Attendance Report Data ─────────────────────────────────────────────
      case 'attendance-report': {
        const classId   = searchParams.get('classId')
        const startDate = searchParams.get('startDate')
        const endDate   = searchParams.get('endDate')
        
        const where: any = {}
        if (classId)   where.student = { currentClassId: classId }
        if (startDate) where.date    = { gte: new Date(startDate) }
        if (endDate)   where.date    = { ...where.date, lte: new Date(endDate) }
        
        const records = await db.attendance.findMany({
          where,
          include: {
            student: { select: { fullName: true, admissionNumber: true, class: { select: { name: true } } } },
          },
          orderBy: [{ date: 'asc' }, { student: { fullName: 'asc' } }],
          take: 500,
        })
        
        return NextResponse.json({ success: true, data: records })
      }

      default:
        return NextResponse.json({ success: false, error: 'Invalid type parameter' }, { status: 400 })
    }
  } catch (error: any) {
    console.error('PDF data error:', error)
    return NextResponse.json({ success: false, error: error.message }, { status: 500 })
  }
}
