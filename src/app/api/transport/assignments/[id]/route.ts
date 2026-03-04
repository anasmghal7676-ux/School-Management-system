import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';

export async function PATCH(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const body = await req.json();
    const assignment = await db.transportAssignment.update({ where: { id: (await params).id }, data: body });
    return NextResponse.json({ success: true, data: assignment });
  } catch (e: any) { return NextResponse.json({ success: false, error: e.message }, { status: 400 }); }
}

export async function DELETE(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    await db.transportAssignment.delete({ where: { id: (await params).id } });
    return NextResponse.json({ success: true });
  } catch (e: any) { return NextResponse.json({ success: false, error: e.message }, { status: 400 }); }
}
