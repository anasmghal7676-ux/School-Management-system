export const dynamic = 'force-dynamic';
import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { requireAuth } from '@/lib/api-auth';

async function getAllLogs() {
  const settings = await db.systemSetting.findMany({
    where: { settingKey: { startsWith: 'comm_log_entry_' } },
    orderBy: { updatedAt: 'desc' },
  });
  return settings.map(s => JSON.parse(s.settingValue));
}

export async function GET(req: NextRequest) {
  try {
    await requireAuth(req);
    const { searchParams } = new URL(req.url);
    const search = searchParams.get('search') || '';
    const type = searchParams.get('type') || '';
    const direction = searchParams.get('direction') || '';
    const outcome = searchParams.get('outcome') || '';
    const page = parseInt(searchParams.get('page') || '1');
    const limit = parseInt(searchParams.get('limit') || '20');

    let logs = await getAllLogs();

    if (search) {
      const s = search.toLowerCase();
      logs = logs.filter((l: any) =>
        l.personName?.toLowerCase().includes(s) ||
        l.studentName?.toLowerCase().includes(s) ||
        l.subject?.toLowerCase().includes(s) ||
        l.notes?.toLowerCase().includes(s)
      );
    }
    if (type) logs = logs.filter((l: any) => l.type === type);
    if (direction) logs = logs.filter((l: any) => l.direction === direction);
    if (outcome) logs = logs.filter((l: any) => l.outcome === outcome);

    logs.sort((a: any, b: any) => new Date(b.date).getTime() - new Date(a.date).getTime());

    const total = logs.length;
    const paginated = logs.slice((page - 1) * limit, page * limit);

    const all = await getAllLogs();
    const summary = {
      total: all.length,
      calls: all.filter((l: any) => l.type === 'Call').length,
      emails: all.filter((l: any) => l.type === 'Email').length,
      meetings: all.filter((l: any) => l.type === 'Meeting').length,
      sms: all.filter((l: any) => l.type === 'SMS').length,
      followUpNeeded: all.filter((l: any) => l.followUpRequired && !l.followUpDone).length,
    };

    return NextResponse.json({ logs: paginated, total, summary });
  } catch (e: any) {
    return NextResponse.json({ error: e.message }, { status: 400 });
  }
}

export async function POST(req: NextRequest) {
  try {
    await requireAuth(req);
    const body = await req.json();
    const id = `${Date.now()}_${Math.random().toString(36).slice(2, 7)}`;
    const log = { id, ...body, createdAt: new Date().toISOString() };
    await db.systemSetting.create({
      data: { settingKey: `comm_log_entry_${id}`, settingValue: JSON.stringify(log), schoolId: 'school_main', settingType: 'General' },
    });
    return NextResponse.json({ log });
  } catch (e: any) {
    return NextResponse.json({ error: e.message }, { status: 400 });
  }
}

export async function PATCH(req: NextRequest) {
  try {
    await requireAuth(req);
    const body = await req.json();
    const { id, ...updates } = body;
    const setting = await db.systemSetting.findUnique({ where: { schoolId_settingKey: { schoolId: 'school_main', settingKey: `comm_log_entry_${id}` } } });
    if (!setting) return NextResponse.json({ error: 'Not found' }, { status: 404 });
    const existing = JSON.parse(setting.settingValue);
    const updated = { ...existing, ...updates };
    await db.systemSetting.update({
      where: { schoolId_settingKey: { schoolId: 'school_main', settingKey: `comm_log_entry_${id}` } }, data: { settingValue: JSON.stringify(updated) },
    });
    return NextResponse.json({ log: updated });
  } catch (e: any) {
    return NextResponse.json({ error: e.message }, { status: 400 });
  }
}

export async function DELETE(req: NextRequest) {
  try {
    await requireAuth(req);
    const { id } = await req.json();
    await db.systemSetting.delete({ where: { schoolId_settingKey: { schoolId: 'school_main', settingKey: `comm_log_entry_${id}` } } });
    return NextResponse.json({ ok: true });
  } catch (e: any) {
    return NextResponse.json({ error: e.message }, { status: 400 });
  }
}
