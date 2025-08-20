// app/agencies/new/page.tsx
import { auth } from "@clerk/nextjs/server";
import { currentUser } from "@clerk/nextjs/server";
import { redirect } from "next/navigation";
import AgencyForm from "@/components/AgencyForm";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { ArrowLeft } from "lucide-react";

export default async function NewAgencyPage() {
  const { userId } = await auth();
  if (!userId) redirect("/sign-in");

  const user = await currentUser();
  const userRole = user?.unsafeMetadata?.role as string;

  // Only Super Admins can create agencies
  if (userRole !== "SUPER_ADMIN") {
    redirect("/agencies");
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-indigo-500 via-purple-500 to-pink-500">
      <div className="container mx-auto py-10 px-4">
        <div className="max-w-2xl mx-auto">
          <div className="mb-6">
            <Link href="/agencies">
              <Button
                variant="outline"
                className="bg-white/10 text-white border-white/20 hover:bg-white/20"
              >
                <ArrowLeft className="mr-2 h-4 w-4" />
                Back to Agencies
              </Button>
            </Link>
          </div>

          <div className="bg-white/10 backdrop-blur-md rounded-xl p-8 border border-white/20">
            <h1 className="text-3xl font-bold text-white mb-6">
              Create New Agency
            </h1>
            <div className="bg-white rounded-lg p-6">
              <AgencyForm mode="create" />
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
