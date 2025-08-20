// app/agencies/page.tsx
import { auth } from "@clerk/nextjs/server";
import { currentUser } from "@clerk/nextjs/server";
import { redirect } from "next/navigation";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import {
  Plus,
  Edit,
  Trash2,
  Building2,
  Mail,
  Phone,
  MapPin,
  Users,
} from "lucide-react";

async function getAgencies(userRole: string, agencyId?: string) {
  const baseUrl = process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3000";

  try {
    const response = await fetch(`${baseUrl}/api/agencies`, {
      cache: "no-store",
    });

    if (response.ok) {
      const agencies = await response.json();

      // For Agency Admins, filter to only their agency
      if ((userRole === "ADMIN" || userRole === "AGENCY_ADMIN") && agencyId) {
        return agencies.filter((agency: any) => agency.id === agencyId);
      }

      return agencies;
    }
    return [];
  } catch (error) {
    console.error("Error fetching agencies:", error);
    return [];
  }
}

export default async function AgenciesPage() {
  const { userId } = await auth();
  if (!userId) redirect("/sign-in");

  const user = await currentUser();
  const userRole = user?.unsafeMetadata?.role as string;
  const userAgencyId = user?.unsafeMetadata?.agencyId as string;
  const userAgencyName = user?.unsafeMetadata?.agencyName as string;

  // Regular members shouldn't access this page
  if (userRole === "STANDARD" || userRole === "GUEST" || !userRole) {
    redirect("/dashboard");
  }

  const agencies = await getAgencies(userRole, userAgencyId);

  return (
    <div className="min-h-screen bg-gradient-to-br from-indigo-500 via-purple-500 to-pink-500">
      <div className="container mx-auto py-10 px-4">
        {/* Page Header */}
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mb-8">
          <div>
            <h1 className="text-3xl font-bold text-white">
              {userRole === "AGENCY_ADMIN" || userRole === "ADMIN"
                ? "My Agency"
                : "All Agencies"}
            </h1>
            {(userRole === "AGENCY_ADMIN" || userRole === "ADMIN") &&
              userAgencyName && (
                <p className="text-white/80 mt-2">Managing: {userAgencyName}</p>
              )}
            {userRole === "SUPER_ADMIN" && (
              <p className="text-white/80 mt-2">
                Total agencies: {agencies.length}
              </p>
            )}
          </div>

          {/* Only Super Admins can create new agencies */}
          {userRole === "SUPER_ADMIN" && (
            <Link href="/agencies/new">
              <Button className="bg-white/20 backdrop-blur-sm text-white border border-white/30 hover:bg-white/30">
                <Plus className="mr-2 h-4 w-4" />
                Add New Agency
              </Button>
            </Link>
          )}
        </div>

        {/* Agencies Grid */}
        {agencies.length > 0 ? (
          <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
            {agencies.map((agency: any) => (
              <div
                key={agency.id}
                className="bg-white/10 backdrop-blur-md border border-white/20 rounded-xl p-6 hover:bg-white/15 transition-all"
              >
                {/* Agency Header */}
                <div className="flex justify-between items-start mb-4">
                  <div className="flex items-start gap-3">
                    <div className="p-2 bg-white/20 rounded-lg">
                      <Building2 className="h-5 w-5 text-white" />
                    </div>
                    <div className="flex-1">
                      <h2 className="text-xl font-semibold text-white">
                        {agency.name}
                      </h2>
                      <span
                        className={`inline-flex items-center px-2 py-1 rounded-full text-xs font-medium mt-2 ${
                          agency.status === "ACTIVE"
                            ? "bg-green-500/30 text-green-200"
                            : agency.status === "INACTIVE"
                            ? "bg-gray-500/30 text-gray-200"
                            : "bg-red-500/30 text-red-200"
                        }`}
                      >
                        {agency.status}
                      </span>
                    </div>
                  </div>
                </div>

                {/* Agency Details */}
                <div className="space-y-3 text-sm">
                  {agency.address && (
                    <div className="flex items-start gap-2 text-white/80">
                      <MapPin className="h-4 w-4 mt-0.5 text-white/60" />
                      <div>
                        <p>{agency.address}</p>
                        {(agency.city || agency.state || agency.zipCode) && (
                          <p>
                            {[agency.city, agency.state, agency.zipCode]
                              .filter(Boolean)
                              .join(", ")}
                          </p>
                        )}
                      </div>
                    </div>
                  )}

                  {agency.phone && (
                    <div className="flex items-center gap-2 text-white/80">
                      <Phone className="h-4 w-4 text-white/60" />
                      <span>{agency.phone}</span>
                    </div>
                  )}

                  {agency.email && (
                    <div className="flex items-center gap-2 text-white/80">
                      <Mail className="h-4 w-4 text-white/60" />
                      <span className="truncate">{agency.email}</span>
                    </div>
                  )}

                  <div className="flex items-center gap-2 text-white/80">
                    <Users className="h-4 w-4 text-white/60" />
                    <span>{agency._count?.users || 0} members</span>
                  </div>

                  <div className="pt-2 border-t border-white/20">
                    <span className="text-xs font-medium text-white/60">
                      Membership Type:
                    </span>
                    <span className="ml-2 text-sm font-semibold text-white">
                      {agency.membershipType?.replace("_", " ")}
                    </span>
                  </div>
                </div>

                {/* Action Buttons */}
                <div className="flex gap-2 mt-6 pt-4 border-t border-white/20">
                  <Link href={`/agencies/${agency.id}/edit`} className="flex-1">
                    <Button
                      variant="outline"
                      size="sm"
                      className="w-full bg-white/10 text-white border-white/20 hover:bg-white/20"
                    >
                      <Edit className="mr-2 h-4 w-4" />
                      Edit
                    </Button>
                  </Link>

                  <Link href={`/agencies/${agency.id}`}>
                    <Button
                      variant="outline"
                      size="sm"
                      className="bg-white/10 text-white border-white/20 hover:bg-white/20"
                    >
                      View
                    </Button>
                  </Link>

                  {/* Only Super Admins can delete agencies */}
                  {userRole === "SUPER_ADMIN" && (
                    <Button
                      variant="destructive"
                      size="sm"
                      className="bg-red-500/20 text-red-300 border-red-500/30 hover:bg-red-500/30"
                      onClick={async () => {
                        if (
                          confirm(
                            "Are you sure you want to delete this agency? This action cannot be undone."
                          )
                        ) {
                          try {
                            const response = await fetch(
                              `/api/agencies/${agency.id}`,
                              {
                                method: "DELETE",
                              }
                            );
                            if (response.ok) {
                              window.location.reload();
                            } else {
                              alert(
                                "Cannot delete agency with existing members"
                              );
                            }
                          } catch (error) {
                            alert("Failed to delete agency");
                          }
                        }
                      }}
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  )}
                </div>
              </div>
            ))}
          </div>
        ) : (
          /* Empty State */
          <div className="text-center py-12 bg-white/10 backdrop-blur-md rounded-xl border border-white/20">
            <Building2 className="mx-auto h-12 w-12 text-white/60" />
            <h3 className="mt-2 text-lg font-semibold text-white">
              No agencies found
            </h3>
            <p className="mt-1 text-white/70">
              {userRole === "AGENCY_ADMIN" || userRole === "ADMIN"
                ? "Your agency information could not be loaded."
                : "Get started by creating a new agency."}
            </p>
            {userRole === "SUPER_ADMIN" && (
              <div className="mt-6">
                <Link href="/agencies/new">
                  <Button className="bg-white/20 backdrop-blur-sm text-white border border-white/30 hover:bg-white/30">
                    <Plus className="mr-2 h-4 w-4" />
                    Add New Agency
                  </Button>
                </Link>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
