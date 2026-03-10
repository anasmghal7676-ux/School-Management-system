#!/usr/bin/env node
const fs = require('fs');
const path = require('path');

const apiDir = 'src/app/api';

// Find routes that need [id] subdirectory
const dirs = fs.readdirSync(apiDir).filter(d => {
  const full = path.join(apiDir, d);
  return fs.statSync(full).isDirectory();
});

let created = 0;

for (const dir of dirs) {
  const routeFile = path.join(apiDir, dir, 'route.ts');
  const idDir = path.join(apiDir, dir, '[id]');
  const idRoute = path.join(idDir, 'route.ts');

  if (!fs.existsSync(routeFile)) continue;
  if (fs.existsSync(idDir)) continue;

  const content = fs.readFileSync(routeFile, 'utf8');
  if (!content.includes('PUT') && !content.includes('PATCH') && !content.includes('DELETE')) continue;

  // Check if it's a systemSetting-based route
  const isSystemSetting = content.includes('systemSetting');
  
  // Find the key prefix used
  const keyMatch = content.match(/const\s+\w+_?KEY\s*=\s*['"`]([^'"`]+)['"`]/);
  const keyPrefix = keyMatch ? keyMatch[1] : `${dir}:`;

  // Find what db model is used (non-systemSetting)
  const modelMatch = content.match(/db\.(\w+)\.(findMany|findUnique|create|update|delete)/);
  const model = modelMatch ? modelMatch[1] : null;

  let idRouteContent = '';

  if (isSystemSetting) {
    idRouteContent = `export const dynamic = 'force-dynamic';
import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';

const KEY_PREFIX = '${keyPrefix}';

export async function GET(
  _req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const record = await db.systemSetting.findUnique({ where: { key: KEY_PREFIX + id } });
    if (!record) return NextResponse.json({ error: 'Not found' }, { status: 404 });
    return NextResponse.json({ data: JSON.parse(record.value) });
  } catch (e: any) {
    return NextResponse.json({ error: e.message }, { status: 500 });
  }
}

export async function PUT(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const updates = await req.json();
    const existing = await db.systemSetting.findUnique({ where: { key: KEY_PREFIX + id } });
    if (!existing) return NextResponse.json({ error: 'Not found' }, { status: 404 });
    const current = JSON.parse(existing.value);
    const updated = { ...current, ...updates, updatedAt: new Date().toISOString() };
    await db.systemSetting.update({ where: { key: KEY_PREFIX + id }, data: { value: JSON.stringify(updated) } });
    return NextResponse.json({ success: true, data: updated });
  } catch (e: any) {
    return NextResponse.json({ error: e.message }, { status: 500 });
  }
}

export async function PATCH(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  return PUT(req, { params });
}

export async function DELETE(
  _req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    await db.systemSetting.delete({ where: { key: KEY_PREFIX + id } });
    return NextResponse.json({ success: true });
  } catch (e: any) {
    return NextResponse.json({ error: e.message }, { status: 500 });
  }
}
`;
  } else if (model) {
    // capitalize first letter
    const Model = model.charAt(0).toUpperCase() + model.slice(1);
    idRouteContent = `export const dynamic = 'force-dynamic';
import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';

export async function GET(
  _req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const record = await (db as any).${model}.findUnique({ where: { id } });
    if (!record) return NextResponse.json({ error: 'Not found' }, { status: 404 });
    return NextResponse.json({ success: true, data: record });
  } catch (e: any) {
    return NextResponse.json({ success: false, error: e.message }, { status: 500 });
  }
}

export async function PUT(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const body = await req.json();
    const record = await (db as any).${model}.update({ where: { id }, data: body });
    return NextResponse.json({ success: true, data: record });
  } catch (e: any) {
    return NextResponse.json({ success: false, error: e.message }, { status: 500 });
  }
}

export async function PATCH(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  return PUT(req, { params });
}

export async function DELETE(
  _req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    await (db as any).${model}.delete({ where: { id } });
    return NextResponse.json({ success: true });
  } catch (e: any) {
    return NextResponse.json({ success: false, error: e.message }, { status: 500 });
  }
}
`;
  } else {
    continue; // Skip if we can't determine the model
  }

  fs.mkdirSync(idDir, { recursive: true });
  fs.writeFileSync(idRoute, idRouteContent);
  console.log(`Created: ${idRoute}`);
  created++;
}

console.log(`\nTotal [id] routes created: ${created}`);
