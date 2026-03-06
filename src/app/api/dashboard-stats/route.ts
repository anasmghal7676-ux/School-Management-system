export const dynamic = 'force-dynamic';
import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'

export async function GET(request: NextRequest) {
  try {
    const now        = new Date()
    const todayStart = new Date(now.getFullYear(), now.getMonth(), now.getDate())
    const monthStart = new Date(now.getFullYear(), now.getMonth(), 1)

    // Parallel queries for performance
    const [
      totalStudents,
      totalStaff,
      totalClasses,
      genderGroups,
      todayAttendance,
      monthlyFeeAgg,
      defaultersAgg,
      pendingLeaves,
      openComplaints,
      libraryBooks,
      transportRoutes,
      recentStudents,
      upcomingEvents,
    ] = await Promise.all([
      db.student.count({ where: { status: 'active' } }),
      db.staff.count({ where: { status: 'active' } }),
      db.class.count(),
      db.student.groupBy({ by: ['gender'], where: { status: 'active' }, _count: true }),
      db.attendance.groupBy({
        by: ['status'],
        where: { date: { gte: todayStart } },
        _count: true,
      }),
      db.feePayment.aggregate({
        where: { paymentDate: { gte: monthStart }, status: 'Success' },
        _sum: { paidAmount: true },
      }),
      db.feePayment.count({ where: { status: 'Pending' } }),
      db.leaveApplication.count({ where: { status: 'Pending' } }).catch(() => 0),
      db.complaint.count({ where: { status: 'Open' } }).catch(() => 0),
      db.libraryBook.count().catch(() => 0),
      db.transportRoute.count({ where: { isActive: true } }).catch(() => 0),
      db.student.findMany({
        where: { status: 'active' },
        orderBy: { createdAt: 'desc' },
        take: 5,
        include: {
          class: { select: { name: true } },
          section: { select: { name: true } },
        },
      }),
      db.event.findMany({
        where: { startDate: { gte: now } },
        orderBy: { startDate: 'asc' },
        take: 5,
        select: { id: true, title: true, startDate: true, eventType: true },
      }).catch(() => []),
    ])

    // Calculate attendance percentage
    const totalAtt   = todayAttendance.reduce((s: number, g: any) => s + g._count, 0)
    const presentAtt = todayAttendance.find((g: any) => g.status === 'Present')?._count || 0
    const todayAttPct = totalAtt > 0 ? Math.round((presentAtt / totalAtt) * 100) : 0

    // Gender counts
    const maleCount   = genderGroups.find((g: any) => g.gender === 'Male')?._count || 0
    const femaleCount = genderGroups.find((g: any) => g.gender === 'Female')?._count || 0
    const otherCount  = totalStudents - maleCount - femaleCount

    // Monthly fee data (last 6 months)
    const monthlyFeeData: number[] = []
    for (let i = 5; i >= 0; i--) {
      const mStart = new Date(now.getFullYear(), now.getMonth() - i, 1)
      const mEnd   = new Date(now.getFullYear(), now.getMonth() - i + 1, 0, 23, 59, 59)
      const agg = await db.feePayment.aggregate({
        where: { paymentDate: { gte: mStart, lte: mEnd }, status: 'Success' },
        _sum: { paidAmount: true },
      })
      monthlyFeeData.push(Number(agg._sum.paidAmount || 0))
    }

    // Teacher count (staff with type=Teacher)
    const teacherCount = await db.staff.count({
      where: { status: 'active', staffType: 'Teacher' },
    }).catch(() => 0)

    // Fee defaulters (students with pending fees)
    const feeDefaulters = defaultersAgg

    // Fee alerts (top students with overdue)
    const feeAlerts = await db.feePayment.findMany({
      where: { status: 'Pending', dueDate: { lt: now } },
      orderBy: { amount: 'desc' },
      take: 5,
      include: {
        student: { select: { fullName: true, admissionNumber: true } },
      },
    }).catch(() => [])

    return NextResponse.json({
      success: true,
      data: {
        // Flat format for dashboard page
        totalStudents,
        totalStaff,
        totalClasses,
        teacherCount,
        maleCount,
        femaleCount,
        otherCount,
        todayAttendance: todayAttPct,
        monthlyFees: monthlyFeeAgg._sum.paidAmount || 0,
        feeDefaulters,
        pendingLeaves,
        openComplaints,
        libraryBooks,
        transportRoutes,
        monthlyFeeData,
        weeklyAtt: [92, 89, 94, 91, 88, 85],  // Will be replaced with real data
        recentStudents: recentStudents.map((s: any) => ({
          id: s.id,
          fullName: s.fullName,
          admissionNumber: s.admissionNumber,
          class: s.class,
          status: s.status,
        })),
        feeAlerts: feeAlerts.map((f: any) => ({
          studentName: f.student?.fullName,
          outstanding: f.amount,
          balance: f.amount - (f.paidAmount || 0),
        })),
        upcomingEvents,
      },
    })
  } catch (error: any) {
    console.error('Dashboard stats error:', error)
    return NextResponse.json({ 
      success: false, 
      error: error.message,
      data: {
        totalStudents: 0, totalStaff: 0, totalClasses: 0, teacherCount: 0,
        maleCount: 0, femaleCount: 0, otherCount: 0, todayAttendance: 0,
        monthlyFees: 0, feeDefaulters: 0, pendingLeaves: 0, openComplaints: 0,
        libraryBooks: 0, transportRoutes: 0, monthlyFeeData: [0,0,0,0,0,0],
        weeklyAtt: [92,89,94,91,88,85], recentStudents: [], feeAlerts: [], upcomingEvents: [],
      }
    })
  }
}
