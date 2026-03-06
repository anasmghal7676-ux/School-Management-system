export const dynamic = 'force-dynamic';
import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';

export async function GET(_: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const subject = await db.subject.findUnique({
      where: { id: (await params).id },
      include: {
        classSubjects: {
          include: { class: { select: { id: true, name: true } } },
        },
      },
    });
    if (!subject) return NextResponse.json({ success: false, message: 'Not found' }, { status: 404 });
    return NextResponse.json({ success: true, data: subject });
  } catch {
    return NextResponse.json({ success: false, message: 'Failed' }, { status: 500 });
  }
}

export async function PUT(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const body = await req.json();
    const { name, code, subjectType, maxMarks, passMarks, isOptional, isCore, description } = body;

    const subject = await db.subject.update({
      where: { id: (await params).id },
      data: {
        ...(name        !== undefined && { name }),
        ...(code        !== undefined && { code }),
        ...(subjectType !== undefined && { subjectType }),
        ...(maxMarks    !== undefined && { maxMarks: parseFloat(maxMarks) }),
        ...(passMarks   !== undefined && { passMarks: parseFloat(passMarks) }),
        ...(isOptional  !== undefined && { isOptional }),
        ...(isCore      !== undefined && { isCore }),
        ...(description !== undefined && { description }),
      },
    });
    return NextResponse.json({ success: true, data: subject });
  } catch (e: any) {
    if (e.code === 'P2002') return NextResponse.json({ success: false, message: 'Code already exists' }, { status: 409 });
    return NextResponse.json({ success: false, message: 'Update failed' }, { status: 500 });
  }
}

export async function DELETE(_: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    await db.subject.delete({ where: { id: (await params).id } });
    return NextResponse.json({ success: true });
  } catch {
    return NextResponse.json({ success: false, message: 'Delete failed' }, { status: 500 });
  }
}
