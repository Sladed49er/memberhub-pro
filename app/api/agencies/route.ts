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
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    const body = await request.json();

    // Validate required fields
    if (!body.name || !body.email) {
      return NextResponse.json(
        { error: "Name and email are required" },
        { status: 400 }
      );
    }

    // Check if agency with same email exists
    const existingAgency = await prisma.agency.findFirst({
      where: { email: body.email },
    });

    if (existingAgency) {
      return NextResponse.json(
        { error: "Agency with this email already exists" },
        { status: 400 }
      );
    }

    // Create the agency
    const newAgency = await prisma.agency.create({
      data: {
        name: body.name,
        email: body.email,
        phone: body.phone || null,
        address: body.address || null,
        city: body.city || null,
        state: body.state || null,
        zipCode: body.zipCode || null,
        website: body.website || null,
        primaryContactName: body.primaryContactName || null,
        primaryContactEmail: body.primaryContactEmail || null,
        primaryContactPhone: body.primaryContactPhone || null,
        membershipType: body.membershipType || "A1_AGENCY",
        status: body.status || "ACTIVE",
      },
    });

    return NextResponse.json(newAgency, { status: 201 });
  } catch (error) {
    console.error("Error creating agency:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
