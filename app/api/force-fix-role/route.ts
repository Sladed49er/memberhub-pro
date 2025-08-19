// ============================================
// FILE: app/api/force-fix-role/route.ts
// PURPOSE: Force update role for current user
// INSTRUCTIONS: Create this file at app/api/force-fix-role/route.ts
// ============================================

import { NextResponse } from "next/server";
import { auth, currentUser } from "@clerk/nextjs/server";
import { clerkClient } from "@clerk/nextjs/server";

export async function GET() {
  try {
    // Get current user
    const { userId } = await auth();
    const user = await currentUser();

    if (!userId || !user) {
      return NextResponse.json({ error: "Not authenticated" }, { status: 401 });
    }

    // Get the Clerk client
    const clerk = await clerkClient();

    // Force update to AGENCY_ADMIN with a proper agency
    const updatedUser = await clerk.users.updateUser(userId, {
      unsafeMetadata: {
        role: "AGENCY_ADMIN",
        agencyId: "netstar-agency-001",
        agencyName: "Netstar, Inc.",
      },
    });

    // Return the updated metadata
    return NextResponse.json({
      success: true,
      message: "Role forcefully updated to AGENCY_ADMIN",
      userId: userId,
      email: user.emailAddresses[0]?.emailAddress,
      updatedMetadata: updatedUser.unsafeMetadata,
      instructions: "Please refresh the page or go back to dashboard",
    });
  } catch (error) {
    console.error("Force fix error:", error);
    return NextResponse.json(
      {
        error: "Failed to update role",
        details: error instanceof Error ? error.message : "Unknown error",
        suggestion: "Try the manual method below",
      },
      { status: 500 }
    );
  }
}

// POST endpoint to set specific role
export async function POST(request: Request) {
  try {
    const { userId } = await auth();
    if (!userId) {
      return NextResponse.json({ error: "Not authenticated" }, { status: 401 });
    }

    const body = await request.json();
    const { role = "AGENCY_ADMIN" } = body;

    const clerk = await clerkClient();

    const updatedUser = await clerk.users.updateUser(userId, {
      unsafeMetadata: {
        role: role,
        agencyId: "netstar-agency-001",
        agencyName: "Netstar, Inc.",
      },
    });

    return NextResponse.json({
      success: true,
      message: `Role updated to ${role}`,
      updatedMetadata: updatedUser.unsafeMetadata,
    });
  } catch (error) {
    console.error("Error:", error);
    return NextResponse.json({ error: "Failed" }, { status: 500 });
  }
}
