// app/api/members/route.ts
import { NextRequest, NextResponse } from "next/server";
import { auth } from "@clerk/nextjs/server";
import { currentUser } from "@clerk/nextjs/server";
import { clerkClient } from "@clerk/nextjs/server";
import { prisma } from "@/lib/prisma";

export async function GET(request: NextRequest) {
  try {
    const { userId } = await auth();
    if (!userId) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const user = await currentUser();
    const userRole = user?.unsafeMetadata?.role as string;
    const userAgencyId = user?.unsafeMetadata?.agencyId as string;

    let members;

    if (userRole === "SUPER_ADMIN") {
      // Super Admins can see all members
      members = await prisma.user.findMany({
        include: {
          agency: true,
        },
        orderBy: {
          createdAt: "desc",
        },
      });
    } else if (userRole === "AGENCY_ADMIN") {
      // Agency Admins can only see members from their agency
      members = await prisma.user.findMany({
        where: {
          agencyId: userAgencyId,
        },
        include: {
          agency: true,
        },
        orderBy: {
          createdAt: "desc",
        },
      });
    } else {
      // Regular users shouldn't access this endpoint
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    return NextResponse.json(members);
  } catch (error) {
    console.error("Error fetching members:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    const { userId } = await auth();
    if (!userId) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const user = await currentUser();
    const userRole = user?.unsafeMetadata?.role as string;
    const userAgencyId = user?.unsafeMetadata?.agencyId as string;

    // Only Super Admins and Agency Admins can create members
    if (userRole !== "SUPER_ADMIN" && userRole !== "AGENCY_ADMIN") {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    const body = await request.json();

    // Agency Admins can only add members to their own agency
    if (userRole === "AGENCY_ADMIN") {
      body.agencyId = userAgencyId;

      // Agency Admins cannot create Super Admins
      if (body.role === "SUPER_ADMIN") {
        return NextResponse.json(
          { error: "You cannot create Super Admin users" },
          { status: 403 }
        );
      }
    }

    // Validate required fields
    if (!body.email || !body.firstName || !body.lastName || !body.agencyId) {
      return NextResponse.json(
        { error: "Email, first name, last name, and agency are required" },
        { status: 400 }
      );
    }

    // Check if user already exists
    const existingUser = await prisma.user.findUnique({
      where: { email: body.email },
    });

    if (existingUser) {
      return NextResponse.json(
        { error: "User with this email already exists" },
        { status: 400 }
      );
    }

    // Get agency name for Clerk metadata
    const agency = await prisma.agency.findUnique({
      where: { id: body.agencyId },
    });

    if (!agency) {
      return NextResponse.json({ error: "Agency not found" }, { status: 404 });
    }

    // Create user in database
    const newMember = await prisma.user.create({
      data: {
        email: body.email,
        firstName: body.firstName,
        lastName: body.lastName,
        phone: body.phone || "",
        role: body.role || "AGENCY_USER",
        agencyId: body.agencyId,
      },
    });

    // Try to update Clerk user if they exist
    try {
      const clerk = await clerkClient();
      const clerkUsers = await clerk.users.getUserList({
        emailAddress: [body.email],
      });

      if (clerkUsers.data && clerkUsers.data.length > 0) {
        const clerkUser = clerkUsers.data[0];
        await clerk.users.updateUserMetadata(clerkUser.id, {
          unsafeMetadata: {
            role: body.role || "AGENCY_USER",
            agencyId: body.agencyId,
            agencyName: agency.name,
          },
        });
      }
    } catch (clerkError) {
      console.log("User not in Clerk yet, will be updated on first sign-in");
    }

    return NextResponse.json(newMember);
  } catch (error) {
    console.error("Error creating member:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
