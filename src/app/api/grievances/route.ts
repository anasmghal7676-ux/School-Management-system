export const dynamic = 'force-dynamic';
import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';
export async function GET(request: NextRequest) {
  try {
    const sp = request.nextUrl.searchParams;
    const status = sp.get('status') || '';
    const where: any = {};
    if (status) where.status = status;
    const items = await db.complaint.findMany({ where, include: { student: true }, orderBy: { createdAt: 'desc' }, take: 100 });
    return NextResponse.json({ success: true, data: items });
  } catch (e: any) { return NextResponse.json({ success: false, error: e.message }, { status: 500 }); }
}
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    if (!body.subject) return NextResponse.json({ success: false, error: 'subject required' }, { status: 400 });
    const item = await db.complaint.create({ data: { subject: body.subject, description: body.description || '', complaintType: body.complaintType || 'General', status: 'Open', studentId: body.studentId || null } });
    return NextResponse.json({ success: true, data: item }, { status: 201 });
  } catch (e: any) { return NextResponse.json({ success: false, error: e.message }, { status: 500 }); }
}
