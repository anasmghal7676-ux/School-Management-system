export const dynamic = 'force-dynamic';
import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';
export async function GET() {
  try {
    const meetings = await db.parentTeacherMeeting.findMany({ include: { appointments: true }, orderBy: { scheduledDate: 'desc' }, take: 50 });
    return NextResponse.json({ success: true, data: meetings });
  } catch (e: any) { return NextResponse.json({ success: false, error: e.message }, { status: 500 }); }
}
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    if (!body.title || !body.scheduledDate) return NextResponse.json({ success: false, error: 'title and scheduledDate required' }, { status: 400 });
    const item = await db.parentTeacherMeeting.create({ data: { title: body.title, scheduledDate: new Date(body.scheduledDate), venue: body.venue || null, description: body.description || null, schoolId: body.schoolId || schoolId || 'school_default' } });
    return NextResponse.json({ success: true, data: item }, { status: 201 });
  } catch (e: any) { return NextResponse.json({ success: false, error: e.message }, { status: 500 }); }
}
