export const dynamic = 'force-dynamic';
import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { requireAuth } from '@/lib/api-auth';

async function getTransfers() {
  const s = await db.systemSetting.findMany({ where: { key: { startsWith: 'transfer_' } }, orderBy: { updatedAt: 'desc' } });
  return s.map(x => JSON.parse(x.value));
}

export async function GET(req: NextRequest) {
  try {
    await requireAuth(req);
    const { searchParams } = new URL(req.url);
    const search = searchParams.get('search') || '';
    const status = searchParams.get('status') || '';
    const type = searchParams.get('type') || '';
    const page = parseInt(searchParams.get('page') || '1');
    const limit = 20;

    let transfers = await getTransfers();
    if (status) transfers = transfers.filter((t: any) => t.status === status);
    if (type) transfers = transfers.filter((t: any) => t.type === type);
    if (search) {
      const q = search.toLowerCase();
      transfers = transfers.filter((t: any) =>
        t.studentName?.toLowerCase().includes(q) || t.admissionNumber?.toLowerCase().includes(q) || t.tcNumber?.toLowerCase().includes(q)
      );
    }
    transfers.sort((a: any, b: any) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());

    const total = transfers.length;
    const paginated = transfers.slice((page - 1) * limit, page * limit);

    const summary = {
      total: transfers.length,
      pending: transfers.filter((t: any) => t.status === 'Pending').length,
      approved: transfers.filter((t: any) => t.status === 'Approved').length,
      issued: transfers.filter((t: any) => t.status === 'TC Issued').length,
    };

    // Students for dropdown
    const students = await db.student.findMany({
      where: { status: 'Active' },
      select: { id: true, fullName: true, admissionNumber: true, class: { select: { name: true } }, section: { select: { name: true } } },
      orderBy: { fullName: 'asc' },
    });

    return NextResponse.json({ transfers: paginated, total, summary, students });
  } catch (e: any) {
    return NextResponse.json({ error: e.message }, { status: 400 });
  }
}

export async function POST(req: NextRequest) {
  try {
    await requireAuth(req);
    const body = await req.json();
    const id = `${Date.now()}_${Math.random().toString(36).slice(2, 6)}`;

    // Generate TC number
    const allTransfers = await getTransfers();
    const tcNum = String(allTransfers.length + 1001).padStart(4, '0');
    const tcNumber = `TC-${new Date().getFullYear()}-${tcNum}`;

    const transfer = { id, tcNumber, ...body, status: 'Pending', createdAt: new Date().toISOString() };
    await db.systemSetting.create({ data: { key: `transfer_${id}`, value: JSON.stringify(transfer) } });
    return NextResponse.json({ transfer });
  } catch (e: any) {
    return NextResponse.json({ error: e.message }, { status: 400 });
  }
}

export async function PATCH(req: NextRequest) {
  try {
    await requireAuth(req);
    const body = await req.json();
    const { id, ...updates } = body;
    const setting = await db.systemSetting.findUnique({ where: { key: `transfer_${id}` } });
    if (!setting) return NextResponse.json({ error: 'Not found' }, { status: 404 });
    const updated = { ...JSON.parse(setting.value), ...updates, updatedAt: new Date().toISOString() };

    // If marking as TC Issued, set issue date and update student status
    if (updates.status === 'TC Issued') {
      updated.issuedDate = new Date().toISOString().slice(0, 10);
      // Mark student as Left
      if (updated.studentId) {
        await db.student.update({ where: { id: updated.studentId }, data: { status: 'Left' } }).catch(() => {});
      }
    }

    await db.systemSetting.update({ where: { key: `transfer_${id}` }, data: { value: JSON.stringify(updated) } });
    return NextResponse.json({ transfer: updated });
  } catch (e: any) {
    return NextResponse.json({ error: e.message }, { status: 400 });
  }
}

export async function DELETE(req: NextRequest) {
  try {
    await requireAuth(req);
    const { id } = await req.json();
    await db.systemSetting.delete({ where: { key: `transfer_${id}` } });
    return NextResponse.json({ ok: true });
  } catch (e: any) {
    return NextResponse.json({ error: e.message }, { status: 400 });
  }
}
