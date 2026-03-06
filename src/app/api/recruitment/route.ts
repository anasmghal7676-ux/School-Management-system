export const dynamic = 'force-dynamic';
import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { requireAuth } from '@/lib/api-auth';

async function getJobs() {
  const s = await db.systemSetting.findMany({ where: { key: { startsWith: 'recruit_job_' } } });
  return s.map(x => JSON.parse(x.value));
}
async function getApplications(jobId?: string) {
  const where: any = { key: { startsWith: 'recruit_app_' } };
  const s = await db.systemSetting.findMany({ where, orderBy: { updatedAt: 'desc' } });
  const apps = s.map(x => JSON.parse(x.value));
  return jobId ? apps.filter((a: any) => a.jobId === jobId) : apps;
}

export async function GET(req: NextRequest) {
  try {
    await requireAuth(req);
    const { searchParams } = new URL(req.url);
    const view = searchParams.get('view') || 'jobs'; // jobs | applications
    const jobId = searchParams.get('jobId') || '';
    const status = searchParams.get('status') || '';
    const search = searchParams.get('search') || '';

    if (view === 'applications') {
      let apps = await getApplications(jobId || undefined);
      if (status) apps = apps.filter((a: any) => a.status === status);
      if (search) {
        const s = search.toLowerCase();
        apps = apps.filter((a: any) => a.applicantName?.toLowerCase().includes(s) || a.email?.toLowerCase().includes(s));
      }
      apps.sort((a: any, b: any) => new Date(b.appliedAt).getTime() - new Date(a.appliedAt).getTime());

      const jobs = await getJobs();
      const summary = {
        total: apps.length,
        new: apps.filter((a: any) => a.status === 'New').length,
        shortlisted: apps.filter((a: any) => a.status === 'Shortlisted').length,
        interviewed: apps.filter((a: any) => a.status === 'Interviewed').length,
        hired: apps.filter((a: any) => a.status === 'Hired').length,
        rejected: apps.filter((a: any) => a.status === 'Rejected').length,
      };
      return NextResponse.json({ applications: apps, summary, jobs });
    }

    // Jobs
    let jobs = await getJobs();
    if (status) jobs = jobs.filter((j: any) => j.status === status);
    if (search) {
      const s = search.toLowerCase();
      jobs = jobs.filter((j: any) => j.title?.toLowerCase().includes(s) || j.department?.toLowerCase().includes(s));
    }
    jobs.sort((a: any, b: any) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());

    const allApps = await getApplications();
    const summary = {
      total: jobs.length,
      open: jobs.filter((j: any) => j.status === 'Open').length,
      closed: jobs.filter((j: any) => j.status === 'Closed').length,
      totalApplicants: allApps.length,
    };

    return NextResponse.json({ jobs, summary });
  } catch (e: any) {
    return NextResponse.json({ error: e.message }, { status: 400 });
  }
}

export async function POST(req: NextRequest) {
  try {
    await requireAuth(req);
    const body = await req.json();
    const { type } = body;
    const id = `${Date.now()}_${Math.random().toString(36).slice(2, 6)}`;

    if (type === 'application') {
      const app = { id, ...body, status: 'New', appliedAt: new Date().toISOString() };
      await db.systemSetting.create({ data: { key: `recruit_app_${id}`, value: JSON.stringify(app) } });
      return NextResponse.json({ application: app });
    }

    const job = { id, ...body, status: body.status || 'Open', createdAt: new Date().toISOString() };
    await db.systemSetting.create({ data: { key: `recruit_job_${id}`, value: JSON.stringify(job) } });
    return NextResponse.json({ job });
  } catch (e: any) {
    return NextResponse.json({ error: e.message }, { status: 400 });
  }
}

export async function PATCH(req: NextRequest) {
  try {
    await requireAuth(req);
    const body = await req.json();
    const { id, entityType, ...updates } = body;
    const key = entityType === 'application' ? `recruit_app_${id}` : `recruit_job_${id}`;
    const setting = await db.systemSetting.findUnique({ where: { key } });
    if (!setting) return NextResponse.json({ error: 'Not found' }, { status: 404 });
    const existing = JSON.parse(setting.value);
    const updated = { ...existing, ...updates, updatedAt: new Date().toISOString() };
    await db.systemSetting.update({ where: { key }, data: { value: JSON.stringify(updated) } });
    return NextResponse.json({ updated });
  } catch (e: any) {
    return NextResponse.json({ error: e.message }, { status: 400 });
  }
}

export async function DELETE(req: NextRequest) {
  try {
    await requireAuth(req);
    const { id, entityType } = await req.json();
    const key = entityType === 'application' ? `recruit_app_${id}` : `recruit_job_${id}`;
    await db.systemSetting.delete({ where: { key } });
    return NextResponse.json({ ok: true });
  } catch (e: any) {
    return NextResponse.json({ error: e.message }, { status: 400 });
  }
}
