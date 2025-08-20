// app/api/agencies/route.ts
// Fixed version with proper database fetching and error handling

import { NextRequest, NextResponse } from "next/server";
import { auth, currentUser } from "@clerk/nextjs/server";
import { prisma } from "@/lib/prisma";

// GET - Fetch all agencies (Super Admin) or user's agency (Admin)
export async function GET(request: NextRequest) {
  try {
    const { userId } = await auth();

    if (!userId) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const user = await currentUser();
    const userRole = user?.unsafeMetadata?.role as string;
    const userAgencyId = user?.unsafeMetadata?.agencyId as string;

    console.log(
      "API: Fetching agencies for role:",
      userRole,
      "agencyId:",
      userAgencyId
    );

    // Check permissions
    if (!userRole || (userRole !== "SUPER_ADMIN" && userRole !== "ADMIN")) {
      return NextResponse.json(
        { error: "Insufficient permissions" },
        { status: 403 }
      );
    }

    let agencies;

    if (userRole === "SUPER_ADMIN") {
      // Super Admin can see all agencies
      agencies = await prisma.agency.findMany({
        orderBy: {
          createdAt: "desc",
        },
      });
      console.log("API: Found", agencies.length, "agencies for Super Admin");
    } else if (userRole === "ADMIN" && userAgencyId) {
      // Admin can only see their own agency
      agencies = await prisma.agency.findMany({
        where: {
          id: userAgencyId,
        },
      });
      console.log("API: Found", agencies.length, "agencies for Admin");
    } else {
      // No valid permission scenario
      return NextResponse.json(
        { error: "No agency associated with this user" },
        { status: 403 }
      );
    }

    // Debug: Log what we're returning
    console.log("API: Returning agencies:", agencies);

    return NextResponse.json(agencies);
  } catch (error) {
    console.error("API Error fetching agencies:", error);
    return NextResponse.json(
      {
        error: "Failed to fetch agencies",
        details: error instanceof Error ? error.message : "Unknown error",
      },
      { status: 500 }
    );
  }
}

// POST - Create a new agency (Super Admin only)
export async function POST(request: NextRequest) {
  try {
    const { userId } = await auth();

    if (!userId) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const user = await currentUser();
    const userRole = user?.unsafeMetadata?.role as string;

    // Only Super Admin can create agencies
    if (userRole !== "SUPER_ADMIN") {
      return NextResponse.json(
        { error: "Only Super Admins can create agencies" },
        { status: 403 }
      );
    }

    const body = await request.json();
    console.log("API: Creating agency with data:", body);

    // Check if agency with this email already exists
    const existingAgency = await prisma.agency.findFirst({
      where: { email: body.email },
    });

    if (existingAgency) {
      console.log("API: Agency with email already exists:", body.email);
      return NextResponse.json(
        { error: "Agency with this email already exists" },
        { status: 400 }
      );
    }

    // Format the primary contact name
    const primaryContactName =
      body.primaryContactFirstName && body.primaryContactLastName
        ? `${body.primaryContactFirstName} ${body.primaryContactLastName}`
        : null;

    // Create the agency
    const agency = await prisma.agency.create({
      data: {
        name: body.name,
        email: body.email,
        phone: body.phone || null,
        address: body.address || null,
        city: body.city || null,
        state: body.state || null,
        zipCode: body.zipCode || null,
        website: body.website || null,
        membershipType: body.membershipType || null,
        status: body.status || "PENDING",
        primaryContactName: primaryContactName,
        primaryContactEmail: body.primaryContactEmail || null,
        primaryContactPhone: body.primaryContactPhone || null,
      },
    });

    console.log("API: Successfully created agency:", agency.id);

    return NextResponse.json(agency, { status: 201 });
  } catch (error) {
    console.error("API Error creating agency:", error);
    return NextResponse.json(
      {
        error: "Failed to create agency",
        details: error instanceof Error ? error.message : "Unknown error",
      },
      { status: 500 }
    );
  }
}
