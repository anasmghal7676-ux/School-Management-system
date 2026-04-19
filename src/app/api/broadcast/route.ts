export const dynamic = 'force-dynamic';
import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { requireAuth, requireLevel } from '@/lib/api-auth';
import { sendBulkSMS, SMS_TEMPLATES } from '@/lib/sms';

// POST /api/broadcast — Create announcement + send SMS/Email to target audience
export async function POST(request: NextRequest) {
  const { error, ctx } = await requireAuth();
  if (error) return error;
  if (!requireLevel(ctx, 5)) {
    return NextResponse.json({ success: false, error: 'Teacher+ role required' }, { status: 403 });
  }

  try {
    const body = await request.json();
    const { title, message, announcementType = 'General', targetAudience = 'All',
            targetClassId, targetSectionId, sendSMS: doSMS = false, sendEmail: doEmail = false } = body;

    if (!title || !message) {
      return NextResponse.json({ success: false, error: 'title and message are required' }, { status: 400 });
    }

    // Create announcement record
    const announcement = await db.announcement.create({
      data: {
        schoolId: process.env.SCHOOL_ID || 'school_main',
        title,
        message,
        announcementType,
        targetAudience,
        targetClassId:   targetClassId   || null,
        targetSectionId: targetSectionId || null,
        createdBy:       ctx.id,
        isActive:        true,
        publishedDate:   new Date(),
      },
    });

    const deliveryResults = { sms: { sent: 0, failed: 0 }, email: { sent: 0, failed: 0 } };

    // Send SMS if requested
    if (doSMS) {
      // Collect parent phone numbers based on audience
      const studentWhere: any = { status: 'active' };
      if (targetClassId)   studentWhere.currentClassId   = targetClassId;
      if (targetSectionId) studentWhere.currentSectionId = targetSectionId;

      let phones: { phone: string; name?: string }[] = [];

      if (targetAudience === 'Parents' || targetAudience === 'All') {
        const students = await db.student.findMany({
          where: studentWhere,
          select: { fullName: true, fatherPhone: true, motherPhone: true, guardianPhone: true },
          take: 500,
        });
        for (const s of students) {
          if (s.fatherPhone) phones.push({ phone: s.fatherPhone, name: s.fullName });
          if (s.motherPhone) phones.push({ phone: s.motherPhone, name: s.fullName });
        }
      }

      if (targetAudience === 'Teachers' || targetAudience === 'All') {
        const staff = await db.staff.findMany({
          where: { status: 'active' },
          select: { phone: true, firstName: true, lastName: true },
          take: 200,
        });
        for (const s of staff) {
          if (s.phone) phones.push({ phone: s.phone, name: `${s.firstName} ${s.lastName}` });
        }
      }

      // Deduplicate
      const seen = new Set<string>();
      phones = phones.filter(p => { if (seen.has(p.phone)) return false; seen.add(p.phone); return true; });

      if (phones.length > 0) {
        const smsText = `${title}: ${message} — Al-Noor School`;
        const result  = await sendBulkSMS(phones, smsText);
        deliveryResults.sms = { sent: result.sent, failed: result.failed };
      }
    }

    return NextResponse.json({
      success: true,
      data: announcement,
      delivery: deliveryResults,
      message: `Announcement created. SMS: ${deliveryResults.sms.sent} sent, ${deliveryResults.sms.failed} failed.`,
    }, { status: 201 });
  } catch (e: any) {
    console.error('Broadcast error:', e);
    return NextResponse.json({ success: false, error: e.message }, { status: 500 });
  }
}

// GET /api/broadcast — List announcements
export async function GET(request: NextRequest) {
  const { error } = await requireAuth();
  if (error) return error;

  try {
    const sp       = request.nextUrl.searchParams;
    const audience = sp.get('audience') || '';
    const classId  = sp.get('classId')  || '';
    const page     = parseInt(sp.get('page') || '1');
    const limit    = Math.min(parseInt(sp.get('limit') || '20'), 200);

    const where: any = {
      isActive: true,
      schoolId: process.env.SCHOOL_ID || 'school_main',
    };
    if (audience) where.targetAudience = { in: [audience, 'All'] };
    if (classId)  where.OR = [{ targetClassId: classId }, { targetClassId: null }];

    const [announcements, total] = await Promise.all([
      db.announcement.findMany({
        where,
        orderBy: { publishedDate: 'desc' },
        skip: (page - 1) * limit,
        take: limit,
      }),
      db.announcement.count({ where }),
    ]);

    return NextResponse.json({ success: true, data: announcements, total, page, limit });
  } catch (e: any) {
    return NextResponse.json({ success: false, error: e.message }, { status: 500 });
  }
}
