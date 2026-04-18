export const dynamic = 'force-dynamic';
import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { requireAuth } from '@/lib/api-auth';

const SCHOOL_ID = process.env.SCHOOL_ID || 'school_main';

export async function GET(request: NextRequest) {
  const { error } = await requireAuth();
  if (error) return error;

  try {
    const sp     = request.nextUrl.searchParams;
    const status = sp.get('status') || '';
    const date   = sp.get('date')   || '';
    const page   = parseInt(sp.get('page')  || '1');
    const limit  = Math.min(parseInt(sp.get('limit') || '25'), 200);

    const where: any = { schoolId: SCHOOL_ID };
    if (status) where.status   = status;
    if (date)   where.meetingDate = { gte: new Date(date) };

    const [meetings, total] = await Promise.all([
      (db as any).parentMeeting.findMany({
        where,
        orderBy: [{ meetingDate: 'asc' }, { slot: 'asc' }],
        skip:    (page - 1) * limit,
        take:    limit,
      }).catch(() => []),
      (db as any).parentMeeting.count({ where }).catch(() => 0),
    ]);

    // Fallback: if parentMeeting model doesn't exist, use system settings as storage
    if (!meetings && total === 0) {
      const setting = await db.systemSetting.findUnique({ where: { schoolId_settingKey: { schoolId: process.env.SCHOOL_ID || 'school_main', settingKey: 'ptm_meetings' } } });
      const stored  = setting ? JSON.parse(setting.settingValue || '[]') : [];
      const filtered = stored.filter((m: any) => {
        if (status && m.status !== status) return false;
        if (date && m.meetingDate < date) return false;
        return true;
      });
      const paginated = filtered.slice((page - 1) * limit, page * limit);

      const summary = {
        total:      filtered.length,
        scheduled:  filtered.filter((m: any) => m.status === 'Scheduled').length,
        completed:  filtered.filter((m: any) => m.status === 'Completed').length,
        cancelled:  filtered.filter((m: any) => m.status === 'Cancelled').length,
        today:      filtered.filter((m: any) => m.meetingDate === new Date().toISOString().slice(0, 10)).length,
      };

      return NextResponse.json({
        success: true,
        data: { meetings: paginated, pagination: { page, limit, total: filtered.length, totalPages: Math.ceil(filtered.length / limit) }, summary },
      });
    }

    const summary = {
      total,
      scheduled: await (db as any).parentMeeting.count({ where: { ...where, status: 'Scheduled' } }).catch(() => 0),
      completed: await (db as any).parentMeeting.count({ where: { ...where, status: 'Completed' } }).catch(() => 0),
      cancelled: await (db as any).parentMeeting.count({ where: { ...where, status: 'Cancelled' } }).catch(() => 0),
      today:     await (db as any).parentMeeting.count({ where: { ...where, meetingDate: { gte: new Date(new Date().toDateString()), lt: new Date(new Date(new Date().toDateString()).getTime() + 86400000) } } }).catch(() => 0),
    };

    return NextResponse.json({
      success: true,
      data: { meetings, pagination: { page, limit, total, totalPages: Math.ceil(total / limit) }, summary },
    });
  } catch (error) {
    console.error('Meetings GET error:', error);
    return NextResponse.json({ success: false, message: 'Failed to fetch meetings' }, { status: 500 });
  }
}

// POST — create meeting (stored in system settings as JSON list)
export async function POST(request: NextRequest) {
  const { error } = await requireAuth();
  if (error) return error;

  try {
    const body = await request.json();
    const { parentName, parentPhone, studentName, admissionNo, teacherName, subject, meetingDate, slot, purpose, notes, className } = body;

    if (!parentName || !meetingDate || !teacherName || !slot) {
      return NextResponse.json({ success: false, message: 'parentName, meetingDate, teacherName, slot required' }, { status: 400 });
    }

    const meeting = {
      id:           `mtg_${Date.now()}_${Math.random().toString(36).slice(2, 8)}`,
      schoolId:     SCHOOL_ID,
      parentName,   parentPhone: parentPhone || '',
      studentName:  studentName  || '',
      admissionNo:  admissionNo  || '',
      teacherName,  subject:     subject     || '',
      meetingDate,  slot,        purpose:    purpose || '',
      notes:        notes        || '',
      className:    className    || '',
      status:       'Scheduled',
      createdAt:    new Date().toISOString(),
    };

    // Store in system settings
    const setting = await db.systemSetting.findUnique({ where: { schoolId_settingKey: { schoolId: process.env.SCHOOL_ID || 'school_main', settingKey: 'ptm_meetings' } } });
    const list    = setting ? JSON.parse(setting.settingValue || '[]') : [];

    // Check for slot conflict
    const conflict = list.find((m: any) =>
      m.meetingDate === meetingDate && m.slot === slot && m.teacherName === teacherName && m.status !== 'Cancelled'
    );
    if (conflict) {
      return NextResponse.json({ success: false, message: `${teacherName} already has a meeting at this slot` }, { status: 409 });
    }

    list.push(meeting);
    await db.systemSetting.upsert({
      where: { schoolId_settingKey: { schoolId: process.env.SCHOOL_ID || 'school_main', settingKey: 'ptm_meetings' } },
      create: { settingKey: 'ptm_meetings', settingValue: JSON.stringify(list), schoolId: process.env.SCHOOL_ID || 'school_main', settingType: 'General' },
      update: { settingValue: JSON.stringify(list) },
    });

    return NextResponse.json({ success: true, data: meeting }, { status: 201 });
  } catch (error) {
    console.error('Meeting POST error:', error);
    return NextResponse.json({ success: false, message: 'Failed to create meeting' }, { status: 500 });
  }
}

export async function PATCH(request: NextRequest) {
  const { error } = await requireAuth();
  if (error) return error;

  try {
    const body = await request.json();
    const { id, status, notes, outcome } = body;

    if (!id) return NextResponse.json({ success: false, message: 'id required' }, { status: 400 });

    const setting = await db.systemSetting.findUnique({ where: { schoolId_settingKey: { schoolId: process.env.SCHOOL_ID || 'school_main', settingKey: 'ptm_meetings' } } });
    const list    = setting ? JSON.parse(setting.settingValue || '[]') : [];
    const idx     = list.findIndex((m: any) => m.id === id);

    if (idx === -1) return NextResponse.json({ success: false, message: 'Meeting not found' }, { status: 404 });

    if (status)  list[idx].status  = status;
    if (notes)   list[idx].notes   = notes;
    if (outcome) list[idx].outcome = outcome;

    await db.systemSetting.update({ where: { schoolId_settingKey: { schoolId: process.env.SCHOOL_ID || 'school_main', settingKey: 'ptm_meetings' } }, data: { settingValue: JSON.stringify(list) } });
    return NextResponse.json({ success: true, data: list[idx] });
  } catch (error) {
    return NextResponse.json({ success: false, message: 'Update failed' }, { status: 500 });
  }
}

export async function DELETE(request: NextRequest) {
  const { error } = await requireAuth();
  if (error) return error;

  try {
    const id = request.nextUrl.searchParams.get('id');
    if (!id) return NextResponse.json({ success: false, message: 'id required' }, { status: 400 });

    const setting = await db.systemSetting.findUnique({ where: { schoolId_settingKey: { schoolId: process.env.SCHOOL_ID || 'school_main', settingKey: 'ptm_meetings' } } });
    const list    = setting ? JSON.parse(setting.settingValue || '[]') : [];
    const updated = list.filter((m: any) => m.id !== id);

    await db.systemSetting.update({ where: { schoolId_settingKey: { schoolId: process.env.SCHOOL_ID || 'school_main', settingKey: 'ptm_meetings' } }, data: { settingValue: JSON.stringify(updated) } });
    return NextResponse.json({ success: true });
  } catch (error) {
    return NextResponse.json({ success: false, message: 'Delete failed' }, { status: 500 });
  }
}
