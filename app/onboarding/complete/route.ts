// ============================================
// FILE: app/api/onboarding/complete/route.ts
// PURPOSE: Complete user onboarding and set their role
// ============================================

import { NextResponse } from "next/server";
import { auth, currentUser } from "@clerk/nextjs/server";
import { clerkClient } from "@clerk/nextjs/server";
import { prisma } from "@/lib/prisma";

// You can set this in your environment variables
const SUPER_ADMIN_ACCESS_CODE =
  process.env.SUPER_ADMIN_ACCESS_CODE || "super123";

export async function POST(request: Request) {
  try {
    const { userId } = await auth();
    const user = await currentUser();

    if (!userId || !user) {
      return NextResponse.json({ error: "Not authenticated" }, { status: 401 });
    }

    const body = await request.json();
    const { role, agencyId, accessCode } = body;

    // Validate role
    if (!["AGENCY_USER", "AGENCY_ADMIN", "SUPER_ADMIN"].includes(role)) {
      return NextResponse.json({ error: "Invalid role" }, { status: 400 });
    }

    // Check Super Admin access code
    if (role === "SUPER_ADMIN" && accessCode !== SUPER_ADMIN_ACCESS_CODE) {
      return NextResponse.json(
        { error: "Invalid access code" },
        { status: 403 }
      );
    }

    // Get agency details if needed
    let agencyName = null;
    if (agencyId) {
      const agency = await prisma.agency.findUnique({
        where: { id: agencyId },
      });
      agencyName = agency?.name || null;
    }

    // Update Clerk metadata
    const clerk = await clerkClient();
    await clerk.users.updateUser(userId, {
      unsafeMetadata: {
        role,
        agencyId: agencyId || null,
        agencyName: agencyName || null,
      },
    });

    // Create or update user in database
    await prisma.user.upsert({
      where: { clerkId: userId },
      update: {
        email: user.emailAddresses[0]?.emailAddress || "",
        firstName: user.firstName || "",
        lastName: user.lastName || "",
        name: `${user.firstName || ""} ${user.lastName || ""}`.trim(),
        role,
        agencyId: agencyId || null,
        status: "ACTIVE",
      },
      create: {
        clerkId: userId,
        email: user.emailAddresses[0]?.emailAddress || "",
        firstName: user.firstName || "",
        lastName: user.lastName || "",
        name: `${user.firstName || ""} ${user.lastName || ""}`.trim(),
        role,
        agencyId: agencyId || null,
        status: "ACTIVE",
      },
    });

    return NextResponse.json({
      success: true,
      message: "Onboarding completed successfully",
      role,
      agencyId,
      agencyName,
    });
  } catch (error) {
    console.error("Onboarding error:", error);
    return NextResponse.json(
      { error: "Failed to complete onboarding" },
      { status: 500 }
    );
  }
}
