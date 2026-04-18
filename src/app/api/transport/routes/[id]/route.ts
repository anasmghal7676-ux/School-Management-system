export const dynamic = 'force-dynamic';
import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { requireAuth } from '@/lib/api-auth';

// PUT /api/transport/routes/:id - Update route
export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { error } = await requireAuth();
  if (error) return error;

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
      isActive,
    } = body;

    const updatedRoute = await db.transportRoute.update({
      where: { id: (await params).id },
      data: {
        ...(routeNumber && { routeNumber }),
        ...(routeName && { routeName }),
        ...(startingPoint && { startingPoint }),
        ...(endingPoint && { endingPoint }),
        ...(totalDistanceKm !== undefined && { totalDistanceKm: totalDistanceKm ? parseFloat(totalDistanceKm) : null }),
        ...(pickupTime !== undefined && { pickupTime: pickupTime || null }),
        ...(dropTime !== undefined && { dropTime: dropTime || null }),
        ...(monthlyFee !== undefined && { monthlyFee: monthlyFee ? parseFloat(monthlyFee) : null }),
        ...(isActive !== undefined && { isActive }),
      },
    });

    return NextResponse.json({
      success: true,
      data: updatedRoute,
      message: 'Route updated successfully',
    });
  } catch (error) {
    console.error('Error updating route:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to update route' },
      { status: 500 }
    );
  }
}

// DELETE /api/transport/routes/:id - Delete route
export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { error } = await requireAuth();
  if (error) return error;

  try {
    await db.transportRoute.delete({
      where: { id: (await params).id },
    });

    return NextResponse.json({
      success: true,
      message: 'Route deleted successfully',
    });
  } catch (error) {
    console.error('Error deleting route:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to delete route' },
      { status: 500 }
    );
  }
}
