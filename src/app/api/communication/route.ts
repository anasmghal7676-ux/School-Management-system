export const dynamic = 'force-dynamic';
import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';
export async function GET() {
  try {
    const announcements = await db.announcement.findMany({ orderBy: { createdAt: 'desc' }, take: 100 });
    return NextResponse.json({ success: true, data: announcements });
  } catch (e: any) { return NextResponse.json({ success: false, error: e.message }, { status: 500 }); }
}
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    if (!body.title) return NextResponse.json({ success: false, error: 'title required' }, { status: 400 });
    const item = await db.announcement.create({ data: { title: body.title, content: body.content || '', targetAudience: body.targetAudience || 'All', isPublished: body.isPublished ?? true } });
    return NextResponse.json({ success: true, data: item }, { status: 201 });
  } catch (e: any) { return NextResponse.json({ success: false, error: e.message }, { status: 500 }); }
}
