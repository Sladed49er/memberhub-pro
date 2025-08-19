// ============================================
// FILE: app/api/webhooks/clerk/route.ts
// PURPOSE: Simple webhook to auto-set user roles (without Svix for now)
// ============================================

import { NextResponse } from "next/server";
import { clerkClient } from "@clerk/nextjs/server";
import { prisma } from "@/lib/prisma";

export async function POST(req: Request) {
  try {
    const payload = await req.json();

    // Log the webhook event
    console.log("Webhook received:", payload.type);

    // Handle user.created event
    if (payload.type === "user.created") {
      const { id, email_addresses, first_name, last_name, unsafe_metadata } =
        payload.data;
      const email = email_addresses?.[0]?.email_address;

      // Check if user already has a role
      if (unsafe_metadata?.role) {
        console.log("User already has role:", unsafe_metadata.role);
        return NextResponse.json({ message: "User already has role" });
      }

      try {
        // Get the clerk client
        const clerk = await clerkClient();

        // Determine the role based on your business logic
        let role = "AGENCY_USER"; // Default role
        let agencyId = null;
        let agencyName = null;

        // Example: First user becomes Super Admin
        const userCount = await prisma.user.count();
        if (userCount === 0) {
          role = "SUPER_ADMIN";
          console.log("First user - assigning Super Admin role");
        }
        // Example: Check if email domain matches
        else if (email?.endsWith("@netstarinc.com")) {
          role = "AGENCY_ADMIN";
          agencyId = "netstar-agency-001";
          agencyName = "Netstar, Inc.";
          console.log("Netstar email - assigning Agency Admin role");
        }
        // Example: Check if user's email is a primary contact for an agency
        else if (email) {
          const existingAgency = await prisma.agency.findFirst({
            where: {
              OR: [{ email: email }, { primaryContactEmail: email }],
            },
          });

          if (existingAgency) {
            role = "AGENCY_ADMIN";
            agencyId = existingAgency.id;
            agencyName = existingAgency.name;
            console.log("Found matching agency - assigning Agency Admin role");
          }
        }

        // Update user metadata with role
        await clerk.users.updateUser(id, {
          unsafeMetadata: {
            role,
            agencyId,
            agencyName,
          },
        });

        // Create user in database
        await prisma.user.create({
          data: {
            clerkId: id,
            email: email || "",
            firstName: first_name || "",
            lastName: last_name || "",
            name: `${first_name || ""} ${last_name || ""}`.trim(),
            role: role as any, // Type assertion to fix TypeScript error
            agencyId,
            status: "ACTIVE",
          },
        });

        console.log(`User ${email} created with role: ${role}`);
        return NextResponse.json({
          success: true,
          message: `User assigned role: ${role}`,
        });
      } catch (error) {
        console.error("Error processing webhook:", error);
        return NextResponse.json(
          { error: "Failed to process webhook" },
          { status: 500 }
        );
      }
    }

    // Return success for other event types
    return NextResponse.json({ received: true });
  } catch (error) {
    console.error("Webhook error:", error);
    return NextResponse.json(
      { error: "Webhook processing failed" },
      { status: 400 }
    );
  }
}
