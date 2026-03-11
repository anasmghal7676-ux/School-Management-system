export const dynamic = 'force-dynamic';
import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';
export async function GET() {
  try {
    const items = await db.substitution.findMany({
      include: { absentTeacher: true, substitute: true, class: true, section: true },
      orderBy: { date: 'desc' }, take: 100,
    });
    // Enrich with subject names
    const subjectIds = [...new Set(items.map(i => i.subjectId).filter(Boolean) as string[])];
    const subjects = subjectIds.length > 0
      ? await db.subject.findMany({ where: { id: { in: subjectIds } }, select: { id: true, name: true } })
      : [];
    const subjectMap = Object.fromEntries(subjects.map(s => [s.id, s]));
    const enriched = items.map(i => ({ ...i, subject: i.subjectId ? subjectMap[i.subjectId] || null : null }));
    return NextResponse.json({ success: true, data: enriched });
  } catch (e: any) { return NextResponse.json({ success: false, error: e.message }, { status: 500 }); }
}
