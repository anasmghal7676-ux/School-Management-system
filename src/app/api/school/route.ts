export const dynamic = 'force-dynamic';
import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth/auth-options";

export async function GET() {
  try {
    const school = await db.school.findFirst({
      include: {
        academicYears: { where: { isCurrent: true }, take: 1 },
        _count: { select: { students: true, staffMembers: true, classes: true } },
      },
    });
    if (!school) return NextResponse.json({ error: "No school found" }, { status: 404 });
    return NextResponse.json({ success: true, data: school });
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}

export async function PUT(req: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const body = await req.json();
    const school = await db.school.findFirst();
    if (!school) return NextResponse.json({ error: "School not found" }, { status: 404 });

    const {
      name, code, address, city, province, phone, email,
      website, board, affiliation, principalName, motto,
      schoolType, mediumOfInstruction, registrationNumber,
    } = body;

    const updated = await db.school.update({
      where: { id: school.id },
      data: {
        name: name?.trim() || school.name,
        code: code?.trim() || school.code,
        address: address?.trim() || school.address,
        city: city?.trim() || school.city,
        province: province?.trim() || school.province,
        phone: phone?.trim() || school.phone,
        email: email?.trim() || school.email,
        website: website?.trim() || null,
        board: board || school.board,
        affiliation: affiliation || school.affiliation,
        principalName: principalName?.trim() || null,
        motto: motto?.trim() || null,
        schoolType: schoolType || school.schoolType,
        mediumOfInstruction: mediumOfInstruction || school.mediumOfInstruction,
        registrationNumber: registrationNumber?.trim() || null,
      },
    });

    return NextResponse.json({ success: true, data: updated });
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}
