import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';

// PUT /api/transport/vehicles/:id - Update vehicle
export async function PUT(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
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

    const updatedVehicle = await db.transportVehicle.update({
      where: { id: params.id },
      data: {
        ...(vehicleNumber && { vehicleNumber }),
        ...(vehicleType && { vehicleType }),
        ...(capacity && { capacity: parseInt(capacity) }),
        ...(driverName !== undefined && { driverName: driverName || null }),
        ...(driverPhone !== undefined && { driverPhone: driverPhone || null }),
        ...(driverLicense !== undefined && { driverLicense: driverLicense || null }),
        ...(conductorName !== undefined && { conductorName: conductorName || null }),
        ...(conductorPhone !== undefined && { conductorPhone: conductorPhone || null }),
        ...(insuranceExpiry !== undefined && { insuranceExpiry: insuranceExpiry ? new Date(insuranceExpiry) : null }),
        ...(fitnessExpiry !== undefined && { fitnessExpiry: fitnessExpiry ? new Date(fitnessExpiry) : null }),
        ...(status && { status }),
      },
    });

    return NextResponse.json({
      success: true,
      data: updatedVehicle,
      message: 'Vehicle updated successfully',
    });
  } catch (error) {
    console.error('Error updating vehicle:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to update vehicle' },
      { status: 500 }
    );
  }
}

// DELETE /api/transport/vehicles/:id - Delete vehicle
export async function DELETE(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    await db.transportVehicle.delete({
      where: { id: params.id },
    });

    return NextResponse.json({
      success: true,
      message: 'Vehicle deleted successfully',
    });
  } catch (error) {
    console.error('Error deleting vehicle:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to delete vehicle' },
      { status: 500 }
    );
  }
}
