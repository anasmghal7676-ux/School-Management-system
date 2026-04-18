export const dynamic = 'force-dynamic';
import { NextRequest, NextResponse } from 'next/server';

// Notification rules are stored as SystemSettings
import { db } from '@/lib/db';
import { requireAuth } from '@/lib/api-auth';

const SCHOOL_ID = 'school_main';

export async function GET() {
  const { error } = await requireAuth();
  if (error) return error;

  try {
    const rules = await db.systemSetting.findMany({
      where: { schoolId: SCHOOL_ID, settingKey: { startsWith: 'notif_rule_' } },
    });
    return NextResponse.json({ success: true, data: rules });
  } catch (error: any) {
    return NextResponse.json({ success: false, message: error.message }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  const { error } = await requireAuth();
  if (error) return error;

  try {
    const body = await req.json();
    const key = `notif_rule_${body.name || Date.now()}`;
    const rule = await db.systemSetting.upsert({
      where: { schoolId_settingKey: { schoolId: SCHOOL_ID, settingKey: key } },
      create: { schoolId: SCHOOL_ID, settingKey: key, settingValue: JSON.stringify(body), settingType: 'Notification' },
      update: { settingValue: JSON.stringify(body) },
    });
    return NextResponse.json({ success: true, data: rule }, { status: 201 });
  } catch (error: any) {
    return NextResponse.json({ success: false, message: error.message }, { status: 500 });
  }
}
