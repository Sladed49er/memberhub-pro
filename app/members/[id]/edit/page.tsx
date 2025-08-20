// app/members/[id]/edit/page.tsx
import { auth } from "@clerk/nextjs/server";
import { currentUser } from "@clerk/nextjs/server";
import { redirect } from "next/navigation";
import MemberForm from "@/components/MemberForm";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { ArrowLeft } from "lucide-react";

async function getMember(id: string) {
  const baseUrl = process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3000";

  try {
    const response = await fetch(`${baseUrl}/api/members/${id}`, {
      cache: "no-store",
    });

    if (response.ok) {
      return response.json();
    }
    return null;
  } catch (error) {
    console.error("Error fetching member:", error);
    return null;
  }
}

export default async function EditMemberPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { userId } = await auth();
  if (!userId) redirect("/sign-in");

  const user = await currentUser();
  const userRole = user?.unsafeMetadata?.role as string;
  const userAgencyId = user?.unsafeMetadata?.agencyId as string;

  // Only admins can edit members
  if (
    userRole !== "SUPER_ADMIN" &&
    userRole !== "ADMIN" &&
    userRole !== "AGENCY_ADMIN"
  ) {
    redirect("/dashboard");
  }

  const { id } = await params;
  const member = await getMember(id);

  if (!member) {
    redirect("/members");
  }

  // Agency admins can only edit members from their agency
  if (
    (userRole === "ADMIN" || userRole === "AGENCY_ADMIN") &&
    member.agencyId !== userAgencyId
  ) {
    redirect("/members");
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-indigo-500 via-purple-500 to-pink-500">
      <div className="container mx-auto py-10 px-4">
        <div className="max-w-2xl mx-auto">
          <div className="mb-6">
            <Link href="/members">
              <Button
                variant="outline"
                className="bg-white/10 text-white border-white/20 hover:bg-white/20"
              >
                <ArrowLeft className="mr-2 h-4 w-4" />
                Back to Members
              </Button>
            </Link>
          </div>

          <div className="bg-white/10 backdrop-blur-md rounded-xl p-8 border border-white/20">
            <h1 className="text-3xl font-bold text-white mb-6">Edit Member</h1>
            <div className="bg-white rounded-lg p-6">
              <MemberForm member={member} mode="edit" />
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
