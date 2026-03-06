export const dynamic = 'force-dynamic';
import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { requireAuth } from '@/lib/api-auth';
const KEY = 'qbank_';
async function getAll() {
  const s = await db.systemSetting.findMany({ where: { key: { startsWith: KEY } }, orderBy: { updatedAt: 'desc' } });
  return s.map((x: any) => JSON.parse(x.value));
}
export async function GET(req: NextRequest) {
  try {
    await requireAuth(req);
    const { searchParams } = new URL(req.url);
    const search = searchParams.get('search') || '';
    const subjectId = searchParams.get('subjectId') || '';
    const type = searchParams.get('type') || '';
    const difficulty = searchParams.get('difficulty') || '';
    const classId = searchParams.get('classId') || '';
    const page = parseInt(searchParams.get('page') || '1');
    const limit = parseInt(searchParams.get('limit') || '20');

    let items = await getAll();
    if (search) { const s = search.toLowerCase(); items = items.filter((i: any) => i.question?.toLowerCase().includes(s) || i.topic?.toLowerCase().includes(s)); }
    if (subjectId) items = items.filter((i: any) => i.subjectId === subjectId);
    if (classId) items = items.filter((i: any) => i.classId === classId);
    if (type) items = items.filter((i: any) => i.questionType === type);
    if (difficulty) items = items.filter((i: any) => i.difficulty === difficulty);

    const [subjects, classes] = await Promise.all([
      db.subject.findMany({ orderBy: { name: 'asc' } }),
      db.class.findMany({ orderBy: { name: 'asc' } }),
    ]);

    const summary = {
      total: items.length,
      mcq: items.filter((i: any) => i.questionType === 'MCQ').length,
      short: items.filter((i: any) => i.questionType === 'Short Answer').length,
      long: items.filter((i: any) => i.questionType === 'Long Answer').length,
      easy: items.filter((i: any) => i.difficulty === 'Easy').length,
      medium: items.filter((i: any) => i.difficulty === 'Medium').length,
      hard: items.filter((i: any) => i.difficulty === 'Hard').length,
    };

    return NextResponse.json({ items: items.slice((page - 1) * limit, page * limit), total: items.length, summary, subjects, classes });
  } catch (e: any) { return NextResponse.json({ error: e.message }, { status: 400 }); }
}
export async function POST(req: NextRequest) {
  try {
    await requireAuth(req);
    const body = await req.json();
    if (body.action === 'bulk') {
      const ids = [] as any[];
      for (const q of body.questions) {
        const id = `${Date.now()}_${Math.random().toString(36).slice(2, 6)}`;
        const item = { id, ...q, createdAt: new Date().toISOString() };
        await db.systemSetting.create({ data: { key: KEY + id, value: JSON.stringify(item) } });
        ids.push(id);
      }
      return NextResponse.json({ count: ids.length });
    }
    const id = `${Date.now()}_${Math.random().toString(36).slice(2, 6)}`;
    const item = { id, ...body, usageCount: 0, createdAt: new Date().toISOString() };
    await db.systemSetting.create({ data: { key: KEY + id, value: JSON.stringify(item) } });
    return NextResponse.json({ item });
  } catch (e: any) { return NextResponse.json({ error: e.message }, { status: 400 }); }
}
export async function PATCH(req: NextRequest) {
  try {
    await requireAuth(req);
    const { id, ...updates } = await req.json();
    const s = await db.systemSetting.findUnique({ where: { key: KEY + id } });
    if (!s) return NextResponse.json({ error: 'Not found' }, { status: 404 });
    const updated = { ...JSON.parse(s.value), ...updates, updatedAt: new Date().toISOString() };
    await db.systemSetting.update({ where: { key: KEY + id }, data: { value: JSON.stringify(updated) } });
    return NextResponse.json({ item: updated });
  } catch (e: any) { return NextResponse.json({ error: e.message }, { status: 400 }); }
}
export async function DELETE(req: NextRequest) {
  try {
    await requireAuth(req);
    const { id } = await req.json();
    await db.systemSetting.delete({ where: { key: KEY + id } });
    return NextResponse.json({ ok: true });
  } catch (e: any) { return NextResponse.json({ error: e.message }, { status: 400 }); }
}
