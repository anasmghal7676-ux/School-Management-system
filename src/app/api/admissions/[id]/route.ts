export const dynamic = 'force-dynamic';
import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';

const STAGE_ORDER = ['inquiry', 'applied', 'document_review', 'interview', 'approved', 'enrolled', 'rejected'];

export async function GET(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const applicant = await db.student.findUnique({
      where: { id: (await params).id },
      include: { class: { select: { name: true } }, section: { select: { name: true } } },
    });
    if (!applicant) return NextResponse.json({ success: false, message: 'Not found' }, { status: 404 });
    return NextResponse.json({ success: true, data: applicant });
  } catch {
    return NextResponse.json({ success: false, message: 'Failed to fetch' }, { status: 500 });
  }
}

export async function PUT(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const body = await req.json();
    const { action, currentClassId, currentSectionId, rollNumber, remarks, ...updates } = body;

    const student = await db.student.findUnique({ where: { id: (await params).id } });
    if (!student) return NextResponse.json({ success: false, message: 'Not found' }, { status: 404 });

    let newStatus = student.status;
    let newAdmissionNumber = student.admissionNumber;

    if (action === 'advance') {
      const idx = STAGE_ORDER.indexOf(student.status);
      if (idx >= 0 && idx < STAGE_ORDER.length - 2) {
        newStatus = STAGE_ORDER[idx + 1];
      }
    } else if (action === 'approve') {
      newStatus = 'approved';
    } else if (action === 'reject') {
      newStatus = 'rejected';
    } else if (action === 'enroll') {
      // Enroll: change status to 'active' and generate real admission number
      const year = new Date().getFullYear();
      const count = await db.student.count({ where: { status: 'active' } });
      newAdmissionNumber = `${year}-${String(count + 1).padStart(5, '0')}`;
      newStatus = 'active';
    }

    const updated = await db.student.update({
      where: { id: (await params).id },
      data: {
        status:           newStatus,
        admissionNumber:  newAdmissionNumber,
        currentClassId:   currentClassId   || student.currentClassId,
        currentSectionId: currentSectionId || student.currentSectionId,
        rollNumber:       rollNumber        || student.rollNumber,
        remarks:          remarks           ?? student.remarks,
        ...Object.fromEntries(
          Object.entries(updates).filter(([k, v]) => v !== undefined && v !== null && v !== '')
        ),
      },
      include: {
        class:   { select: { name: true } },
        section: { select: { name: true } },
      },
    });

    return NextResponse.json({
      success: true,
      data: updated,
      message: action === 'enroll'
        ? `Student enrolled! Admission No: ${newAdmissionNumber}`
        : `Status updated to ${newStatus}`,
    });
  } catch (error) {
    console.error('Admissions PUT error:', error);
    return NextResponse.json({ success: false, message: 'Failed to update admission' }, { status: 500 });
  }
}
