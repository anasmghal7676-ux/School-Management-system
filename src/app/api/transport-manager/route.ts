export const dynamic = 'force-dynamic';
import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { requireAuth } from '@/lib/api-auth';

export async function GET(req: NextRequest) {
  try {
    await requireAuth(req);
    const { searchParams } = new URL(req.url);
    const search = searchParams.get('search') || '';

    const school = await db.school.findFirst();
    if (!school) return NextResponse.json({ routes: [], vehicles: [], summary: {} });

    const where: any = { schoolId: school.id };
    if (search) where.routeName = { contains: search, mode: 'insensitive' };

    const routes = await db.transportRoute.findMany({
      where,
      include: {
        stops: { orderBy: { stopOrder: 'asc' } },
        vehicle: true,
        assignments: { where: { status: 'active' }, include: { student: { select: { id: true, fullName: true, admissionNumber: true } } } },
      },
      orderBy: { routeNumber: 'asc' },
    });

    const vehicles = await db.transportVehicle.findMany({
      where: { schoolId: school.id },
      orderBy: { vehicleNumber: 'asc' },
    });

    const summary = {
      totalRoutes: routes.length,
      activeRoutes: routes.filter((r: any) => r.isActive).length,
      totalVehicles: vehicles.length,
      totalStudents: routes.reduce((s: number, r: any) => s + r.assignments.length, 0),
    };

    return NextResponse.json({ routes, vehicles, summary });
  } catch (e: any) {
    return NextResponse.json({ error: e.message }, { status: 400 });
  }
}

export async function POST(req: NextRequest) {
  try {
    await requireAuth(req);
    const body = await req.json();
    const { entity } = body;
    const school = await db.school.findFirst();
    if (!school) return NextResponse.json({ error: 'No school found' }, { status: 400 });

    if (entity === 'route') {
      const route = await db.transportRoute.create({
        data: {
          schoolId: school.id,
          routeNumber: body.routeNumber,
          routeName: body.routeName,
          startingPoint: body.startingPoint,
          endingPoint: body.endingPoint,
          totalDistanceKm: body.totalDistanceKm ? parseFloat(body.totalDistanceKm) : null,
          pickupTime: body.pickupTime || null,
          dropTime: body.dropTime || null,
          monthlyFee: body.monthlyFee ? parseFloat(body.monthlyFee) : null,
          vehicleId: body.vehicleId || null,
          isActive: body.isActive !== false,
          description: body.description || null,
        },
        include: { stops: true, vehicle: true, assignments: true },
      });
      return NextResponse.json({ route });
    }

    if (entity === 'stop') {
      const stop = await db.transportStop.create({
        data: {
          routeId: body.routeId,
          stopName: body.stopName,
          stopOrder: parseInt(body.stopOrder) || 1,
          estimatedTime: body.estimatedTime || null,
          landmark: body.landmark || null,
        },
      });
      return NextResponse.json({ stop });
    }

    if (entity === 'vehicle') {
      const vehicle = await db.transportVehicle.create({
        data: {
          schoolId: school.id,
          vehicleNumber: body.vehicleNumber,
          vehicleType: body.vehicleType || 'Bus',
          capacity: parseInt(body.capacity) || 40,
          driverName: body.driverName || null,
          driverPhone: body.driverPhone || null,
          conductorName: body.conductorName || null,
          conductorPhone: body.conductorPhone || null,
          isActive: true,
        },
      });
      return NextResponse.json({ vehicle });
    }

    return NextResponse.json({ error: 'Unknown entity' }, { status: 400 });
  } catch (e: any) {
    return NextResponse.json({ error: e.message }, { status: 400 });
  }
}

export async function PATCH(req: NextRequest) {
  try {
    await requireAuth(req);
    const { entity, id, ...data } = await req.json();

    if (entity === 'route') {
      const route = await db.transportRoute.update({
        where: { id },
        data: {
          routeNumber: data.routeNumber,
          routeName: data.routeName,
          startingPoint: data.startingPoint,
          endingPoint: data.endingPoint,
          totalDistanceKm: data.totalDistanceKm ? parseFloat(data.totalDistanceKm) : null,
          pickupTime: data.pickupTime || null,
          dropTime: data.dropTime || null,
          monthlyFee: data.monthlyFee ? parseFloat(data.monthlyFee) : null,
          vehicleId: data.vehicleId || null,
          isActive: data.isActive !== false,
          description: data.description || null,
        },
        include: { stops: true, vehicle: true, assignments: true },
      });
      return NextResponse.json({ route });
    }

    if (entity === 'vehicle') {
      const vehicle = await db.transportVehicle.update({
        where: { id },
        data: {
          vehicleNumber: data.vehicleNumber,
          vehicleType: data.vehicleType,
          capacity: parseInt(data.capacity) || 40,
          driverName: data.driverName || null,
          driverPhone: data.driverPhone || null,
          conductorName: data.conductorName || null,
          conductorPhone: data.conductorPhone || null,
          isActive: data.isActive !== false,
        },
      });
      return NextResponse.json({ vehicle });
    }

    return NextResponse.json({ error: 'Unknown entity' }, { status: 400 });
  } catch (e: any) {
    return NextResponse.json({ error: e.message }, { status: 400 });
  }
}

export async function DELETE(req: NextRequest) {
  try {
    await requireAuth(req);
    const { entity, id } = await req.json();
    if (entity === 'route') await db.transportRoute.delete({ where: { id } });
    else if (entity === 'stop') await db.transportStop.delete({ where: { id } });
    else if (entity === 'vehicle') await db.transportVehicle.delete({ where: { id } });
    return NextResponse.json({ ok: true });
  } catch (e: any) {
    return NextResponse.json({ error: e.message }, { status: 400 });
  }
}
