// app/agencies/page.tsx
import { auth } from "@clerk/nextjs/server";
import { currentUser } from "@clerk/nextjs/server";
import { redirect } from "next/navigation";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Plus, Edit, Trash2 } from "lucide-react";

async function getAgencies(userRole: string, agencyId?: string) {
  const baseUrl = process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3000";

  // For Agency Admins, only fetch their own agency
  if (userRole === "AGENCY_ADMIN" && agencyId) {
    try {
      const response = await fetch(`${baseUrl}/api/agencies/${agencyId}`, {
        cache: "no-store",
      });

      if (response.ok) {
        const agency = await response.json();
        return [agency]; // Return as array for consistent handling
      }
      return [];
    } catch (error) {
      console.error("Error fetching agency:", error);
      return [];
    }
  }

  // For Super Admins, fetch all agencies
  if (userRole === "SUPER_ADMIN") {
    try {
      const response = await fetch(`${baseUrl}/api/agencies`, {
        cache: "no-store",
      });

      if (response.ok) {
        return response.json();
      }
      return [];
    } catch (error) {
      console.error("Error fetching agencies:", error);
      return [];
    }
  }

  return [];
}

export default async function AgenciesPage() {
  const { userId } = await auth();
  if (!userId) redirect("/sign-in");

  const user = await currentUser();
  const userRole = user?.unsafeMetadata?.role as string;
  const userAgencyId = user?.unsafeMetadata?.agencyId as string;

  // Regular members shouldn't access this page
  if (userRole === "AGENCY_USER" || !userRole) {
    redirect("/dashboard");
  }

  const agencies = await getAgencies(userRole, userAgencyId);

  return (
    <div className="container mx-auto py-10">
      <div className="flex justify-between items-center mb-8">
        <h1 className="text-3xl font-bold">
          {userRole === "AGENCY_ADMIN" ? "My Agency" : "All Agencies"}
        </h1>

        {/* Only Super Admins can create new agencies */}
        {userRole === "SUPER_ADMIN" && (
          <Link href="/agencies/new">
            <Button>
              <Plus className="mr-2 h-4 w-4" />
              Add New Agency
            </Button>
          </Link>
        )}
      </div>

      <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
        {agencies.map((agency: any) => (
          <div
            key={agency.id}
            className="border rounded-lg p-6 hover:shadow-lg transition-shadow"
          >
            <div className="flex justify-between items-start mb-4">
              <h2 className="text-xl font-semibold">{agency.name}</h2>
              <span
                className={`px-2 py-1 text-xs rounded-full ${
                  agency.status === "ACTIVE"
                    ? "bg-green-100 text-green-800"
                    : agency.status === "INACTIVE"
                    ? "bg-gray-100 text-gray-800"
                    : "bg-red-100 text-red-800"
                }`}
              >
                {agency.status}
              </span>
            </div>

            <div className="space-y-2 text-sm text-gray-600">
              <p>
                <span className="font-medium">Phone:</span> {agency.phone}
              </p>
              <p>
                <span className="font-medium">Email:</span> {agency.email}
              </p>
              <p>
                <span className="font-medium">Membership:</span>{" "}
                {agency.membershipType}
              </p>
              <p>
                <span className="font-medium">Members:</span>{" "}
                {agency._count?.users || 0}
              </p>
            </div>

            <div className="flex gap-2 mt-4">
              <Link href={`/agencies/${agency.id}/edit`}>
                <Button variant="outline" size="sm">
                  <Edit className="mr-2 h-4 w-4" />
                  Edit
                </Button>
              </Link>

              {/* Only Super Admins can delete agencies */}
              {userRole === "SUPER_ADMIN" && (
                <Button
                  variant="destructive"
                  size="sm"
                  onClick={async () => {
                    if (
                      confirm("Are you sure you want to delete this agency?")
                    ) {
                      await fetch(`/api/agencies/${agency.id}`, {
                        method: "DELETE",
                      });
                      window.location.reload();
                    }
                  }}
                >
                  <Trash2 className="mr-2 h-4 w-4" />
                  Delete
                </Button>
              )}
            </div>
          </div>
        ))}
      </div>

      {agencies.length === 0 && (
        <div className="text-center py-10">
          <p className="text-gray-500">No agencies found.</p>
        </div>
      )}
    </div>
  );
}
