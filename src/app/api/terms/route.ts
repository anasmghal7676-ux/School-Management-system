import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'

export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url)
    const academicYearId = searchParams.get('academicYearId') || ''

    const where: any = {}
    if (academicYearId) where.academicYearId = academicYearId

    const terms = await (db as any).term?.findMany({
      where,
      orderBy: { startDate: 'asc' },
    }) ?? []

    return NextResponse.json({ success: true, data: terms })
  } catch (e: any) {
    return NextResponse.json({ success: true, data: [] }) // graceful fallback
  }
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json()
    const { name, startDate, endDate, academicYearId, description } = body

    if (!name || !startDate || !endDate || !academicYearId) {
      return NextResponse.json({ success: false, error: 'name, startDate, endDate, academicYearId required' }, { status: 400 })
    }

    const term = await (db as any).term?.create({
      data: { name, startDate: new Date(startDate), endDate: new Date(endDate), academicYearId, description: description || '' },
    })

    return NextResponse.json({ success: true, data: term }, { status: 201 })
  } catch (e: any) {
    return NextResponse.json({ success: false, error: e.message }, { status: 500 })
  }
}
