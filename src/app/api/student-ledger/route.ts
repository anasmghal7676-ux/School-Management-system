export const dynamic = 'force-dynamic';
import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { requireAuth } from '@/lib/api-auth';

export async function GET(req: NextRequest) {
  try {
    await requireAuth(req);
    const { searchParams } = new URL(req.url);
    const studentId = searchParams.get('studentId');
    const search = searchParams.get('search') || '';
    const classId = searchParams.get('classId') || '';
    const page = parseInt(searchParams.get('page') || '1');
    const limit = parseInt(searchParams.get('limit') || '30');

    // If studentId given, return full ledger for that student
    if (studentId) {
      const student = await db.student.findUnique({
        where: { id: studentId },
        include: {
          class: true,
          section: true,
          feeAssignments: { include: { feeType: true, academicYear: true } },
          feePayments: {
            include: { items: { include: { feeType: true } } },
            orderBy: { paymentDate: 'asc' },
          },
        },
      });
      if (!student) return NextResponse.json({ error: 'Student not found' }, { status: 404 });

      // Build ledger entries
      const entries: any[] = [];

      // Add fee assignments as debit entries (grouped by academic year)
      for (const fa of student.feeAssignments) {
        entries.push({
          id: fa.id,
          date: fa.dueDate || fa.createdAt,
          type: 'charge',
          description: `${fa.feeType.name} — ${fa.academicYear?.name || 'AY'}`,
          debit: fa.amount,
          credit: 0,
          reference: `FA-${fa.id.slice(-6).toUpperCase()}`,
        });
      }

      // Add payments as credit entries
      for (const pmt of student.feePayments) {
        const desc = pmt.items.map((i: any) => i.feeType?.name || 'Fee').join(', ');
        entries.push({
          id: pmt.id,
          date: pmt.paymentDate,
          type: 'payment',
          description: `Payment — ${desc || pmt.receiptNumber}`,
          debit: 0,
          credit: pmt.totalAmount,
          reference: pmt.receiptNumber,
          mode: pmt.paymentMode,
        });
      }

      // Sort by date
      entries.sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime());

      // Running balance
      let balance = 0;
      const ledger = entries.map(e => {
        balance = balance + e.debit - e.credit;
        return { ...e, balance };
      });

      const totalCharged = entries.filter(e => e.type === 'charge').reduce((s, e) => s + e.debit, 0);
      const totalPaid = entries.filter(e => e.type === 'payment').reduce((s, e) => s + e.credit, 0);

      return NextResponse.json({
        student: {
          id: student.id,
          fullName: student.fullName,
          admissionNumber: student.admissionNumber,
          fatherName: student.fatherName,
          class: student.class?.name,
          section: student.section?.name,
        },
        ledger,
        summary: { totalCharged, totalPaid, outstanding: totalCharged - totalPaid },
      });
    }

    // Otherwise return student list with balances
    const whereClause: any = { status: 'Active' };
    if (classId) whereClause.classId = classId;

    const students = await db.student.findMany({
      where: whereClause,
      include: {
        class: true,
        section: true,
        feeAssignments: true,
        feePayments: { select: { totalAmount: true } },
      },
      orderBy: { fullName: 'asc' },
    });

    let mapped = students.map(s => {
      const totalCharged = s.feeAssignments.reduce((sum: number, fa: any) => sum + fa.amount, 0);
      const totalPaid = s.feePayments.reduce((sum: number, p: any) => sum + p.totalAmount, 0);
      return {
        id: s.id,
        fullName: s.fullName,
        admissionNumber: s.admissionNumber,
        fatherName: s.fatherName,
        class: s.class?.name,
        section: s.section?.name,
        totalCharged,
        totalPaid,
        outstanding: totalCharged - totalPaid,
      };
    });

    if (search) {
      const s = search.toLowerCase();
      mapped = mapped.filter(st =>
        st.fullName.toLowerCase().includes(s) ||
        st.admissionNumber.toLowerCase().includes(s) ||
        (st.fatherName || '').toLowerCase().includes(s)
      );
    }

    const total = mapped.length;
    const paginated = mapped.slice((page - 1) * limit, page * limit);

    const classes = await db.class.findMany({ orderBy: { name: 'asc' } });

    return NextResponse.json({ students: paginated, total, classes });
  } catch (e: any) {
    return NextResponse.json({ error: e.message }, { status: 400 });
  }
}
