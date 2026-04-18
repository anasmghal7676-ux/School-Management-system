export const dynamic = 'force-dynamic';
import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { requireAuth } from '@/lib/api-auth';

// POST /api/settings/notifs - Save notification settings
export async function POST(request: NextRequest) {
  const { error } = await requireAuth();
  if (error) return error;

  try {
    const body = await request.json();
    const school = await db.school.findFirst();

    if (!school) {
      return NextResponse.json(
        { success: false, error: 'School not found. Please configure school settings first.' },
        { status: 404 }
      );
    }

    const settings = await db.systemSetting.upsert({
      where: {
        schoolId_settingKey: {
          schoolId: school.id,
          settingKey: 'notification_settings',
        },
      },
      update: {
        settingValue: JSON.stringify(body),
      },
      create: {
        schoolId: school.id,
        settingKey: 'notification_settings',
        settingValue: JSON.stringify(body),
        settingType: 'Notification',
      },
    });

    return NextResponse.json({
      success: true,
      data: settings,
      message: 'Notification settings saved successfully',
    });
  } catch (error) {
    console.error('Error saving notification settings:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to save notification settings' },
      { status: 500 }
    );
  }
}

// GET /api/settings/notifs - Get notification settings
export async function GET() {
  const { error } = await requireAuth();
  if (error) return error;

  try {
    const school = await db.school.findFirst();

    if (!school) {
      return NextResponse.json({ success: true, data: null });
    }

    const settings = await db.systemSetting.findUnique({
      where: {
        schoolId_settingKey: {
          schoolId: school.id,
          settingKey: 'notification_settings',
        },
      },
    });

    return NextResponse.json({
      success: true,
      data: settings ? JSON.parse(settings.settingValue) : null,
    });
  } catch (error) {
    console.error('Error fetching notification settings:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to fetch notification settings' },
      { status: 500 }
    );
  }
}
