import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { requireAuth } from '@/lib/auth';

const VENUE_KEY = 'venue_';
const BOOKING_KEY = 'booking_';

async function getVenues() {
  const s = await prisma.systemSetting.findMany({ where: { key: { startsWith: VENUE_KEY } } });
  return s.map((x: any) => JSON.parse(x.value));
}
async function getBookings(date?: string) {
  const s = await prisma.systemSetting.findMany({ where: { key: { startsWith: BOOKING_KEY } }, orderBy: { updatedAt: 'desc' } });
  let bookings = s.map((x: any) => JSON.parse(x.value));
  if (date) bookings = bookings.filter((b: any) => b.bookingDate === date);
  return bookings;
}

export async function GET(req: NextRequest) {
  try {
    await requireAuth(req);
    const { searchParams } = new URL(req.url);
    const view = searchParams.get('view') || 'bookings';
    const date = searchParams.get('date') || '';
    const venueId = searchParams.get('venueId') || '';
    const search = searchParams.get('search') || '';
    const page = parseInt(searchParams.get('page') || '1');
    const limit = 20;

    const venues = await getVenues();
    const staff = await prisma.staff.findMany({ where: { status: 'Active' }, select: { id: true, fullName: true, designation: true }, orderBy: { fullName: 'asc' } });

    if (view === 'venues') {
      return NextResponse.json({ venues, staff });
    }

    let bookings = await getBookings(date || undefined);
    if (venueId) bookings = bookings.filter((b: any) => b.venueId === venueId);
    if (search) { const s = search.toLowerCase(); bookings = bookings.filter((b: any) => b.purpose?.toLowerCase().includes(s) || b.bookedBy?.toLowerCase().includes(s)); }
    bookings.sort((a: any, b: any) => {
      if (a.bookingDate !== b.bookingDate) return b.bookingDate.localeCompare(a.bookingDate);
      return a.startTime.localeCompare(b.startTime);
    });

    const today = new Date().toISOString().slice(0, 10);
    const summary = {
      totalVenues: venues.length,
      todayBookings: bookings.filter((b: any) => b.bookingDate === today).length,
      upcoming: bookings.filter((b: any) => b.bookingDate >= today && b.status === 'Approved').length,
      pending: bookings.filter((b: any) => b.status === 'Pending').length,
    };

    return NextResponse.json({ bookings: bookings.slice((page - 1) * limit, page * limit), total: bookings.length, venues, staff, summary });
  } catch (e: any) { return NextResponse.json({ error: e.message }, { status: 400 }); }
}

export async function POST(req: NextRequest) {
  try {
    await requireAuth(req);
    const body = await req.json();
    const id = `${Date.now()}_${Math.random().toString(36).slice(2, 6)}`;

    if (body.entity === 'venue') {
      const venue = { id, name: body.name, type: body.type, capacity: body.capacity, location: body.location, facilities: body.facilities, isActive: true, createdAt: new Date().toISOString() };
      await prisma.systemSetting.create({ data: { key: VENUE_KEY + id, value: JSON.stringify(venue) } });
      return NextResponse.json({ venue });
    }

    // Check for conflicts
    const existing = await getBookings(body.bookingDate);
    const conflict = existing.find((b: any) =>
      b.venueId === body.venueId &&
      b.status !== 'Rejected' &&
      b.id !== body.id &&
      ((body.startTime >= b.startTime && body.startTime < b.endTime) ||
        (body.endTime > b.startTime && body.endTime <= b.endTime) ||
        (body.startTime <= b.startTime && body.endTime >= b.endTime))
    );
    if (conflict) return NextResponse.json({ error: `Venue already booked ${conflict.startTime}–${conflict.endTime} for "${conflict.purpose}"` }, { status: 409 });

    const booking = { id, ...body, status: body.status || 'Pending', createdAt: new Date().toISOString() };
    await prisma.systemSetting.create({ data: { key: BOOKING_KEY + id, value: JSON.stringify(booking) } });
    return NextResponse.json({ booking });
  } catch (e: any) { return NextResponse.json({ error: e.message }, { status: 400 }); }
}

export async function PATCH(req: NextRequest) {
  try {
    await requireAuth(req);
    const { id, entity, ...updates } = await req.json();
    const prefix = entity === 'venue' ? VENUE_KEY : BOOKING_KEY;
    const s = await prisma.systemSetting.findUnique({ where: { key: prefix + id } });
    if (!s) return NextResponse.json({ error: 'Not found' }, { status: 404 });
    const updated = { ...JSON.parse(s.value), ...updates, updatedAt: new Date().toISOString() };
    await prisma.systemSetting.update({ where: { key: prefix + id }, data: { value: JSON.stringify(updated) } });
    return NextResponse.json({ item: updated });
  } catch (e: any) { return NextResponse.json({ error: e.message }, { status: 400 }); }
}

export async function DELETE(req: NextRequest) {
  try {
    await requireAuth(req);
    const { id, entity } = await req.json();
    const prefix = entity === 'venue' ? VENUE_KEY : BOOKING_KEY;
    await prisma.systemSetting.delete({ where: { key: prefix + id } });
    return NextResponse.json({ ok: true });
  } catch (e: any) { return NextResponse.json({ error: e.message }, { status: 400 }); }
}
