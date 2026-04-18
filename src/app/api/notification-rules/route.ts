export const dynamic = 'force-dynamic';
import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { requireAuth } from '@/lib/api-auth';

async function getRules() {
  const s = await db.systemSetting.findMany({ where: { settingKey: { startsWith: 'notif_rule_' } } });
  return s.map(x => JSON.parse(x.settingValue));
}

async function getLogs() {
  const s = await db.systemSetting.findMany({ where: { settingKey: { startsWith: 'notif_log_' } }, orderBy: { updatedAt: 'desc' } });
  return s.map(x => JSON.parse(x.settingValue));
}

export async function GET(req: NextRequest) {
  try {
    await requireAuth(req);
    const { searchParams } = new URL(req.url);
    const view = searchParams.get('view') || 'rules';

    if (view === 'logs') {
      const logs = await getLogs();
      const page = parseInt(searchParams.get('page') || '1');
      const limit = 25;
      return NextResponse.json({
        logs: logs.slice((page - 1) * limit, page * limit),
        total: logs.length,
      });
    }

    const rules = await getRules();
    const summary = {
      total: rules.length,
      active: rules.filter((r: any) => r.isActive).length,
      sms: rules.filter((r: any) => r.channels?.includes('SMS')).length,
      email: rules.filter((r: any) => r.channels?.includes('Email')).length,
      whatsapp: rules.filter((r: any) => r.channels?.includes('WhatsApp')).length,
    };

    return NextResponse.json({ rules, summary });
  } catch (e: any) {
    return NextResponse.json({ error: e.message }, { status: 400 });
  }
}

export async function POST(req: NextRequest) {
  try {
    await requireAuth(req);
    const body = await req.json();
    const id = `${Date.now()}_${Math.random().toString(36).slice(2, 6)}`;
    const rule = { id, ...body, isActive: body.isActive !== false, createdAt: new Date().toISOString() };
    await db.systemSetting.create({ data: { settingKey: `notif_rule_${id}`, settingValue: JSON.stringify(rule), schoolId: process.env.SCHOOL_ID || 'school_main', settingType: 'General' } });
    return NextResponse.json({ rule });
  } catch (e: any) {
    return NextResponse.json({ error: e.message }, { status: 400 });
  }
}

export async function PATCH(req: NextRequest) {
  try {
    await requireAuth(req);
    const body = await req.json();
    const { id, ...updates } = body;
    const setting = await db.systemSetting.findUnique({ where: { schoolId_settingKey: { schoolId: process.env.SCHOOL_ID || 'school_main', settingKey: `notif_rule_${id}` } } });
    if (!setting) return NextResponse.json({ error: 'Not found' }, { status: 404 });
    const updated = { ...JSON.parse(setting.settingValue), ...updates, updatedAt: new Date().toISOString() };
    await db.systemSetting.update({ where: { schoolId_settingKey: { schoolId: process.env.SCHOOL_ID || 'school_main', settingKey: `notif_rule_${id}` } }, data: { settingValue: JSON.stringify(updated) } });
    return NextResponse.json({ rule: updated });
  } catch (e: any) {
    return NextResponse.json({ error: e.message }, { status: 400 });
  }
}

export async function DELETE(req: NextRequest) {
  try {
    await requireAuth(req);
    const { id } = await req.json();
    await db.systemSetting.delete({ where: { schoolId_settingKey: { schoolId: process.env.SCHOOL_ID || 'school_main', settingKey: `notif_rule_${id}` } } });
    return NextResponse.json({ ok: true });
  } catch (e: any) {
    return NextResponse.json({ error: e.message }, { status: 400 });
  }
}
