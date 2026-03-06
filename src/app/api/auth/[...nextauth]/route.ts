import { NextResponse } from 'next/server'
export const dynamic = 'force-dynamic'
export async function GET() { return NextResponse.json({ status: 'auth-disabled' }) }
export async function POST() { return NextResponse.json({ status: 'auth-disabled' }) }
