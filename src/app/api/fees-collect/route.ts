import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { studentId, months, discount, fine, paymentMode, transactionId, remarks, receivedBy } = body

    if (!studentId || !months || months.length === 0) {
      return NextResponse.json(
        { success: false, message: 'Student ID and months required' },
        { status: 400 }
      )
    }

    const student = await db.student.findUnique({
      where: { id: studentId },
      include: { class: true }
    })

    if (!student) {
      return NextResponse.json(
        { success: false, message: 'Student not found' },
        { status: 404 }
      )
    }

    const feeStructures = await db.feeStructure.findMany({
      where: { classId: student.currentClassId, isMandatory: true },
      include: { feeType: true }
    })

    let totalAmount = 0
    months.forEach((month: string) => {
      totalAmount += feeStructures.reduce((sum: number, fs: any) => sum + fs.amount, 0)
    })

    const discountAmount = discount || 0
    const fineAmount = fine || 0
    const netAmount = totalAmount - discountAmount + fineAmount

    const year = new Date().getFullYear()
    const lastPayment = await db.feePayment.findFirst({
      where: { receiptNumber: { startsWith: 'RCPT-' + year + '-' } },
      orderBy: { receiptNumber: 'desc' }
    })

    const lastNumber = lastPayment ? parseInt(lastPayment.receiptNumber.split('-')[2]) : 0
    const receiptNumber = 'RCPT-' + year + '-' + String(lastNumber + 1).padStart(6, '0')

    const payment = await db.feePayment.create({
      data: {
        studentId,
        receiptNumber,
        paymentDate: new Date(),
        totalAmount,
        discount: discountAmount,
        fine: fineAmount,
        paidAmount: netAmount,
        paymentMode: paymentMode || 'Cash',
        transactionId,
        remarks,
        receivedBy,
        status: 'Success',
        monthYear: months[0],
      }
    })

    return NextResponse.json({
      success: true,
      message: 'Fee collected successfully',
      data: { payment, student, receiptNumber }
    }, { status: 201 })
  } catch (error) {
    console.error('Error collecting fee:', error)
    return NextResponse.json(
      { success: false, message: 'Failed to collect fee', error: error instanceof Error ? error.message : 'Unknown error' },
      { status: 500 }
    )
  }
}
