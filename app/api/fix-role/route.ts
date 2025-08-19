// ============================================
// FILE: app/api/fix-role/route.ts
// PURPOSE: API endpoint to fix user roles in Clerk
// INSTRUCTIONS: Create this file in app/api/fix-role/route.ts
// ============================================

import { NextResponse } from "next/server";
import { auth } from "@clerk/nextjs/server";
import { clerkClient } from "@clerk/nextjs/server";

export async function POST(request: Request) {
  try {
    const { userId } = await auth();
    if (!userId) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const body = await request.json();
    const { role, agencyId, agencyName } = body;

    // Get the Clerk client (it's a function in newer versions)
    const clerk = await clerkClient();

    // Update the current user's metadata in Clerk
    await clerk.users.updateUser(userId, {
      unsafeMetadata: {
        role: role,
        agencyId: agencyId || "netstar-agency-001",
        agencyName: agencyName || "Netstar, Inc.",
      },
    });

    return NextResponse.json({
      success: true,
      message: `Role updated to ${role}`,
      metadata: {
        role,
        agencyId,
        agencyName,
      },
    });
  } catch (error) {
    console.error("Error updating role:", error);
    return NextResponse.json(
      { error: "Failed to update role", details: error },
      { status: 500 }
    );
  }
}
