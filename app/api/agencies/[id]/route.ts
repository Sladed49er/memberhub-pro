// app/api/agencies/[id]/route.ts
import { NextRequest, NextResponse } from "next/server";
import { auth } from "@clerk/nextjs/server";
import { currentUser } from "@clerk/nextjs/server";
import { prisma } from "@/lib/prisma";

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { userId } = await auth();
    if (!userId) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const user = await currentUser();
    const userRole = user?.unsafeMetadata?.role as string;
    const userAgencyId = user?.unsafeMetadata?.agencyId as string;

    const { id } = await params;

    // Agency Admins can only view their own agency
    if (userRole === "AGENCY_ADMIN" && id !== userAgencyId) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    const agency = await prisma.agency.findUnique({
      where: { id },
      include: {
        _count: {
          select: { users: true },
        },
      },
    });

    if (!agency) {
      return NextResponse.json({ error: "Agency not found" }, { status: 404 });
    }

    return NextResponse.json(agency);
  } catch (error) {
    console.error("Error fetching agency:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}

export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { userId } = await auth();
    if (!userId) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const user = await currentUser();
    const userRole = user?.unsafeMetadata?.role as string;
    const userAgencyId = user?.unsafeMetadata?.agencyId as string;

    const { id } = await params;

    // Agency Admins can only edit their own agency
    if (userRole === "AGENCY_ADMIN" && id !== userAgencyId) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    const body = await request.json();

    // For Agency Admins, filter out fields they cannot modify
    if (userRole === "AGENCY_ADMIN") {
      delete body.membershipType;
      delete body.status;
      // Ensure they can't modify these critical fields
      delete body.id;
      delete body.createdAt;
      delete body.updatedAt;
    }

    // Validate that required fields are present
    if (!body.name || !body.email) {
      return NextResponse.json(
        { error: "Name and email are required" },
        { status: 400 }
      );
    }

    const updatedAgency = await prisma.agency.update({
      where: { id },
      data: {
        name: body.name,
        address: body.address,
        phone: body.phone,
        email: body.email,
        // Only include these if user is Super Admin
        ...(userRole === "SUPER_ADMIN" && {
          membershipType: body.membershipType,
          status: body.status,
        }),
      },
    });

    return NextResponse.json(updatedAgency);
  } catch (error) {
    console.error("Error updating agency:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { userId } = await auth();
    if (!userId) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const user = await currentUser();
    const userRole = user?.unsafeMetadata?.role as string;

    // Only Super Admins can delete agencies
    if (userRole !== "SUPER_ADMIN") {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    const { id } = await params;

    // Check if agency has members
    const memberCount = await prisma.user.count({
      where: { agencyId: id },
    });

    if (memberCount > 0) {
      return NextResponse.json(
        { error: "Cannot delete agency with existing members" },
        { status: 400 }
      );
    }

    const deletedAgency = await prisma.agency.delete({
      where: { id },
    });

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Error deleting agency:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
