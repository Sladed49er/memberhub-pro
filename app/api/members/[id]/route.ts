// ============================================
// FILE: app/api/members/[id]/route.ts
// PURPOSE: Fixed API route that properly handles role updates
// LAST MODIFIED: December 2024
// NOTES: Fixed for newer Clerk SDK version
// ============================================

import { NextResponse } from "next/server";
import { auth, currentUser, clerkClient } from "@clerk/nextjs/server";
import { prisma } from "@/lib/prisma";

// GET single member
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
      { error: "Failed to fetch member" },
      { status: 500 }
    );
  }
}

// UPDATE member
export async function PUT(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { userId } = await auth();
    if (!userId) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    // Get current user's role from Clerk
    const user = await currentUser();
    const metadata = user?.unsafeMetadata as any;
    const currentUserRole = metadata?.role || "AGENCY_USER";
    const currentUserAgencyId = metadata?.agencyId;

    const { id } = await params;
    const body = await request.json();

    console.log("Update request for member:", id);
    console.log("Request body:", body);
    console.log("Current user role:", currentUserRole);

    // Get existing member to check permissions
    const existingMember = await prisma.user.findUnique({
      where: { id },
      include: { agency: true },
    });

    if (!existingMember) {
      return NextResponse.json({ error: "Member not found" }, { status: 404 });
    }

    // Permission checks
    if (currentUserRole === "AGENCY_USER") {
      return NextResponse.json(
        { error: "Unauthorized - Members cannot edit other members" },
        { status: 403 }
      );
    }

    if (currentUserRole === "AGENCY_ADMIN") {
      // Agency Admin can only edit members in their agency
      if (existingMember.agencyId !== currentUserAgencyId) {
        return NextResponse.json(
          { error: "You can only edit members in your agency" },
          { status: 403 }
        );
      }

      // Agency Admin cannot create or edit Super Admins
      if (
        body.role === "SUPER_ADMIN" ||
        existingMember.role === "SUPER_ADMIN"
      ) {
        return NextResponse.json(
          { error: "Only Super Admins can manage Super Admin accounts" },
          { status: 403 }
        );
      }
    }

    // Extract fields from body
    const {
      firstName,
      lastName,
      email,
      phone,
      role, // THIS WAS MISSING!
      agencyId,
      status,
      // Remove membershipType - it belongs to agencies, not members
    } = body;

    // Build update data object
    const updateData: any = {
      firstName: firstName || existingMember.firstName,
      lastName: lastName || existingMember.lastName,
      name: `${firstName || existingMember.firstName} ${
        lastName || existingMember.lastName
      }`.trim(),
      email: email || existingMember.email,
      phone: phone !== undefined ? phone : existingMember.phone,
      status: status || existingMember.status,
      updatedAt: new Date(),
    };

    // Handle role update with proper validation
    if (role && role !== existingMember.role) {
      console.log(
        `Attempting to change role from ${existingMember.role} to ${role}`
      );

      // Only Super Admins can assign Super Admin role
      if (role === "SUPER_ADMIN" && currentUserRole !== "SUPER_ADMIN") {
        return NextResponse.json(
          { error: "Only Super Admins can assign Super Admin role" },
          { status: 403 }
        );
      }

      updateData.role = role;
    }

    // Handle agency update (only Super Admins can change agency)
    if (agencyId !== undefined) {
      if (currentUserRole === "SUPER_ADMIN") {
        updateData.agencyId = agencyId || null;
      } else if (agencyId !== existingMember.agencyId) {
        return NextResponse.json(
          { error: "Only Super Admins can change member agency" },
          { status: 403 }
        );
      }
    }

    console.log("Final update data:", updateData);

    // Update member in database
    const updatedMember = await prisma.user.update({
      where: { id },
      data: updateData,
      include: {
        agency: true,
      },
    });

    console.log("Member updated successfully in database:", updatedMember);

    // Update Clerk metadata if role or agency changed
    if (existingMember.clerkId && (role || agencyId !== undefined)) {
      try {
        // Get the clerk client (it's now a function that returns a promise)
        const clerk = await clerkClient();

        const newMetadata = {
          ...metadata,
          role: updateData.role || existingMember.role,
          agencyId:
            updateData.agencyId !== undefined
              ? updateData.agencyId
              : existingMember.agencyId,
          agencyName: updatedMember.agency?.name || null,
        };

        console.log(
          "Updating Clerk metadata for user:",
          existingMember.clerkId
        );
        console.log("New metadata:", newMetadata);

        await clerk.users.updateUser(existingMember.clerkId, {
          unsafeMetadata: newMetadata,
        });

        console.log("Clerk metadata updated successfully");
      } catch (clerkError) {
        console.error("Error updating Clerk metadata:", clerkError);
        // Continue anyway - database is updated
      }
    }

    // Log activity
    try {
      await prisma.activity.create({
        data: {
          type: "MEMBER_UPDATED",
          description: `Updated member: ${
            firstName || existingMember.firstName
          } ${lastName || existingMember.lastName}${
            role && role !== existingMember.role
              ? ` (Role changed from ${existingMember.role} to ${role})`
              : ""
          }`,
          userId: userId,
        },
      });
    } catch (activityError) {
      console.error("Error creating activity log:", activityError);
      // Continue anyway - update succeeded
    }

    return NextResponse.json(updatedMember);
  } catch (error) {
    console.error("Error updating member:", error);

    // Check if it's a Prisma unique constraint error
    if (error instanceof Error && error.message.includes("Unique constraint")) {
      return NextResponse.json(
        { error: "Email already exists" },
        { status: 400 }
      );
    }

    return NextResponse.json(
      { error: "Failed to update member" },
      { status: 500 }
    );
  }
}

// DELETE member
export async function DELETE(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { userId } = await auth();
    if (!userId) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    // Get current user's role
    const user = await currentUser();
    const metadata = user?.unsafeMetadata as any;
    const currentUserRole = metadata?.role || "AGENCY_USER";
    const currentUserAgencyId = metadata?.agencyId;

    const { id } = await params;

    // Get member info before deletion
    const member = await prisma.user.findUnique({
      where: { id },
    });

    if (!member) {
      return NextResponse.json({ error: "Member not found" }, { status: 404 });
    }

    // Permission checks
    if (currentUserRole === "AGENCY_USER") {
      return NextResponse.json({ error: "Unauthorized" }, { status: 403 });
    }

    if (currentUserRole === "AGENCY_ADMIN") {
      // Agency Admin can only delete members in their agency
      if (member.agencyId !== currentUserAgencyId) {
        return NextResponse.json(
          { error: "You can only delete members in your agency" },
          { status: 403 }
        );
      }

      // Agency Admin cannot delete Super Admins
      if (member.role === "SUPER_ADMIN") {
        return NextResponse.json(
          { error: "Cannot delete Super Admin accounts" },
          { status: 403 }
        );
      }
    }

    // Prevent deleting yourself
    if (member.clerkId === userId) {
      return NextResponse.json(
        { error: "Cannot delete your own account" },
        { status: 400 }
      );
    }

    // Delete member
    await prisma.user.delete({
      where: { id },
    });

    // Delete from Clerk if they have a clerkId
    if (member.clerkId) {
      try {
        // Get the clerk client (it's now a function that returns a promise)
        const clerk = await clerkClient();
        await clerk.users.deleteUser(member.clerkId);
      } catch (clerkError) {
        console.error("Error deleting from Clerk:", clerkError);
        // Continue anyway - database deletion succeeded
      }
    }

    // Log activity
    try {
      await prisma.activity.create({
        data: {
          type: "MEMBER_DELETED",
          description: `Deleted member: ${
            member.firstName || member.name || "Unknown"
          }`,
          userId: userId,
        },
      });
    } catch (activityError) {
      console.error("Error creating activity log:", activityError);
      // Continue anyway - deletion succeeded
    }

    return NextResponse.json({ message: "Member deleted successfully" });
  } catch (error) {
    console.error("Error deleting member:", error);
    return NextResponse.json(
      { error: "Failed to delete member" },
      { status: 500 }
    );
  }
}
