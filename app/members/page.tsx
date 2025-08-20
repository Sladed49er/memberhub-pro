// app/members/page.tsx
import { auth } from "@clerk/nextjs/server";
import { currentUser } from "@clerk/nextjs/server";
import { redirect } from "next/navigation";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Plus, Edit, Trash2 } from "lucide-react";

async function getMembers(userRole: string, agencyId?: string) {
  const baseUrl = process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3000";

  try {
    const response = await fetch(`${baseUrl}/api/members`, {
      cache: "no-store",
    });

    if (response.ok) {
      const members = await response.json();

      // For Agency Admins, filter to only show their agency's members
      if (userRole === "AGENCY_ADMIN" && agencyId) {
        return members.filter((member: any) => member.agencyId === agencyId);
      }

      return members;
    }

    return [];
  } catch (error) {
    console.error("Error fetching members:", error);
    return [];
  }
}

export default async function MembersPage() {
  const { userId } = await auth();
  if (!userId) redirect("/sign-in");

  const user = await currentUser();
  const userRole = user?.unsafeMetadata?.role as string;
  const userAgencyId = user?.unsafeMetadata?.agencyId as string;
  const userAgencyName = user?.unsafeMetadata?.agencyName as string;

  // Regular members shouldn't access this page
  if (userRole === "AGENCY_USER" || !userRole) {
    redirect("/dashboard");
  }

  const members = await getMembers(userRole, userAgencyId);

  return (
    <div className="container mx-auto py-10">
      <div className="flex justify-between items-center mb-8">
        <div>
          <h1 className="text-3xl font-bold">
            {userRole === "AGENCY_ADMIN" ? "Agency Members" : "All Members"}
          </h1>
          {userRole === "AGENCY_ADMIN" && (
            <p className="text-gray-600 mt-2">
              Managing members for: {userAgencyName}
            </p>
          )}
        </div>

        <Link href="/members/new">
          <Button>
            <Plus className="mr-2 h-4 w-4" />
            Add New Member
          </Button>
        </Link>
      </div>

      <div className="bg-white shadow-sm rounded-lg overflow-hidden">
        <table className="min-w-full divide-y divide-gray-200">
          <thead className="bg-gray-50">
            <tr>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Name
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Email
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Phone
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Role
              </th>
              {userRole === "SUPER_ADMIN" && (
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Agency
                </th>
              )}
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Actions
              </th>
            </tr>
          </thead>
          <tbody className="bg-white divide-y divide-gray-200">
            {members.map((member: any) => (
              <tr key={member.id} className="hover:bg-gray-50">
                <td className="px-6 py-4 whitespace-nowrap">
                  <div className="text-sm font-medium text-gray-900">
                    {member.firstName} {member.lastName}
                  </div>
                </td>
                <td className="px-6 py-4 whitespace-nowrap">
                  <div className="text-sm text-gray-500">{member.email}</div>
                </td>
                <td className="px-6 py-4 whitespace-nowrap">
                  <div className="text-sm text-gray-500">
                    {member.phone || "-"}
                  </div>
                </td>
                <td className="px-6 py-4 whitespace-nowrap">
                  <span
                    className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full ${
                      member.role === "SUPER_ADMIN"
                        ? "bg-purple-100 text-purple-800"
                        : member.role === "AGENCY_ADMIN"
                        ? "bg-blue-100 text-blue-800"
                        : "bg-green-100 text-green-800"
                    }`}
                  >
                    {member.role === "SUPER_ADMIN"
                      ? "Super Admin"
                      : member.role === "AGENCY_ADMIN"
                      ? "Admin"
                      : "Member"}
                  </span>
                </td>
                {userRole === "SUPER_ADMIN" && (
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="text-sm text-gray-500">
                      {member.agency?.name || "-"}
                    </div>
                  </td>
                )}
                <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                  <div className="flex gap-2">
                    {/* Agency Admins can only edit members from their agency */}
                    {(userRole === "SUPER_ADMIN" ||
                      (userRole === "AGENCY_ADMIN" &&
                        member.agencyId === userAgencyId)) && (
                      <>
                        <Link href={`/members/${member.id}/edit`}>
                          <Button variant="outline" size="sm">
                            <Edit className="h-4 w-4" />
                          </Button>
                        </Link>

                        <Button
                          variant="destructive"
                          size="sm"
                          onClick={async () => {
                            if (
                              confirm(
                                "Are you sure you want to delete this member?"
                              )
                            ) {
                              await fetch(`/api/members/${member.id}`, {
                                method: "DELETE",
                              });
                              window.location.reload();
                            }
                          }}
                        >
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </>
                    )}
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>

        {members.length === 0 && (
          <div className="text-center py-10">
            <p className="text-gray-500">
              {userRole === "AGENCY_ADMIN"
                ? "No members in your agency yet."
                : "No members found."}
            </p>
          </div>
        )}
      </div>
    </div>
  );
}
