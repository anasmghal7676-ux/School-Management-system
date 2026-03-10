#!/usr/bin/env node
const fs = require('fs');
const path = require('path');

const apiDir = 'src/app/api';

// Map of alias to their target (same as before)
const proxyTargets = {
  'acad-planner':  'academic-planner',
  'adm-form':      'admission-form',
  'assets-track':  'asset-tracking',
  'att-reports':   'attendance-reports',
  'cert-builder':  'certificate-builder',
  'cls-gallery':   'class-photo-gallery',
  'cls-timetable': 'class-timetable',
  'co-curr':       'co-curricular',
  'comm-center':   'communication-center',
  'comm-log':      'communication-log',
  'electives':     'subject-electives',
  'events-mgmt':   'event-management',
  'exam-tt':       'exam-timetable',
  'exit-mgmt':     'exit-management',
  'expense-req':   'expense-requests',
  'fee-default':   'fee-defaulters',
  'fee-discount':  'fee-discounts',
  'fee-install':   'fee-installments',
  'fee-remind':    'fee-reminders',
  'hw-tracker':    'homework-tracker',
  'lab-mgmt':      'lab-management',
  'lost-found-p':  'lost-found-portal',
  'msg-tmpl':      'message-templates',
  'online-adm':    'online-admission',
  'parent-comm':   'parent-communication',
  'parent-mtg':    'parent-meeting-scheduler',
  'q-bank':        'question-bank',
  'role-perms':    'role-permissions',
  'rpt-builder':   'report-builder',
  'rpt-cards':     'report-cards',
  'staff-bio':     'staff-biometric',
  'staff-xfer':    'staff-transfer',
  'stu-achieve':   'student-achievement',
  'stu-health':    'student-health',
  'stu-ledger':    'student-ledger',
  'stu-xfer':      'student-transfer',
  'student-ids':   'id-cards',
  'veh-maint':     'vehicle-maintenance',
  'venue-book':    'venue-booking',
};

// Stub routes needing their own [id]
const stubRoutes = [
  'cmp-report', 'cust-fields', 'fin-reports', 'hostel-att', 'inv-req',
  'online-exam', 'stu-feedback', 'stu-portal', 'stu-progress', 'stu-stats', 'teach-portal',
];

let created = 0;

// For proxy routes, create [id] that proxies to target's [id]
for (const [alias, target] of Object.entries(proxyTargets)) {
  const aliasIdDir = path.join(apiDir, alias, '[id]');
  const targetIdDir = path.join(apiDir, target, '[id]');
  
  if (fs.existsSync(aliasIdDir)) continue;
  
  if (fs.existsSync(targetIdDir)) {
    // Target has [id], create proxy
    const relPath = path.relative(aliasIdDir, targetIdDir).replace(/\\/g, '/');
    const content = `export const dynamic = 'force-dynamic';
// Proxy [id] route — delegates to ${target}/[id]
export { GET, POST, PUT, PATCH, DELETE } from '${relPath}/route';
`;
    fs.mkdirSync(aliasIdDir, { recursive: true });
    fs.writeFileSync(path.join(aliasIdDir, 'route.ts'), content);
    console.log(`Created proxy [id]: /api/${alias}/[id] -> /api/${target}/[id]`);
  } else {
    // Target doesn't have [id], create standalone generic
    // Find key prefix from the target route
    const targetRoute = path.join(apiDir, target, 'route.ts');
    let keyPrefix = `${target.replace(/-/g, '_')}:`;
    if (fs.existsSync(targetRoute)) {
      const tc = fs.readFileSync(targetRoute, 'utf8');
      const km = tc.match(/const\s+\w+_?KEY\s*=\s*['"`]([^'"`]+)['"`]/);
      if (km) keyPrefix = km[1];
    }
    
    const content = `export const dynamic = 'force-dynamic';
import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';

const KEY_PREFIX = '${keyPrefix}';

export async function GET(_req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params;
    const record = await db.systemSetting.findUnique({ where: { key: KEY_PREFIX + id } });
    if (!record) return NextResponse.json({ error: 'Not found' }, { status: 404 });
    return NextResponse.json({ success: true, data: { id, ...JSON.parse(record.value) } });
  } catch (e: any) { return NextResponse.json({ error: e.message }, { status: 500 }); }
}

export async function PUT(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params;
    const updates = await req.json();
    const existing = await db.systemSetting.findUnique({ where: { key: KEY_PREFIX + id } });
    if (!existing) return NextResponse.json({ error: 'Not found' }, { status: 404 });
    const updated = { ...JSON.parse(existing.value), ...updates, updatedAt: new Date().toISOString() };
    await db.systemSetting.update({ where: { key: KEY_PREFIX + id }, data: { value: JSON.stringify(updated) } });
    return NextResponse.json({ success: true, data: updated });
  } catch (e: any) { return NextResponse.json({ error: e.message }, { status: 500 }); }
}

export async function PATCH(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  return PUT(req, { params });
}

export async function DELETE(_req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params;
    await db.systemSetting.delete({ where: { key: KEY_PREFIX + id } });
    return NextResponse.json({ success: true });
  } catch (e: any) { return NextResponse.json({ error: e.message }, { status: 500 }); }
}
`;
    fs.mkdirSync(aliasIdDir, { recursive: true });
    fs.writeFileSync(path.join(aliasIdDir, 'route.ts'), content);
    console.log(`Created standalone [id]: /api/${alias}/[id]`);
  }
  created++;
}

// Stub [id] routes
for (const stub of stubRoutes) {
  const stubIdDir = path.join(apiDir, stub, '[id]');
  if (fs.existsSync(stubIdDir)) continue;
  
  const keyPrefix = stub.replace(/-/g, '_') + ':';
  const content = `export const dynamic = 'force-dynamic';
import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';

const KEY_PREFIX = '${keyPrefix}';

export async function GET(_req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params;
    const record = await db.systemSetting.findUnique({ where: { key: KEY_PREFIX + id } });
    if (!record) return NextResponse.json({ error: 'Not found' }, { status: 404 });
    return NextResponse.json({ success: true, data: { id, ...JSON.parse(record.value) } });
  } catch (e: any) { return NextResponse.json({ error: e.message }, { status: 500 }); }
}

export async function PUT(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params;
    const updates = await req.json();
    const existing = await db.systemSetting.findUnique({ where: { key: KEY_PREFIX + id } });
    if (!existing) return NextResponse.json({ error: 'Not found' }, { status: 404 });
    const updated = { ...JSON.parse(existing.value), ...updates, updatedAt: new Date().toISOString() };
    await db.systemSetting.update({ where: { key: KEY_PREFIX + id }, data: { value: JSON.stringify(updated) } });
    return NextResponse.json({ success: true, data: updated });
  } catch (e: any) { return NextResponse.json({ error: e.message }, { status: 500 }); }
}

export async function PATCH(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  return PUT(req, { params });
}

export async function DELETE(_req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params;
    await db.systemSetting.delete({ where: { key: KEY_PREFIX + id } });
    return NextResponse.json({ success: true });
  } catch (e: any) { return NextResponse.json({ error: e.message }, { status: 500 }); }
}
`;
  fs.mkdirSync(stubIdDir, { recursive: true });
  fs.writeFileSync(path.join(stubIdDir, 'route.ts'), content);
  console.log(`Created stub [id]: /api/${stub}/[id]`);
  created++;
}

console.log(`\nTotal [id] routes created: ${created}`);
