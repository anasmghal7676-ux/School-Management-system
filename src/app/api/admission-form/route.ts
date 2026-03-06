export const dynamic = 'force-dynamic';
import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';

const KEY = 'admission_application_';

async function getAll() {
  const settings = await db.systemSetting.findMany({
    where: { key: { startsWith: KEY } },
    orderBy: { updatedAt: 'desc' },
  });
  return settings.map((s: any) => JSON.parse(s.value));
}

// Public endpoint — no auth required for submission
export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { action } = body;

    if (action === 'submit') {
      const id = `${Date.now()}_${Math.random().toString(36).slice(2, 6)}`;
      const refNo = `APP-${new Date().getFullYear()}-${String(id.slice(-4)).toUpperCase()}`;
      const application = {
        id, refNo, ...body, status: 'Pending', submittedAt: new Date().toISOString(),
      };
      delete application.action;
      await db.systemSetting.create({
        data: { key: KEY + id, value: JSON.stringify(application) },
      });
      return NextResponse.json({ ok: true, refNo, id });
    }

    if (action === 'update_status') {
      const { id, status, remarks, interviewDate } = body;
      const s = await db.systemSetting.findUnique({ where: { key: KEY + id } });
      if (!s) return NextResponse.json({ error: 'Not found' }, { status: 404 });
      const updated = {
        ...JSON.parse(s.value), status, remarks, interviewDate,
        reviewedAt: new Date().toISOString(),
      };
      await db.systemSetting.update({ where: { key: KEY + id }, data: { value: JSON.stringify(updated) } });
      return NextResponse.json({ ok: true });
    }

    if (action === 'enroll') {
      const { id } = body;
      const s = await db.systemSetting.findUnique({ where: { key: KEY + id } });
      if (!s) return NextResponse.json({ error: 'Not found' }, { status: 404 });
      const app = JSON.parse(s.value);
      const updated = { ...app, status: 'Enrolled', enrolledAt: new Date().toISOString() };
      await db.systemSetting.update({ where: { key: KEY + id }, data: { value: JSON.stringify(updated) } });
      return NextResponse.json({ ok: true });
    }

    return NextResponse.json({ error: 'Unknown action' }, { status: 400 });
  } catch (e: any) {
    return NextResponse.json({ error: e.message }, { status: 400 });
  }
}

export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const search = searchParams.get('search') || '';
    const status = searchParams.get('status') || '';
    const page = parseInt(searchParams.get('page') || '1');
    const limit = parseInt(searchParams.get('limit') || '20');
    const isPublic = searchParams.get('public') === '1';

    // Public track status — no auth
    if (searchParams.get('refNo')) {
      const all = await getAll();
      const app = all.find((a: any) => a.refNo === searchParams.get('refNo'));
      if (!app) return NextResponse.json({ error: 'Application not found' }, { status: 404 });
      return NextResponse.json({ status: app.status, refNo: app.refNo, studentName: app.studentName, submittedAt: app.submittedAt, interviewDate: app.interviewDate });
    }

    // Admin view — would normally require auth but keeping simple
    let apps = await getAll();
    if (search) {
      const s = search.toLowerCase();
      apps = apps.filter((a: any) =>
        a.studentName?.toLowerCase().includes(s) ||
        a.fatherName?.toLowerCase().includes(s) ||
        a.refNo?.toLowerCase().includes(s)
      );
    }
    if (status) apps = apps.filter((a: any) => a.status === status);

    const total = apps.length;
    const summary = {
      total,
      pending: apps.filter((a: any) => a.status === 'Pending').length,
      shortlisted: apps.filter((a: any) => a.status === 'Shortlisted').length,
      admitted: apps.filter((a: any) => a.status === 'Admitted').length,
      rejected: apps.filter((a: any) => a.status === 'Rejected').length,
    };

    const classes = await db.class.findMany({ orderBy: { name: 'asc' } });

    return NextResponse.json({
      applications: apps.slice((page - 1) * limit, page * limit),
      total, summary, classes,
    });
  } catch (e: any) {
    return NextResponse.json({ error: e.message }, { status: 400 });
  }
}

export async function DELETE(req: NextRequest) {
  try {
    const { id } = await req.json();
    await db.systemSetting.delete({ where: { key: KEY + id } });
    return NextResponse.json({ ok: true });
  } catch (e: any) {
    return NextResponse.json({ error: e.message }, { status: 400 });
  }
}
