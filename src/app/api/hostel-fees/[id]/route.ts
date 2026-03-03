import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'

async function getModel() { return (db as any)['hostelfee'] }

export async function GET(req: NextRequest, { params }: { params: { id: string } }) {
  try {
    const model = await getModel()
    if (!model) return NextResponse.json({ success: false, error: 'Not found' }, { status: 404 })
    const item = await model.findUnique({ where: { id: params.id } })
    if (!item) return NextResponse.json({ success: false, error: 'Not found' }, { status: 404 })
    return NextResponse.json({ success: true, data: item })
  } catch (e: any) { return NextResponse.json({ success: false, error: e.message }, { status: 500 }) }
}

export async function PATCH(req: NextRequest, { params }: { params: { id: string } }) {
  try {
    const body = await req.json()
    const model = await getModel()
    if (!model) return NextResponse.json({ success: false, error: 'Model not available' }, { status: 503 })
    const item = await model.update({ where: { id: params.id }, data: body })
    return NextResponse.json({ success: true, data: item })
  } catch (e: any) { return NextResponse.json({ success: false, error: e.message }, { status: 500 }) }
}

export async function DELETE(req: NextRequest, { params }: { params: { id: string } }) {
  try {
    const model = await getModel()
    if (!model) return NextResponse.json({ success: false, error: 'Model not available' }, { status: 503 })
    await model.delete({ where: { id: params.id } })
    return NextResponse.json({ success: true })
  } catch (e: any) { return NextResponse.json({ success: false, error: e.message }, { status: 500 }) }
}
