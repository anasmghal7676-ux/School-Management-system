import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';

// GET /api/transport/vehicles - Get all vehicles
export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams;
    const status = searchParams.get('status');

    const where: any = {};
    if (status) where.status = status;

    const vehicles = await db.transportVehicle.findMany({
      where,
      include: {
        _count: {
          select: {
            routes: true,
          },
        },
      },
      orderBy: {
        vehicleNumber: 'asc',
      },
    });

    // Get student counts for each vehicle
    const vehiclesWithCounts = await Promise.all(
      vehicles.map(async (vehicle) => {
        const assignments = await db.transportAssignment.findMany({
          where: {
            vehicleId: vehicle.id,
            status: 'Active',
          },
        });

        const studentCount = assignments.length;

        return {
          ...vehicle,
          routeCount: vehicle._count.routes,
          studentCount,
        };
      })
    );

    return NextResponse.json({
      success: true,
      data: vehiclesWithCounts,
      count: vehiclesWithCounts.length,
    });
  } catch (error) {
    console.error('Error fetching vehicles:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to fetch vehicles' },
      { status: 500 }
    );
  }
}

// POST /api/transport/vehicles - Create new vehicle
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const {
      vehicleNumber,
      vehicleType,
      capacity,
      driverName,
      driverPhone,
      driverLicense,
      conductorName,
      conductorPhone,
      insuranceExpiry,
      fitnessExpiry,
      status,
    } = body;

    // Validation
    if (!vehicleNumber || !vehicleType || !capacity) {
      return NextResponse.json(
        { success: false, error: 'Missing required fields' },
        { status: 400 }
      );
    }

    const newVehicle = await db.transportVehicle.create({
      data: {
        schoolId: null, // TODO: Get from session
        vehicleNumber,
        vehicleType,
        capacity: parseInt(capacity),
        driverName: driverName || null,
        driverPhone: driverPhone || null,
        driverLicense: driverLicense || null,
        conductorName: conductorName || null,
        conductorPhone: conductorPhone || null,
        insuranceExpiry: insuranceExpiry ? new Date(insuranceExpiry) : null,
        fitnessExpiry: fitnessExpiry ? new Date(fitnessExpiry) : null,
        status: status || 'Active',
      },
    });

    return NextResponse.json({
      success: true,
      data: newVehicle,
      message: 'Vehicle added successfully',
    });
  } catch (error) {
    console.error('Error creating vehicle:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to create vehicle' },
      { status: 500 }
    );
  }
}
