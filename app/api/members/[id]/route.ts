// app/api/members/[id]/route.ts
import { NextRequest, NextResponse } from "next/server";
import { auth } from "@clerk/nextjs/server";
import { currentUser } from "@clerk/nextjs/server";
import { clerkClient } from "@clerk/nextjs/server";
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

    const { id } = await params;

    const member = await prisma.user.findUnique({
      where: { id },
      include: {
        agency: true,
      },
    });

    if (!member) {
      return NextResponse.json({ error: "Member not found" }, { status: 404 });
    }

    return NextResponse.json(member);
  } catch (error) {
    console.error("Error fetching member:", error);
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
    const body = await request.json();

    // Check if member exists
    const existingMember = await prisma.user.findUnique({
      where: { id },
    });

    if (!existingMember) {
      return NextResponse.json({ error: "Member not found" }, { status: 404 });
    }

    // Agency Admins can only edit members from their agency
    if (
      (userRole === "ADMIN" || userRole === "AGENCY_ADMIN") &&
      existingMember.agencyId !== userAgencyId
    ) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    // Agency Admins cannot assign Super Admin role
    if (
      (userRole === "ADMIN" || userRole === "AGENCY_ADMIN") &&
      body.role === "SUPER_ADMIN"
    ) {
      return NextResponse.json(
        { error: "Cannot assign Super Admin role" },
        { status: 403 }
      );
    }

    // Update member in database
    const updatedMember = await prisma.user.update({
      where: { id },
      data: {
        firstName: body.firstName,
        lastName: body.lastName,
        email: body.email,
        phone: body.phone,
        role: body.role,
        agencyId: body.agencyId,
      },
    });

    // Update Clerk metadata if user has a clerkId
    if (existingMember.clerkId) {
      try {
        const clerk = await clerkClient();
        const agency = await prisma.agency.findUnique({
          where: { id: body.agencyId },
        });

        await clerk.users.updateUserMetadata(existingMember.clerkId, {
          unsafeMetadata: {
            role: body.role,
            agencyId: body.agencyId,
            agencyName: agency?.name || null,
          },
        });
      } catch (clerkError) {
        console.log("Could not update Clerk metadata:", clerkError);
      }
    }

    return NextResponse.json(updatedMember);
  } catch (error) {
    console.error("Error updating member:", error);
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
    const userAgencyId = user?.unsafeMetadata?.agencyId as string;

    const { id } = await params;

    // Check if member exists
    const existingMember = await prisma.user.findUnique({
      where: { id },
    });

    if (!existingMember) {
      return NextResponse.json({ error: "Member not found" }, { status: 404 });
    }

    // Agency Admins can only delete members from their agency
    if (
      (userRole === "ADMIN" || userRole === "AGENCY_ADMIN") &&
      existingMember.agencyId !== userAgencyId
    ) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    // Delete member from database
    await prisma.user.delete({
      where: { id },
    });

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Error deleting member:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
