// app/api/webhooks/clerk/route.ts
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
      if (unsafe_metadata?.role && unsafe_metadata.role !== "NOT_SET") {
        console.log("User already has role:", unsafe_metadata.role);
        return NextResponse.json({ message: "User already has role" });
      }

      try {
        // Get the clerk client
        const clerk = await clerkClient();

        // Determine the role based on your business logic
        let role: any = "STANDARD"; // Default role - using 'any' to bypass TypeScript check
        let agencyId = null;
        let agencyName = null;

        // Check if user exists in database with a role
        if (email) {
          const existingUser = await prisma.user.findUnique({
            where: { email },
            include: { agency: true },
          });

          if (existingUser) {
            role = existingUser.role;
            agencyId = existingUser.agencyId;
            agencyName = existingUser.agency?.name || null;
            console.log(`Found existing user in database with role: ${role}`);
          } else {
            // First user becomes Super Admin
            const userCount = await prisma.user.count();
            if (userCount === 0) {
              role = "SUPER_ADMIN";
              console.log("First user - assigning Super Admin role");
            }
          }
        }

        // Update Clerk user metadata
        await clerk.users.updateUserMetadata(id, {
          unsafeMetadata: {
            role,
            agencyId,
            agencyName,
          },
        });

        console.log(`Updated user ${id} with role: ${role}`);

        // If user doesn't exist in database, create them
        if (email && first_name && last_name) {
          const existingUser = await prisma.user.findUnique({
            where: { email },
          });

          if (!existingUser) {
            // Only create if they have an agency assignment or are super admin
            if (role === "SUPER_ADMIN" || agencyId) {
              await prisma.user.create({
                data: {
                  clerkId: id, // Changed from clerkUserId to clerkId
                  email,
                  firstName: first_name,
                  lastName: last_name,
                  role,
                  agencyId,
                },
              });
              console.log(`Created user in database: ${email}`);
            }
          }
        }

        return NextResponse.json({
          message: "User role updated successfully",
          role,
        });
      } catch (error) {
        console.error("Error updating user metadata:", error);
        return NextResponse.json(
          { error: "Failed to update user metadata" },
          { status: 500 }
        );
      }
    }

    // Handle user.updated event
    if (payload.type === "user.updated") {
      const { id, email_addresses, first_name, last_name } = payload.data;
      const email = email_addresses?.[0]?.email_address;

      if (email) {
        // Update user in database if they exist
        const existingUser = await prisma.user.findUnique({
          where: { clerkId: id }, // Changed from clerkUserId to clerkId
        });

        if (existingUser) {
          await prisma.user.update({
            where: { clerkId: id }, // Changed from clerkUserId to clerkId
            data: {
              email,
              firstName: first_name || existingUser.firstName,
              lastName: last_name || existingUser.lastName,
            },
          });
          console.log(`Updated user in database: ${email}`);
        }
      }

      return NextResponse.json({ message: "User updated successfully" });
    }

    // Handle user.deleted event
    if (payload.type === "user.deleted") {
      const { id } = payload.data;

      // Delete user from database
      try {
        await prisma.user.delete({
          where: { clerkId: id }, // Changed from clerkUserId to clerkId
        });
        console.log(`Deleted user from database: ${id}`);
      } catch (error) {
        console.log(`User not found in database: ${id}`);
      }

      return NextResponse.json({ message: "User deleted successfully" });
    }

    return NextResponse.json({ message: "Webhook processed" });
  } catch (error) {
    console.error("Webhook error:", error);
    return NextResponse.json(
      { error: "Webhook processing failed" },
      { status: 500 }
    );
  }
}
