export const dynamic = 'force-dynamic';
import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { requireAuth } from '@/lib/api-auth';
export async function GET() {
  const { error } = await requireAuth();
  if (error) return error;

  try {
    const vendors = await (db as any).vendor.findMany({ orderBy: { name: 'asc' } });
    return NextResponse.json({ success: true, data: vendors });
  } catch (e: any) { return NextResponse.json({ success: false, error: e.message }, { status: 500 }); }
}
export async function POST(request: NextRequest) {
  const { error } = await requireAuth();
  if (error) return error;

  try {
    const body = await request.json();
    if (!body.name) return NextResponse.json({ success: false, error: 'name required' }, { status: 400 });
    const item = await (db as any).vendor.create({ data: {
      name: body.name, contactPerson: body.contactPerson || null, phone: body.phone || null,
      email: body.email || null, address: body.address || null, category: body.category || null,
      status: body.status || 'Active', schoolId: body.schoolId || 'school_main'
    }});
    return NextResponse.json({ success: true, data: item }, { status: 201 });
  } catch (e: any) { return NextResponse.json({ success: false, error: e.message }, { status: 500 }); }
}
