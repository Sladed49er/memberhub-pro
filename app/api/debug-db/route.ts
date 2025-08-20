// app/api/debug-db/route.ts
// API route to fetch raw database contents for debugging

import { NextRequest, NextResponse } from "next/server";
import { auth, currentUser } from "@clerk/nextjs/server";
import { prisma } from "@/lib/prisma";

export async function GET(request: NextRequest) {
  try {
    const { userId } = await auth();

    if (!userId) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const user = await currentUser();
    const userRole = user?.unsafeMetadata?.role as string;

    // Only Super Admin can access this endpoint
    if (userRole !== "SUPER_ADMIN") {
      return NextResponse.json({ error: "Access denied" }, { status: 403 });
    }

    // Fetch all agencies
    const agencies = await prisma.agency.findMany({
      orderBy: {
        createdAt: "desc",
      },
    });

    // Fetch all users
    const users = await prisma.user.findMany({
      orderBy: {
        createdAt: "desc",
      },
    });

    // Get counts
    const agencyCount = await prisma.agency.count();
    const userCount = await prisma.user.count();

    return NextResponse.json({
      agencyCount,
      userCount,
      agencies,
      users,
      timestamp: new Date().toISOString(),
      databaseUrl: process.env.DATABASE_URL ? "Connected" : "Not Connected",
    });
  } catch (error) {
    console.error("Debug DB Error:", error);
    return NextResponse.json(
      {
        error: "Failed to fetch database info",
        details: error instanceof Error ? error.message : "Unknown error",
        stack: error instanceof Error ? error.stack : undefined,
      },
      { status: 500 }
    );
  }
}
