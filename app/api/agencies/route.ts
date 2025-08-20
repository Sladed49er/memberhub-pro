// app/api/agencies/route.ts
import { NextRequest, NextResponse } from "next/server";
import { auth } from "@clerk/nextjs/server";
import { currentUser } from "@clerk/nextjs/server";
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

    let agencies;

    if (userRole === "SUPER_ADMIN") {
      // Super Admins can see all agencies
      agencies = await prisma.agency.findMany({
        include: {
          _count: {
            select: { users: true },
          },
        },
        orderBy: {
          createdAt: "desc",
        },
      });
    } else if (userRole === "ADMIN" || userRole === "AGENCY_ADMIN") {
      // Agency Admins can only see their own agency
      if (!userAgencyId) {
        return NextResponse.json([]);
      }

      agencies = await prisma.agency.findMany({
        where: {
          id: userAgencyId,
        },
        include: {
          _count: {
            select: { users: true },
          },
        },
      });
    } else {
      // Regular users shouldn't access this endpoint
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    return NextResponse.json(agencies || []);
  } catch (error) {
    console.error("Error fetching agencies:", error);
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

    // Only Super Admins can create agencies
    if (userRole !== "SUPER_ADMIN") {
      return NextResponse.json(
        { error: "Forbidden: Only Super Admins can create agencies" },
        { status: 403 }
      );
    }

    const body = await request.json();

    console.log("Received body:", body); // Debug log

    // Validate required fields
    if (!body.name || !body.email) {
      return NextResponse.json(
        { error: "Name and email are required" },
        { status: 400 }
      );
    }

    try {
      // Check if agency with same email exists - wrapped in try-catch
      const existingAgency = await prisma.agency.findFirst({
        where: { email: body.email },
      });

      if (existingAgency) {
        return NextResponse.json(
          { error: "Agency with this email already exists" },
          { status: 400 }
        );
      }
    } catch (findError) {
      console.log("Error checking existing agency, continuing:", findError);
      // Continue even if the check fails
    }

    // Map the status from the form to the MembershipStatus enum
    let membershipStatus: "PENDING" | "ACTIVE" | "INACTIVE" | "SUSPENDED" =
      "PENDING";
    if (body.status === "ACTIVE") membershipStatus = "ACTIVE";
    else if (body.status === "INACTIVE") membershipStatus = "INACTIVE";
    else if (body.status === "SUSPENDED") membershipStatus = "SUSPENDED";

    // Map the membership type - ensure it's a valid enum value or null
    let membershipType = null;
    if (body.membershipType) {
      const validTypes = [
        "A1_AGENCY",
        "A2_BRANCH",
        "A3_ASSOCIATE",
        "STERLING_PARTNER",
      ];
      if (validTypes.includes(body.membershipType)) {
        membershipType = body.membershipType as any;
      }
    }

    // Create the agency with fields that match your Prisma schema
    const agencyData = {
      name: body.name,
      email: body.email,
      phone: body.phone || null,
      address: body.address || null,
      city: body.city || null,
      state: body.state || null,
      zipCode: body.zipCode || null,
      country: body.country || "USA",
      website: body.website || null,
      membershipType: membershipType,
      membershipLevel: body.membershipLevel || null,
      primaryContactName: body.primaryContactName || null,
      primaryContactEmail: body.primaryContactEmail || null,
      primaryContactPhone: body.primaryContactPhone || null,
      status: membershipStatus,
    };

    console.log("Creating agency with data:", agencyData); // Debug log

    const newAgency = await prisma.agency.create({
      data: agencyData,
    });

    console.log("Created agency:", newAgency); // Debug log

    return NextResponse.json(newAgency, { status: 201 });
  } catch (error: any) {
    console.error("Error creating agency - Full error:", error);

    // Check for Prisma-specific errors
    if (error.code === "P2002") {
      return NextResponse.json(
        {
          error: "An agency with this email or member number already exists",
        },
        { status: 400 }
      );
    }

    if (error.code === "P2003") {
      return NextResponse.json(
        {
          error: "Invalid reference: Please check all fields",
        },
        { status: 400 }
      );
    }

    // Check if it's a database connection error
    if (
      error.message?.includes("prisma") ||
      error.message?.includes("database")
    ) {
      return NextResponse.json(
        {
          error: "Database connection error. Please try again.",
          details:
            process.env.NODE_ENV === "development" ? error.message : undefined,
        },
        { status: 500 }
      );
    }

    return NextResponse.json(
      {
        error: error.message || "Failed to create agency",
        details:
          process.env.NODE_ENV === "development" ? error.toString() : undefined,
        code: error.code,
      },
      { status: 500 }
    );
  }
}
