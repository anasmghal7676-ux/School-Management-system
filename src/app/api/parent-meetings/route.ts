export const dynamic = 'force-dynamic';
import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { requireAuth } from '@/lib/api-auth';
export async function GET() {
  const { error } = await requireAuth();
  if (error) return error;

  try {
    const meetings = await db.parentTeacherMeeting.findMany({ include: { appointments: true }, orderBy: { meetingDate: 'desc' }, take: 50 });
    return NextResponse.json({ success: true, data: meetings });
  } catch (e: any) { return NextResponse.json({ success: false, error: e.message }, { status: 500 }); }
}
export async function POST(request: NextRequest) {
  const { error } = await requireAuth();
  if (error) return error;

  try {
    const body = await request.json();
    if (!body.title || !body.meetingDate) return NextResponse.json({ success: false, error: 'title and meetingDate required' }, { status: 400 });
    const item = await db.parentTeacherMeeting.create({ data: { title: body.title, meetingDate: new Date(body.meetingDate), startTime: body.startTime || '09:00', endTime: body.endTime || '12:00', venue: body.venue || null, description: body.description || null, schoolId: body.schoolId || 'school_main' } });
    return NextResponse.json({ success: true, data: item }, { status: 201 });
  } catch (e: any) { return NextResponse.json({ success: false, error: e.message }, { status: 500 }); }
}
