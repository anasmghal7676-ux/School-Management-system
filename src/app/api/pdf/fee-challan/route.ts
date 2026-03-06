export const dynamic = 'force-dynamic';
import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url)
  const studentId = searchParams.get('studentId')
  if (!studentId) return NextResponse.json({ success: false, error: 'studentId required' }, { status: 400 })
  try {
    const student = await db.student.findUnique({ where: { id: studentId }, include: { class: { select: { name: true } }, section: { select: { name: true } } } })
    if (!student) return NextResponse.json({ success: false, error: 'Not found' }, { status: 404 })
    const fees = await db.feePayment.findMany({ where: { studentId, status: { in: ['Pending', 'Partial'] } }, include: { feeType: { select: { name: true } } }, orderBy: { createdAt: 'asc' } })
    const challanNo = `CH-${new Date().getFullYear()}-${student.admissionNumber?.slice(-4) || 'XXXX'}-${String(Date.now()).slice(-4)}`
    const dueDate = new Date(Date.now() + 10 * 86400000).toLocaleDateString('en-PK')
    return NextResponse.json({ success: true, data: { student, fees, challanNo, dueDate, month: new Date().toLocaleString('en-PK', { month: 'long', year: 'numeric' }) } })
  } catch (error: any) { return NextResponse.json({ success: false, error: error.message }, { status: 500 }) }
}
