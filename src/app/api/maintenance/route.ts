export const dynamic = 'force-dynamic';
import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';
export async function GET(request: NextRequest) {
  try {
    const items = await db.incidentReport.findMany({ orderBy: { createdAt: 'desc' }, take: 100 });
    return NextResponse.json({ success: true, data: items });
  } catch (e: any) { return NextResponse.json({ success: false, error: e.message }, { status: 500 }); }
}
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    if (!body.title) return NextResponse.json({ success: false, error: 'title required' }, { status: 400 });
    const item = await db.incidentReport.create({ data: { title: body.title, description: body.description || '', incidentType: body.incidentType || 'Maintenance', reportedBy: body.reportedBy || 'Staff', incidentDate: body.incidentDate ? new Date(body.incidentDate) : new Date(), status: body.status || 'Open', location: body.location || null } });
    return NextResponse.json({ success: true, data: item }, { status: 201 });
  } catch (e: any) { return NextResponse.json({ success: false, error: e.message }, { status: 500 }); }
}
