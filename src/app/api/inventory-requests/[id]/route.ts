export const dynamic = 'force-dynamic';
import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'
import { requireAuth } from '@/lib/api-auth';

async function getModel() { return (db as any)['inventoryrequest'] }

export async function GET(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { error } = await requireAuth();
  if (error) return error;

  try {
    const model = await getModel()
    if (!model) return NextResponse.json({ success: false, error: 'Not found' }, { status: 404 })
    const item = await model.findUnique({ where: { id: (await params).id } })
    if (!item) return NextResponse.json({ success: false, error: 'Not found' }, { status: 404 })
    return NextResponse.json({ success: true, data: item })
  } catch (e: any) { return NextResponse.json({ success: false, error: e.message }, { status: 500 }) }
}

export async function PATCH(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { error } = await requireAuth();
  if (error) return error;

  try {
    const body = await req.json()
    const model = await getModel()
    if (!model) return NextResponse.json({ success: false, error: 'Model not available' }, { status: 503 })
    const item = await model.update({ where: { id: (await params).id }, data: body })
    return NextResponse.json({ success: true, data: item })
  } catch (e: any) { return NextResponse.json({ success: false, error: e.message }, { status: 500 }) }
}

export async function DELETE(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { error } = await requireAuth();
  if (error) return error;

  try {
    const model = await getModel()
    if (!model) return NextResponse.json({ success: false, error: 'Model not available' }, { status: 503 })
    await model.delete({ where: { id: (await params).id } })
    return NextResponse.json({ success: true })
  } catch (e: any) { return NextResponse.json({ success: false, error: e.message }, { status: 500 }) }
}
