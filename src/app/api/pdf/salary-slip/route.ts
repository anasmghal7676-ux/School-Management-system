import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url)
  const staffId = searchParams.get('staffId')
  const month   = parseInt(searchParams.get('month') || String(new Date().getMonth() + 1))
  const year    = parseInt(searchParams.get('year')  || String(new Date().getFullYear()))
  if (!staffId) return NextResponse.json({ success: false, error: 'staffId required' }, { status: 400 })
  try {
    const staff   = await db.staff.findUnique({ where: { id: staffId }, include: { department: { select: { name: true } } } })
    if (!staff) return NextResponse.json({ success: false, error: 'Not found' }, { status: 404 })
    const payroll = await db.payroll.findFirst({ where: { staffId, month, year } })
    const monthName = new Date(year, month - 1, 1).toLocaleString('en-PK', { month: 'long' })
    return NextResponse.json({ success: true, data: { staff, payroll, month: monthName, year: String(year), earnings: [{ label: 'Basic Salary', amount: payroll?.basicSalary || (staff as any).salary || 0 }].filter(e => e.amount > 0), deductions: [{ label: 'Income Tax', amount: payroll?.incomeTax || 0 }].filter(d => d.amount > 0) } })
  } catch (error: any) { return NextResponse.json({ success: false, error: error.message }, { status: 500 }) }
}
