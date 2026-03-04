import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';

export async function GET(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const hw = await db.homework.findUnique({
      where: { id: (await params).id },
      include: {
        class:   { select: { name: true } },
        section: { select: { name: true } },
        submissions: {
          include: { student: { select: { fullName: true, admissionNumber: true, rollNumber: true } } },
          orderBy: { submissionDate: 'asc' },
        },
      },
    });
    if (!hw) return NextResponse.json({ success: false, message: 'Not found' }, { status: 404 });

    // Total students in class/section for submission rate
    const totalStudents = await db.student.count({
      where: {
        status: 'active',
        currentClassId: hw.classId,
        ...(hw.sectionId ? { currentSectionId: hw.sectionId } : {}),
      },
    });

    const submittedCount  = hw.submissions.filter(s => s.submissionDate).length;
    const submissionRate  = totalStudents > 0 ? Math.round((submittedCount / totalStudents) * 100) : 0;

    return NextResponse.json({
      success: true,
      data: { ...hw, totalStudents, submittedCount, submissionRate, isOverdue: new Date() > new Date(hw.submissionDate) },
    });
  } catch {
    return NextResponse.json({ success: false, message: 'Failed to fetch' }, { status: 500 });
  }
}

export async function PUT(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const body = await req.json();
    const { title, description, submissionDate, totalMarks } = body;
    const hw = await db.homework.update({
      where: { id: (await params).id },
      data: {
        ...(title          !== undefined && { title }),
        ...(description    !== undefined && { description }),
        ...(submissionDate !== undefined && { submissionDate: new Date(submissionDate) }),
        ...(totalMarks     !== undefined && { totalMarks: totalMarks ? parseFloat(totalMarks) : null }),
      },
    });
    return NextResponse.json({ success: true, data: hw });
  } catch {
    return NextResponse.json({ success: false, message: 'Failed to update' }, { status: 500 });
  }
}

export async function DELETE(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    await db.homework.delete({ where: { id: (await params).id } });
    return NextResponse.json({ success: true, message: 'Deleted' });
  } catch {
    return NextResponse.json({ success: false, message: 'Failed to delete' }, { status: 500 });
  }
}
