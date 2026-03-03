import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';

export async function GET(request: NextRequest) {
  try {
    const sp = request.nextUrl.searchParams;
    const classId = sp.get('classId');
    const schoolId = sp.get('schoolId');
    const search = sp.get('search') || '';
    const limit = parseInt(sp.get('limit') || '100');

    const where: any = {};
    if (schoolId) where.schoolId = schoolId;
    if (search) where.name = { contains: search };

    let subjects;
    if (classId) {
      const classSubjects = await db.classSubject.findMany({
        where: { classId },
        include: { subject: true },
        take: limit,
      });
      subjects = classSubjects.map(cs => cs.subject);
    } else {
      subjects = await db.subject.findMany({ where, take: limit, orderBy: { name: 'asc' } });
    }

    return NextResponse.json({ success: true, data: { subjects, total: subjects.length } });
  } catch {
    return NextResponse.json({ success: false, message: 'Failed to fetch subjects' }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { name, code, description, type, schoolId } = body;
    if (!name || !code) {
      return NextResponse.json({ success: false, message: 'name and code required' }, { status: 400 });
    }
    const subject = await db.subject.create({
      data: {
        name,
        code,
        description: description || null,
        subjectType: type || 'Core',
        schoolId: schoolId || null,
      },
    });
    return NextResponse.json({ success: true, data: subject }, { status: 201 });
  } catch (e: any) {
    if (e.code === 'P2002') {
      return NextResponse.json({ success: false, message: 'Subject code already exists' }, { status: 409 });
    }
    return NextResponse.json({ success: false, message: 'Failed to create subject' }, { status: 500 });
  }
}
