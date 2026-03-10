export const dynamic = 'force-dynamic';
import { NextRequest, NextResponse } from 'next/server';

export async function DELETE(_req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  // This route is read-only — delete returns success without action
  return NextResponse.json({ success: true });
}

export async function GET(_req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  return NextResponse.json({ success: false, error: 'Not found' }, { status: 404 });
}
