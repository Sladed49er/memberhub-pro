// ============================================
// FILE: app/api/members/route.ts
// PURPOSE: API endpoints for GET all members and POST new member
// FIXES: Better error handling, check for duplicate emails, proper error messages
// INSTRUCTIONS: Copy this ENTIRE file and replace your existing app/api/members/route.ts
// ============================================

import { NextResponse } from "next/server";
import { auth } from "@clerk/nextjs/server";
import { prisma } from "@/lib/prisma";

// GET all members
export async function GET(request: Request) {
  try {
    const { userId } = await auth();
    if (!userId) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const limit = searchParams.get("limit")
      ? parseInt(searchParams.get("limit")!)
      : undefined;

    const members = await prisma.user.findMany({
      take: limit,
      orderBy: {
        createdAt: "desc",
      },
      include: {
        agency: true,
      },
    });

    return NextResponse.json(members);
  } catch (error) {
    console.error("Error fetching members:", error);
    return NextResponse.json(
      { error: "Failed to fetch members" },
      { status: 500 }
    );
  }
}

// POST new member
export async function POST(request: Request) {
  try {
    const { userId } = await auth();
    if (!userId) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const body = await request.json();
    const {
      firstName,
      lastName,
      email,
      phone,
      membershipType,
      agencyId,
      status,
    } = body;

    // Check if email already exists
    const existingUser = await prisma.user.findUnique({
      where: { email },
    });

    if (existingUser) {
      return NextResponse.json(
        {
          error: `A member with email ${email} already exists. Please use a different email address.`,
        },
        { status: 400 }
      );
    }

    // Validate required fields
    if (!firstName || !lastName || !email) {
      return NextResponse.json(
        { error: "First name, last name, and email are required" },
        { status: 400 }
      );
    }

    // Create the user
    const member = await prisma.user.create({
      data: {
        firstName,
        lastName,
        name: `${firstName} ${lastName}`.trim(),
        email,
        phone: phone || null,
        membershipType: membershipType || "A1_AGENCY",
        status: status || "ACTIVE",
        role: "AGENCY_USER", // Default role
        agencyId: agencyId || null,
      },
      include: {
        agency: true,
      },
    });

    // Log activity (but don't fail if this fails)
    try {
      await prisma.activity.create({
        data: {
          type: "MEMBER_CREATED",
          description: `Created member: ${firstName} ${lastName}`,
          userId: userId,
        },
      });
    } catch (activityError) {
      console.error("Error logging activity:", activityError);
      // Continue anyway - member was created successfully
    }

    return NextResponse.json(member, { status: 201 });
  } catch (error: any) {
    console.error("Error creating member:", error);

    // Check for specific Prisma errors
    if (error.code === "P2002") {
      return NextResponse.json(
        { error: "A member with this email already exists" },
        { status: 400 }
      );
    }

    return NextResponse.json(
      {
        error:
          "Failed to create member. Please check all fields and try again.",
      },
      { status: 500 }
    );
  }
}
