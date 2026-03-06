export const dynamic = 'force-dynamic';
import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'

const MODEL = 'contract' // Prisma model name

async function getModel() {
  return (db as any)[MODEL]
}

export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url)
    const page  = parseInt(searchParams.get('page')  || '1')
    const limit = parseInt(searchParams.get('limit') || '50')

    const model = await getModel()
    if (!model) return NextResponse.json({ success: true, data: { items: [], total: 0 } })

    const [items, total] = await Promise.all([
      model.findMany({ orderBy: { createdAt: 'desc' }, skip: (page-1)*limit, take: limit }),
      model.count(),
    ])

    return NextResponse.json({ success: true, data: { items, total, page } })
  } catch (e: any) {
    return NextResponse.json({ success: true, data: { items: [], total: 0 } })
  }
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json()
    const model = await getModel()
    if (!model) return NextResponse.json({ success: false, error: 'Model not available' }, { status: 503 })

    const item = await model.create({ data: body })
    return NextResponse.json({ success: true, data: item }, { status: 201 })
  } catch (e: any) {
    return NextResponse.json({ success: false, error: e.message }, { status: 500 })
  }
}
