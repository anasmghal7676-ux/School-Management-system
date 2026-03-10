#!/usr/bin/env node
const fs = require('fs');
const path = require('path');

// Map of short aliases to existing API paths
const aliases = {
  'acad-planner':    'academic-planner',
  'acad-sessions':   'acad-session',
  'adm-form':        'admission-form',
  'assets-track':    'asset-tracking',
  'att-reports':     'attendance-reports',
  'cert-builder':    'certificate-builder',
  'cls-gallery':     'class-photo-gallery',
  'cls-timetable':   'class-timetable',
  'co-curr':         'co-curricular',
  'comm-center':     'communication-center',
  'comm-log':        'communication-log',
  'electives':       'subject-electives',
  'events-mgmt':     'event-management',
  'exam-tt':         'exam-timetable',
  'exit-mgmt':       'exit-management',
  'expense-req':     'expense-requests',
  'fee-default':     'fee-defaulters',
  'fee-discount':    'fee-discounts',
  'fee-install':     'fee-installments',
  'fee-remind':      'fee-reminders',
  'hw-tracker':      'homework-tracker',
  'lab-mgmt':        'lab-management',
  'lost-found-p':    'lost-found-portal',
  'msg-tmpl':        'message-templates',
  'notifs':          'notifications',
  'online-adm':      'online-admission',
  'parent-comm':     'parent-communication',
  'parent-mtg':      'parent-meeting-scheduler',
  'parent-p':        'parent-portal',
  'q-bank':          'question-bank',
  'role-perms':      'role-permissions',
  'rpt-builder':     'report-builder',
  'rpt-cards':       'report-cards',
  'staff-bio':       'staff-biometric',
  'staff-xfer':      'staff-transfer',
  'stu-achieve':     'student-achievement',
  'stu-health':      'student-health',
  'stu-ledger':      'student-ledger',
  'stu-xfer':        'student-transfer',
  'student-ids':     'id-cards',
  'veh-maint':       'vehicle-maintenance',
  'venue-book':      'venue-booking',
};

// Stub routes for paths with no existing equivalent
const stubs = [
  'cmp-report',
  'cust-fields',
  'fin-reports',
  'hostel-att',
  'inv-req',
  'online-exam',
  'stu-feedback',
  'stu-portal',
  'stu-progress',
  'stu-stats',
  'teach-portal',
];

const apiDir = 'src/app/api';
let created = 0;

// Create proxy routes
for (const [alias, target] of Object.entries(aliases)) {
  const aliasDir = path.join(apiDir, alias);
  const targetDir = path.join(apiDir, target);
  
  if (fs.existsSync(aliasDir)) continue;
  if (!fs.existsSync(targetDir)) {
    console.log(`Target missing, creating stub for: ${alias} -> ${target}`);
    stubs.push(alias);
    continue;
  }
  
  // Create proxy that imports from target
  const relPath = path.relative(aliasDir, targetDir).replace(/\\/g, '/');
  const content = `export const dynamic = 'force-dynamic';
// Proxy route — delegates to ${target}
export { GET, POST, PUT, PATCH, DELETE } from '${relPath}/route';
`;
  
  fs.mkdirSync(aliasDir, { recursive: true });
  fs.writeFileSync(path.join(aliasDir, 'route.ts'), content);
  console.log(`Created proxy: /api/${alias} -> /api/${target}`);
  created++;
}

// Create stub routes for unknown paths
const stubContent = (name) => `export const dynamic = 'force-dynamic';
import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';

const KEY_PREFIX = '${name.replace(/-/g, '_')}:';

export async function GET(req: NextRequest) {
  try {
    const sp = req.nextUrl.searchParams;
    const page = parseInt(sp.get('page') || '1');
    const limit = parseInt(sp.get('limit') || '20');
    const search = sp.get('search') || '';
    
    const all = await db.systemSetting.findMany({
      where: { key: { startsWith: KEY_PREFIX } },
      orderBy: { updatedAt: 'desc' },
    });
    
    const items = all.map(s => ({ id: s.key.replace(KEY_PREFIX, ''), ...JSON.parse(s.value) }));
    const filtered = search ? items.filter((i: any) => JSON.stringify(i).toLowerCase().includes(search.toLowerCase())) : items;
    const paginated = filtered.slice((page - 1) * limit, page * limit);
    
    return NextResponse.json({ success: true, data: paginated, pagination: { total: filtered.length, page, limit } });
  } catch (e: any) {
    return NextResponse.json({ success: false, data: [], error: e.message });
  }
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const id = Date.now().toString();
    await db.systemSetting.create({ data: { key: KEY_PREFIX + id, value: JSON.stringify({ ...body, id, createdAt: new Date().toISOString() }) } });
    return NextResponse.json({ success: true, data: { id, ...body } });
  } catch (e: any) {
    return NextResponse.json({ success: false, error: e.message }, { status: 400 });
  }
}

export async function PATCH(req: NextRequest) {
  try {
    const { id, ...updates } = await req.json();
    const s = await db.systemSetting.findUnique({ where: { key: KEY_PREFIX + id } });
    if (!s) return NextResponse.json({ error: 'Not found' }, { status: 404 });
    const updated = { ...JSON.parse(s.value), ...updates, updatedAt: new Date().toISOString() };
    await db.systemSetting.update({ where: { key: KEY_PREFIX + id }, data: { value: JSON.stringify(updated) } });
    return NextResponse.json({ success: true, data: updated });
  } catch (e: any) {
    return NextResponse.json({ error: e.message }, { status: 400 });
  }
}

export async function PUT(req: NextRequest) { return PATCH(req); }

export async function DELETE(req: NextRequest) {
  try {
    const sp = req.nextUrl.searchParams;
    const id = sp.get('id') || (await req.json().catch(() => ({}))).id;
    await db.systemSetting.delete({ where: { key: KEY_PREFIX + id } });
    return NextResponse.json({ success: true });
  } catch (e: any) {
    return NextResponse.json({ error: e.message }, { status: 400 });
  }
}
`;

for (const stub of stubs) {
  const stubDir = path.join(apiDir, stub);
  if (fs.existsSync(stubDir)) continue;
  fs.mkdirSync(stubDir, { recursive: true });
  fs.writeFileSync(path.join(stubDir, 'route.ts'), stubContent(stub));
  console.log(`Created stub: /api/${stub}`);
  created++;
}

console.log(`\nTotal routes created: ${created}`);
