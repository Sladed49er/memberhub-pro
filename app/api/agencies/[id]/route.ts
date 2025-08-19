// app/api/agencies/[id]/route.ts
import { NextResponse } from "next/server";
import { auth } from "@clerk/nextjs/server";
import { prisma } from "@/lib/prisma";

// GET single agency with members
export async function GET(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { userId } = await auth();
    if (!userId) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { id } = await params;

    const agency = await prisma.agency.findUnique({
      where: { id },
      include: {
        users: true,
        events: true,
        documents: true,
      },
    });

    if (!agency) {
      return NextResponse.json({ error: "Agency not found" }, { status: 404 });
    }

    // Add counts manually
    const agencyWithCounts = {
      ...agency,
      _count: {
        users: agency.users.length,
        events: agency.events.length,
        documents: agency.documents.length,
      },
    };

    return NextResponse.json(agencyWithCounts);
  } catch (error) {
    console.error("Error fetching agency:", error);
    return NextResponse.json(
      { error: "Failed to fetch agency" },
      { status: 500 }
    );
  }
}

// UPDATE agency
export async function PUT(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { userId } = await auth();
    if (!userId) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { id } = await params;
    const body = await request.json();
    const {
      name,
      email,
      phone,
      address,
      city,
      state,
      zipCode,
      country,
      website,
      primaryContactName,
      primaryContactEmail,
      primaryContactPhone,
      status,
    } = body;

    const updatedAgency = await prisma.agency.update({
      where: { id },
      data: {
        name,
        email,
        phone,
        address,
        city,
        state,
        zipCode,
        country,
        website,
        primaryContactName,
        primaryContactEmail,
        primaryContactPhone,
        status,
      },
    });

    // Log activity
    await prisma.activity.create({
      data: {
        type: "AGENCY_UPDATED",
        description: `Updated agency: ${name}`,
        userId: userId,
      },
    });

    return NextResponse.json(updatedAgency);
  } catch (error) {
    console.error("Error updating agency:", error);
    return NextResponse.json(
      { error: "Failed to update agency" },
      { status: 500 }
    );
  }
}

// DELETE agency
export async function DELETE(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { userId } = await auth();
    if (!userId) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { id } = await params;

    // Check if agency has members
    const agency = await prisma.agency.findUnique({
      where: { id },
      include: {
        users: true,
      },
    });

    if (!agency) {
      return NextResponse.json({ error: "Agency not found" }, { status: 404 });
    }

    if (agency.users.length > 0) {
      return NextResponse.json(
        { error: "Cannot delete agency with active members" },
        { status: 400 }
      );
    }

    // Delete agency
    await prisma.agency.delete({
      where: { id },
    });

    // Log activity
    await prisma.activity.create({
      data: {
        type: "AGENCY_DELETED",
        description: `Deleted agency: ${agency.name}`,
        userId: userId,
      },
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
