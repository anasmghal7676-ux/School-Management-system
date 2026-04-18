export const dynamic = 'force-dynamic';
import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { requireAuth } from '@/lib/api-auth';

export async function GET() {
  const { error } = await requireAuth();
  if (error) return error;

  try {
    const school = await db.school.findFirst({ where: { isActive: true } });
    if (!school) return NextResponse.json({ success: false, message: 'No school found' }, { status: 404 });
    return NextResponse.json({ success: true, data: school });
  } catch (error: any) {
    return NextResponse.json({ success: false, message: error.message }, { status: 500 });
  }
}

export async function PATCH(req: NextRequest) {
  const { error } = await requireAuth();
  if (error) return error;

  try {
    const body = await req.json();
    const school = await db.school.findFirst({ where: { isActive: true } });
    if (!school) return NextResponse.json({ success: false, message: 'No school found' }, { status: 404 });
    
    const updated = await db.school.update({
      where: { id: school.id },
      data: {
        name: body.name || school.name,
        address: body.address || school.address,
        city: body.city || school.city,
        province: body.province || school.province,
        country: body.country || school.country,
        postalCode: body.postalCode || school.postalCode,
        phone: body.phone || school.phone,
        email: body.email || school.email,
        website: body.website ?? school.website,
        principalName: body.principalName ?? school.principalName,
        motto: body.motto ?? school.motto,
        schoolType: body.type || school.schoolType,
        affiliation: body.affiliation || school.affiliation,
        registrationNumber: body.registrationNumber ?? school.registrationNumber,
      },
    });
    return NextResponse.json({ success: true, data: updated });
  } catch (error: any) {
    return NextResponse.json({ success: false, message: error.message }, { status: 500 });
  }
}
