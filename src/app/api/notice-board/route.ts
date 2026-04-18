export const dynamic = 'force-dynamic';
import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { requireAuth } from '@/lib/api-auth';

const SCHOOL_ID = process.env.SCHOOL_ID || 'school_main';

export async function GET(request: NextRequest) {
  const { error } = await requireAuth();
  if (error) return error;

  try {
    const sp         = request.nextUrl.searchParams;
    const category   = sp.get('category')   || '';
    const audience   = sp.get('audience')   || '';
    const priority   = sp.get('priority')   || '';
    const search     = sp.get('search')     || '';
    const published  = sp.get('published');
    const page       = parseInt(sp.get('page')  || '1');
    const limit      = Math.min(parseInt(sp.get('limit') || '20'), 200);

    const where: any = { schoolId: SCHOOL_ID };
    if (category) where.category  = category;
    if (audience) where.audience  = audience;
    if (priority) where.priority  = priority;
    if (published !== null && published !== undefined) where.isPublished = published === 'true';
    if (search) {
      where.OR = [
        { title:   { contains: search, mode: 'insensitive' } },
        { content: { contains: search, mode: 'insensitive' } },
      ];
    }

    const [notices, total] = await Promise.all([
      (db as any).noticeBoard.findMany({
        where,
        orderBy: [{ priority: 'desc' }, { publishDate: 'desc' }],
        skip: (page - 1) * limit,
        take: limit,
      }),
      (db as any).noticeBoard.count({ where }),
    ]);

    // Summary counts
    const [urgent, active, expired] = await Promise.all([
      (db as any).noticeBoard.count({ where: { schoolId: SCHOOL_ID, priority: 'Urgent', isPublished: true } }),
      (db as any).noticeBoard.count({ where: { schoolId: SCHOOL_ID, isPublished: true,
        OR: [{ expiryDate: null }, { expiryDate: { gte: new Date() } }] } }),
      (db as any).noticeBoard.count({ where: { schoolId: SCHOOL_ID, expiryDate: { lt: new Date() } } }),
    ]);

    return NextResponse.json({
      success: true,
      data: {
        notices,
        pagination: { page, limit, total, totalPages: Math.ceil(total / limit) },
        summary: { urgent, active, expired, total: await (db as any).noticeBoard.count({ where: { schoolId: SCHOOL_ID } }) },
      },
    });
  } catch (error) {
    console.error('Notice board GET error:', error);
    return NextResponse.json({ success: false, message: 'Failed to fetch notices' }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  const { error } = await requireAuth();
  if (error) return error;

  try {
    const body = await request.json();
    if (!body.title || !body.content) {
      return NextResponse.json({ success: false, message: 'title and content are required' }, { status: 400 });
    }

    const notice = await (db as any).noticeBoard.create({
      data: {
        schoolId:    SCHOOL_ID,
        title:       body.title,
        content:     body.content,
        category:    body.category    || 'General',
        audience:    body.audience    || 'All',
        priority:    body.priority    || 'Normal',
        publishDate: body.publishDate ? new Date(body.publishDate) : new Date(),
        expiryDate:  body.expiryDate  ? new Date(body.expiryDate)  : null,
        isPublished: body.isPublished !== false,
        createdBy:   body.createdBy   || null,
      },
    });

    return NextResponse.json({ success: true, data: notice }, { status: 201 });
  } catch (error) {
    console.error('Notice board POST error:', error);
    return NextResponse.json({ success: false, message: 'Failed to create notice' }, { status: 500 });
  }
}

export async function PATCH(request: NextRequest) {
  const { error } = await requireAuth();
  if (error) return error;

  try {
    const body = await request.json();
    const { id, incrementView, ...updates } = body;
    if (!id) return NextResponse.json({ success: false, message: 'id required' }, { status: 400 });

    const data: any = {};
    if (incrementView) {
      // Just increment view count
      const notice = await (db as any).noticeBoard.update({
        where: { id }, data: { views: { increment: 1 } },
      });
      return NextResponse.json({ success: true, data: notice });
    }

    if (updates.title       !== undefined) data.title       = updates.title;
    if (updates.content     !== undefined) data.content     = updates.content;
    if (updates.category    !== undefined) data.category    = updates.category;
    if (updates.audience    !== undefined) data.audience    = updates.audience;
    if (updates.priority    !== undefined) data.priority    = updates.priority;
    if (updates.isPublished !== undefined) data.isPublished = updates.isPublished;
    if (updates.expiryDate  !== undefined) data.expiryDate  = updates.expiryDate ? new Date(updates.expiryDate) : null;
    if (updates.publishDate !== undefined) data.publishDate = new Date(updates.publishDate);

    const notice = await (db as any).noticeBoard.update({ where: { id }, data });
    return NextResponse.json({ success: true, data: notice });
  } catch (error) {
    console.error('Notice board PATCH error:', error);
    return NextResponse.json({ success: false, message: 'Failed to update notice' }, { status: 500 });
  }
}

export async function DELETE(request: NextRequest) {
  const { error } = await requireAuth();
  if (error) return error;

  try {
    const id = request.nextUrl.searchParams.get('id');
    if (!id) return NextResponse.json({ success: false, message: 'id required' }, { status: 400 });
    await (db as any).noticeBoard.delete({ where: { id } });
    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Notice board DELETE error:', error);
    return NextResponse.json({ success: false, message: 'Failed to delete notice' }, { status: 500 });
  }
}
