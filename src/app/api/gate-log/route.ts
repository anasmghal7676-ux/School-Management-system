export const dynamic = 'force-dynamic';
import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { requireAuth } from '@/lib/api-auth';

async function getLogs() {
  const settings = await db.systemSetting.findMany({
    where: { key: { startsWith: 'gate_log_entry_' } },
    orderBy: { updatedAt: 'desc' },
  });
  return settings.map(s => JSON.parse(s.value));
}

export async function GET(req: NextRequest) {
  try {
    await requireAuth(req);
    const { searchParams } = new URL(req.url);
    const search = searchParams.get('search') || '';
    const personType = searchParams.get('personType') || '';
    const entryType = searchParams.get('entryType') || '';
    const date = searchParams.get('date') || '';
    const page = parseInt(searchParams.get('page') || '1');
    const limit = parseInt(searchParams.get('limit') || '25');

    let logs = await getLogs();

    if (search) {
      const s = search.toLowerCase();
      logs = logs.filter((l: any) =>
        l.personName?.toLowerCase().includes(s) ||
        l.admissionOrId?.toLowerCase().includes(s) ||
        l.purpose?.toLowerCase().includes(s) ||
        l.vehicle?.toLowerCase().includes(s)
      );
    }
    if (personType) logs = logs.filter((l: any) => l.personType === personType);
    if (entryType) logs = logs.filter((l: any) => l.entryType === entryType);
    if (date) logs = logs.filter((l: any) => l.dateTime?.startsWith(date));

    logs.sort((a: any, b: any) => new Date(b.dateTime).getTime() - new Date(a.dateTime).getTime());

    const total = logs.length;
    const paginated = logs.slice((page - 1) * limit, page * limit);

    const today = new Date().toISOString().slice(0, 10);
    const todayLogs = await getLogs().then(all => all.filter((l: any) => l.dateTime?.startsWith(today)));
    const summary = {
      todayTotal: todayLogs.length,
      todayIn: todayLogs.filter((l: any) => l.entryType === 'Entry').length,
      todayOut: todayLogs.filter((l: any) => l.entryType === 'Exit').length,
      todayStudents: todayLogs.filter((l: any) => l.personType === 'Student').length,
      todayVisitors: todayLogs.filter((l: any) => l.personType === 'Visitor').length,
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
    const log = { id, ...body, dateTime: body.dateTime || new Date().toISOString(), createdAt: new Date().toISOString() };
    await db.systemSetting.create({
      data: { key: `gate_log_entry_${id}`, value: JSON.stringify(log) },
    });
    return NextResponse.json({ log });
  } catch (e: any) {
    return NextResponse.json({ error: e.message }, { status: 400 });
  }
}

export async function DELETE(req: NextRequest) {
  try {
    await requireAuth(req);
    const { id } = await req.json();
    await db.systemSetting.delete({ where: { key: `gate_log_entry_${id}` } });
    return NextResponse.json({ ok: true });
  } catch (e: any) {
    return NextResponse.json({ error: e.message }, { status: 400 });
  }
}
