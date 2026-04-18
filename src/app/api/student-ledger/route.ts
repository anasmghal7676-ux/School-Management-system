export const dynamic = 'force-dynamic';
import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { requireAuth } from '@/lib/api-auth';

export async function GET(req: NextRequest) {
  const { error } = await requireAuth();
  if (error) return error;

  try {
    const { searchParams } = new URL(req.url);
    const studentId = searchParams.get('studentId');
    const search    = searchParams.get('search')  || '';
    const classId   = searchParams.get('classId') || '';
    const page      = parseInt(searchParams.get('page')  || '1');
    const limit     = Math.min(parseInt(searchParams.get('limit') || '30'), 200);

    if (studentId) {
      const student = await db.student.findUnique({
        where: { id: studentId },
        include: {
          class:   true,
          section: true,
          feeAssignments: {
            include: { feeStructure: { include: { feeType: true, academicYear: true } } },
          },
          feePayments: {
            include: { items: { include: { feeType: true } } },
            orderBy: { paymentDate: 'asc' },
          },
        },
      });
      if (!student) return NextResponse.json({ error: 'Student not found' }, { status: 404 });

      const entries: any[] = [];

      for (const fa of student.feeAssignments) {
        entries.push({
          id:          fa.id,
          date:        fa.createdAt,
          type:        'charge',
          description: `${fa.feeStructure?.feeType?.name || 'Fee'} — ${fa.feeStructure?.academicYear?.name || 'AY'}`,
          debit:       fa.finalAmount,
          credit:      0,
          reference:   `FA-${fa.id.slice(-6).toUpperCase()}`,
        });
      }

      for (const pmt of student.feePayments) {
        const desc = pmt.items.map((i: any) => i.feeType?.name || 'Fee').join(', ');
        entries.push({
          id:          pmt.id,
          date:        pmt.paymentDate,
          type:        'payment',
          description: `Payment — ${desc || pmt.receiptNumber}`,
          debit:       0,
          credit:      pmt.paidAmount,
          reference:   pmt.receiptNumber,
          mode:        pmt.paymentMode,
        });
      }

      entries.sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime());

      let balance = 0;
      const ledger = entries.map(e => {
        balance = balance + e.debit - e.credit;
        return { ...e, balance };
      });

      const totalCharged = entries.filter(e => e.type === 'charge').reduce((s, e) => s + e.debit, 0);
      const totalPaid    = entries.filter(e => e.type === 'payment').reduce((s, e) => s + e.credit, 0);

      return NextResponse.json({
        student: {
          id: student.id, fullName: student.fullName,
          admissionNumber: student.admissionNumber, fatherName: student.fatherName,
          class: student.class?.name, section: student.section?.name,
        },
        ledger,
        summary: { totalCharged, totalPaid, outstanding: totalCharged - totalPaid },
      });
    }

    // Student list with balances
    const whereClause: any = { status: 'active' };
    if (classId) whereClause.currentClassId = classId;

    const students = await db.student.findMany({
      where: whereClause,
      include: {
        class: true, section: true,
        feeAssignments: { select: { finalAmount: true } },
        feePayments: { select: { paidAmount: true } },
      },
      orderBy: { fullName: 'asc' },
    });

    let mapped = students.map(s => {
      const totalCharged = s.feeAssignments.reduce((sum, fa) => sum + fa.finalAmount, 0);
      const totalPaid    = s.feePayments.reduce((sum, p) => sum + p.paidAmount, 0);
      return {
        id: s.id, fullName: s.fullName,
        admissionNumber: s.admissionNumber, fatherName: s.fatherName,
        class: s.class?.name, section: s.section?.name,
        totalCharged, totalPaid, outstanding: totalCharged - totalPaid,
      };
    });

    if (search) {
      const sl = search.toLowerCase();
      mapped = mapped.filter(st =>
        st.fullName.toLowerCase().includes(sl) ||
        st.admissionNumber.toLowerCase().includes(sl) ||
        (st.fatherName || '').toLowerCase().includes(sl)
      );
    }

    const total     = mapped.length;
    const paginated = mapped.slice((page - 1) * limit, page * limit);
    const classes   = await db.class.findMany({ orderBy: { name: 'asc' } });

    return NextResponse.json({ students: paginated, total, classes });
  } catch (e: any) {
    console.error('Student ledger error:', e);
    return NextResponse.json({ error: e.message }, { status: 500 });
  }
}
