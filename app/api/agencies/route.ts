// app/api/agencies/route.ts
import { NextResponse } from "next/server";
import { auth } from "@clerk/nextjs/server";
import { prisma } from "@/lib/prisma";

// GET all agencies - no params needed here
export async function GET() {
  try {
    const { userId } = await auth();
    if (!userId) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const agencies = await prisma.agency.findMany({
      include: {
        users: true,
      },
      orderBy: {
        name: "asc",
      },
    });

    // Transform to include count
    const agenciesWithCount = agencies.map((agency) => ({
      ...agency,
      _count: {
        users: agency.users.length,
      },
    }));

    return NextResponse.json(agenciesWithCount);
  } catch (error) {
    console.error("Error fetching agencies:", error);
    return NextResponse.json(
      { error: "Failed to fetch agencies" },
      { status: 500 }
    );
  }
}

// CREATE new agency
export async function POST(request: Request) {
  try {
    const { userId } = await auth();
    if (!userId) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

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
    } = body;

    // Create agency
    const agency = await prisma.agency.create({
      data: {
        name,
        email,
        phone,
        address,
        city,
        state,
        zipCode,
        country: country || "USA",
        website,
        primaryContactName,
        primaryContactEmail,
        primaryContactPhone,
        status: "ACTIVE",
      },
    });

    // Log activity
    await prisma.activity.create({
      data: {
        type: "AGENCY_CREATED",
        description: `Created agency: ${name}`,
        userId: userId,
      },
    });

    return NextResponse.json(agency);
  } catch (error) {
    console.error("Error creating agency:", error);
    return NextResponse.json(
      { error: "Failed to create agency" },
      { status: 500 }
    );
  }
}
