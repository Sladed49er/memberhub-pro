// app/api/agencies/[id]/route.ts
// API routes for individual agency operations

import { NextRequest, NextResponse } from "next/server";
import { auth, currentUser } from "@clerk/nextjs/server";
import { prisma } from "@/lib/prisma";

// GET - Fetch single agency
export async function GET(
  request: NextRequest,
  context: { params: Promise<{ id: string }> }
) {
  try {
    const params = await context.params;
    const { userId } = await auth();

    if (!userId) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const user = await currentUser();
    const userRole = user?.unsafeMetadata?.role as string;
    const userAgencyId = user?.unsafeMetadata?.agencyId as string;

    // Check permissions
    if (userRole !== "SUPER_ADMIN" && userRole !== "ADMIN") {
      return NextResponse.json(
        { error: "Insufficient permissions" },
        { status: 403 }
      );
    }

    // Agency Admins can only view their own agency
    if (userRole === "ADMIN" && userAgencyId !== params.id) {
      return NextResponse.json({ error: "Access denied" }, { status: 403 });
    }

    const agency = await prisma.agency.findUnique({
      where: { id: params.id },
      include: {
        users: true, // Include associated users
      },
    });

    if (!agency) {
      return NextResponse.json({ error: "Agency not found" }, { status: 404 });
    }

    return NextResponse.json(agency);
  } catch (error) {
    console.error("Error fetching agency:", error);
    return NextResponse.json(
      { error: "Failed to fetch agency" },
      { status: 500 }
    );
  }
}

// PUT - Update agency
export async function PUT(
  request: NextRequest,
  context: { params: Promise<{ id: string }> }
) {
  try {
    const params = await context.params;
    const { userId } = await auth();

    if (!userId) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const user = await currentUser();
    const userRole = user?.unsafeMetadata?.role as string;
    const userAgencyId = user?.unsafeMetadata?.agencyId as string;

    // Check permissions
    const canEdit =
      userRole === "SUPER_ADMIN" ||
      (userRole === "ADMIN" && userAgencyId === params.id);

    if (!canEdit) {
      return NextResponse.json(
        { error: "Insufficient permissions" },
        { status: 403 }
      );
    }

    const body = await request.json();

    // Format the primary contact name
    const primaryContactName =
      body.primaryContactFirstName && body.primaryContactLastName
        ? `${body.primaryContactFirstName} ${body.primaryContactLastName}`
        : body.primaryContactName || null;

    // Prepare update data
    let updateData: any = {
      name: body.name,
      email: body.email,
      phone: body.phone || null,
      address: body.address || null,
      city: body.city || null,
      state: body.state || null,
      zipCode: body.zipCode || null,
      website: body.website || null,
      primaryContactName: primaryContactName,
      primaryContactEmail: body.primaryContactEmail || null,
      primaryContactPhone: body.primaryContactPhone || null,
    };

    // Only Super Admins can change membership type and status
    if (userRole === "SUPER_ADMIN") {
      updateData.membershipType = body.membershipType || null;
      updateData.status = body.status || "PENDING";
    }

    const agency = await prisma.agency.update({
      where: { id: params.id },
      data: updateData,
    });

    return NextResponse.json(agency);
  } catch (error) {
    console.error("Error updating agency:", error);
    return NextResponse.json(
      { error: "Failed to update agency" },
      { status: 500 }
    );
  }
}

// DELETE - Delete agency
export async function DELETE(
  request: NextRequest,
  context: { params: Promise<{ id: string }> }
) {
  try {
    const params = await context.params;
    const { userId } = await auth();

    if (!userId) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const user = await currentUser();
    const userRole = user?.unsafeMetadata?.role as string;

    // Only Super Admin can delete agencies
    if (userRole !== "SUPER_ADMIN") {
      return NextResponse.json(
        { error: "Only Super Admins can delete agencies" },
        { status: 403 }
      );
    }

    // First, disassociate all users from this agency
    await prisma.user.updateMany({
      where: { agencyId: params.id },
      data: { agencyId: null },
    });

    // Then delete the agency
    await prisma.agency.delete({
      where: { id: params.id },
    });

    return NextResponse.json({ message: "Agency deleted successfully" });
  } catch (error) {
    console.error("Error deleting agency:", error);
    return NextResponse.json(
      { error: "Failed to delete agency" },
      { status: 500 }
    );
  }
}
