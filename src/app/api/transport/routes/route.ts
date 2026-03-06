export const dynamic = 'force-dynamic';
import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';

// GET /api/transport/routes - Get all routes
export async function GET(request: NextRequest) {
  try {
    const routes = await db.transportRoute.findMany({
      include: {
        vehicle: {
          select: {
            id: true,
            vehicleNumber: true,
            vehicleType: true,
          },
        },
        _count: {
          select: {
            stops: true,
            assignments: true,
          },
        },
      },
      orderBy: {
        routeNumber: 'asc',
      },
    });

    const routesWithCounts = await Promise.all(
      routes.map(async (route) => {
        const studentCount = await db.transportAssignment.count({
          where: {
            routeId: route.id,
            status: 'Active',
          },
        });

        return {
          ...route,
          stopCount: route._count.stops,
          studentCount,
        };
      })
    );

    return NextResponse.json({
      success: true,
      data: routesWithCounts,
      count: routesWithCounts.length,
    });
  } catch (error) {
    console.error('Error fetching routes:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to fetch routes' },
      { status: 500 }
    );
  }
}

// POST /api/transport/routes - Create new route
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const {
      routeNumber,
      routeName,
      startingPoint,
      endingPoint,
      totalDistanceKm,
      pickupTime,
      dropTime,
      monthlyFee,
      vehicleId,
    } = body;

    if (!routeNumber || !routeName || !startingPoint || !endingPoint) {
      return NextResponse.json(
        { success: false, error: 'Missing required fields' },
        { status: 400 }
      );
    }

    const newRoute = await db.transportRoute.create({
      data: {
        schoolId: null,
        routeNumber,
        routeName,
        startingPoint,
        endingPoint,
        totalDistanceKm: totalDistanceKm ? parseFloat(totalDistanceKm) : null,
        pickupTime: pickupTime || null,
        dropTime: dropTime || null,
        monthlyFee: monthlyFee ? parseFloat(monthlyFee) : null,
        vehicleId: vehicleId || null,
        isActive: true,
      },
    });

    return NextResponse.json({
      success: true,
      data: newRoute,
      message: 'Route created successfully',
    });
  } catch (error) {
    console.error('Error creating route:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to create route' },
      { status: 500 }
    );
  }
}
