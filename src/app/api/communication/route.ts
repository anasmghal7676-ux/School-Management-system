export const dynamic = 'force-dynamic';
import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { requireAuth } from '@/lib/api-auth';
export async function GET() {
  const { error } = await requireAuth();
  if (error) return error;

  try {
    const announcements = await db.announcement.findMany({ orderBy: { createdAt: 'desc' }, take: 100 });
    return NextResponse.json({ success: true, data: announcements });
  } catch (e: any) { return NextResponse.json({ success: false, error: e.message }, { status: 500 }); }
}
export async function POST(request: NextRequest) {
  const { error } = await requireAuth();
  if (error) return error;

  try {
    const body = await request.json();
    if (!body.title) return NextResponse.json({ success: false, error: 'title required' }, { status: 400 });
    const item = await db.announcement.create({ data: { schoolId: process.env.SCHOOL_ID || 'school_main', title: body.title, message: body.content || body.message || '', announcementType: body.announcementType || 'General', targetAudience: body.targetAudience || 'All', isActive: body.isPublished ?? true } });
    return NextResponse.json({ success: true, data: item }, { status: 201 });
  } catch (e: any) { return NextResponse.json({ success: false, error: e.message }, { status: 500 }); }
}
