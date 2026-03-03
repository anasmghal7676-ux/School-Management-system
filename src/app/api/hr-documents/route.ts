import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { requireAuth } from '@/lib/auth';

async function getAllDocs() {
  const settings = await prisma.systemSetting.findMany({
    where: { key: { startsWith: 'hr_doc_entry_' } },
    orderBy: { updatedAt: 'desc' },
  });
  return settings.map(s => JSON.parse(s.value));
}

export async function GET(req: NextRequest) {
  try {
    await requireAuth(req);
    const { searchParams } = new URL(req.url);
    const search = searchParams.get('search') || '';
    const docType = searchParams.get('docType') || '';
    const staffId = searchParams.get('staffId') || '';
    const status = searchParams.get('status') || '';
    const page = parseInt(searchParams.get('page') || '1');
    const limit = parseInt(searchParams.get('limit') || '20');

    let docs = await getAllDocs();

    if (search) {
      const s = search.toLowerCase();
      docs = docs.filter((d: any) =>
        d.staffName?.toLowerCase().includes(s) ||
        d.documentType?.toLowerCase().includes(s) ||
        d.fileName?.toLowerCase().includes(s) ||
        d.notes?.toLowerCase().includes(s)
      );
    }
    if (docType) docs = docs.filter((d: any) => d.documentType === docType);
    if (staffId) docs = docs.filter((d: any) => d.staffId === staffId);
    if (status) docs = docs.filter((d: any) => d.status === status);

    docs.sort((a: any, b: any) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());

    const total = docs.length;
    const paginated = docs.slice((page - 1) * limit, page * limit);

    const all = await getAllDocs();
    const summary = {
      total: all.length,
      verified: all.filter((d: any) => d.status === 'Verified').length,
      pending: all.filter((d: any) => d.status === 'Pending').length,
      expired: all.filter((d: any) => d.status === 'Expired').length,
    };

    const staff = await prisma.staff.findMany({
      where: { status: 'Active' },
      select: { id: true, fullName: true, employeeId: true, designation: true },
      orderBy: { fullName: 'asc' },
    });

    return NextResponse.json({ docs: paginated, total, summary, staff });
  } catch (e: any) {
    return NextResponse.json({ error: e.message }, { status: 400 });
  }
}

export async function POST(req: NextRequest) {
  try {
    await requireAuth(req);
    const body = await req.json();
    const id = `${Date.now()}_${Math.random().toString(36).slice(2, 7)}`;
    const doc = { id, ...body, createdAt: new Date().toISOString() };
    await prisma.systemSetting.create({
      data: { key: `hr_doc_entry_${id}`, value: JSON.stringify(doc) },
    });
    return NextResponse.json({ doc });
  } catch (e: any) {
    return NextResponse.json({ error: e.message }, { status: 400 });
  }
}

export async function PATCH(req: NextRequest) {
  try {
    await requireAuth(req);
    const body = await req.json();
    const { id, ...updates } = body;
    const setting = await prisma.systemSetting.findUnique({ where: { key: `hr_doc_entry_${id}` } });
    if (!setting) return NextResponse.json({ error: 'Not found' }, { status: 404 });
    const existing = JSON.parse(setting.value);
    const updated = { ...existing, ...updates };
    await prisma.systemSetting.update({
      where: { key: `hr_doc_entry_${id}` },
      data: { value: JSON.stringify(updated) },
    });
    return NextResponse.json({ doc: updated });
  } catch (e: any) {
    return NextResponse.json({ error: e.message }, { status: 400 });
  }
}

export async function DELETE(req: NextRequest) {
  try {
    await requireAuth(req);
    const { id } = await req.json();
    await prisma.systemSetting.delete({ where: { key: `hr_doc_entry_${id}` } });
    return NextResponse.json({ ok: true });
  } catch (e: any) {
    return NextResponse.json({ error: e.message }, { status: 400 });
  }
}
