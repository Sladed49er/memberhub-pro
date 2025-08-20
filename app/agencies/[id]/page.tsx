// app/agencies/[id]/page.tsx
"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { useUser } from "@clerk/nextjs";
import Link from "next/link";
import Header from "@/components/Header";
import { Button } from "@/components/ui/button";
import {
  Plus,
  Edit,
  Trash2,
  Users,
  Building2,
  Mail,
  Phone,
  MapPin,
  Globe,
} from "lucide-react";

interface Member {
  id: string;
  firstName: string;
  lastName: string;
  email: string;
  phone: string;
  role: string;
  status: string;
  createdAt: string;
  agencyId: string;
}

interface Agency {
  id: string;
  name: string;
  email: string;
  phone: string | null;
  address: string | null;
  city: string | null;
  state: string | null;
  zipCode: string | null;
  website: string | null;
  primaryContactName: string | null;
  primaryContactEmail: string | null;
  primaryContactPhone: string | null;
  status: string;
  membershipType: string;
  users: Member[];
  _count: {
    users: number;
  };
}

export default function AgencyDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const router = useRouter();
  const { user, isLoaded } = useUser();
  const [agency, setAgency] = useState<Agency | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [agencyId, setAgencyId] = useState<string>("");

  const userRole = user?.unsafeMetadata?.role as string;
  const userAgencyId = user?.unsafeMetadata?.agencyId as string;

  useEffect(() => {
    async function getParams() {
      const { id } = await params;
      setAgencyId(id);
    }
    getParams();
  }, [params]);

  useEffect(() => {
    if (isLoaded && user && agencyId) {
      fetchAgency();
    }
  }, [isLoaded, user, agencyId]);

  const fetchAgency = async () => {
    try {
      setLoading(true);
      const response = await fetch(`/api/agencies/${agencyId}`);

      if (!response.ok) {
        if (response.status === 403) {
          setError("You don't have permission to view this agency");
          return;
        }
        throw new Error("Failed to fetch agency");
      }

      const data = await response.json();
      setAgency(data);
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const handleDeleteMember = async (memberId: string) => {
    if (!confirm("Are you sure you want to remove this member?")) return;

    try {
      const response = await fetch(`/api/members/${memberId}`, {
        method: "DELETE",
      });

      if (!response.ok) {
        throw new Error("Failed to delete member");
      }

      // Refresh agency data
      fetchAgency();
    } catch (err: any) {
      alert(err.message);
    }
  };

  if (!isLoaded) {
    return (
      <div className="flex justify-center items-center h-screen">
        <div className="text-xl">Loading...</div>
      </div>
    );
  }

  // Check permissions
  if (userRole === "AGENCY_ADMIN" && agencyId && agencyId !== userAgencyId) {
    return (
      <div className="flex flex-col items-center justify-center h-screen">
        <h1 className="text-2xl font-bold mb-4">Access Denied</h1>
        <p className="text-gray-600">
          You don't have permission to view this agency.
        </p>
        <Link href="/dashboard">
          <Button className="mt-4">Back to Dashboard</Button>
        </Link>
      </div>
    );
  }

  if (loading) {
    return (
      <div className="flex justify-center items-center h-screen">
        <div className="text-xl">Loading agency details...</div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex flex-col items-center justify-center h-screen">
        <h1 className="text-2xl font-bold mb-4">Error</h1>
        <p className="text-red-600">{error}</p>
        <Link href="/dashboard">
          <Button className="mt-4">Back to Dashboard</Button>
        </Link>
      </div>
    );
  }

  if (!agency) {
    return (
      <div className="flex flex-col items-center justify-center h-screen">
        <h1 className="text-2xl font-bold mb-4">Agency Not Found</h1>
        <Link href="/dashboard">
          <Button>Back to Dashboard</Button>
        </Link>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <Header />

      <div className="container mx-auto py-8 px-4">
        {/* Agency Header */}
        <div className="bg-white rounded-lg shadow-sm p-6 mb-6">
          <div className="flex justify-between items-start mb-4">
            <div>
              <h1 className="text-3xl font-bold text-gray-900 flex items-center gap-3">
                <Building2 className="h-8 w-8 text-blue-600" />
                {agency.name}
              </h1>
              <div className="flex items-center gap-4 mt-2">
                <span
                  className={`px-3 py-1 rounded-full text-sm font-medium ${
                    agency.status === "ACTIVE"
                      ? "bg-green-100 text-green-800"
                      : agency.status === "INACTIVE"
                      ? "bg-gray-100 text-gray-800"
                      : "bg-red-100 text-red-800"
                  }`}
                >
                  {agency.status}
                </span>
                <span className="px-3 py-1 bg-blue-100 text-blue-800 rounded-full text-sm font-medium">
                  {agency.membershipType.replace("_", " ")}
                </span>
              </div>
            </div>

            <div className="flex gap-2">
              <Link href={`/agencies/${agency.id}/edit`}>
                <Button variant="outline">
                  <Edit className="mr-2 h-4 w-4" />
                  Edit Agency
                </Button>
              </Link>
              {userRole === "SUPER_ADMIN" && (
                <Button
                  variant="destructive"
                  onClick={async () => {
                    if (
                      confirm("Are you sure you want to delete this agency?")
                    ) {
                      try {
                        const response = await fetch(
                          `/api/agencies/${agency.id}`,
                          {
                            method: "DELETE",
                          }
                        );
                        if (response.ok) {
                          router.push("/agencies");
                        }
                      } catch (err) {
                        alert("Failed to delete agency");
                      }
                    }
                  }}
                >
                  <Trash2 className="mr-2 h-4 w-4" />
                  Delete Agency
                </Button>
              )}
            </div>
          </div>

          {/* Agency Details */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 mt-6">
            {agency.email && (
              <div className="flex items-center gap-2 text-gray-600">
                <Mail className="h-4 w-4" />
                <span>{agency.email}</span>
              </div>
            )}
            {agency.phone && (
              <div className="flex items-center gap-2 text-gray-600">
                <Phone className="h-4 w-4" />
                <span>{agency.phone}</span>
              </div>
            )}
            {agency.address && (
              <div className="flex items-center gap-2 text-gray-600">
                <MapPin className="h-4 w-4" />
                <span>{agency.address}</span>
              </div>
            )}
            {agency.website && (
              <div className="flex items-center gap-2 text-gray-600">
                <Globe className="h-4 w-4" />
                <a
                  href={agency.website}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-blue-600 hover:underline"
                >
                  {agency.website}
                </a>
              </div>
            )}
          </div>

          {/* Primary Contact */}
          {agency.primaryContactName && (
            <div className="mt-6 pt-6 border-t">
              <h3 className="text-sm font-semibold text-gray-900 mb-2">
                Primary Contact
              </h3>
              <div className="space-y-1 text-sm text-gray-600">
                <p>{agency.primaryContactName}</p>
                {agency.primaryContactEmail && (
                  <p>{agency.primaryContactEmail}</p>
                )}
                {agency.primaryContactPhone && (
                  <p>{agency.primaryContactPhone}</p>
                )}
              </div>
            </div>
          )}
        </div>

        {/* Members Section */}
        <div className="bg-white rounded-lg shadow-sm p-6">
          <div className="flex justify-between items-center mb-6">
            <h2 className="text-2xl font-bold text-gray-900 flex items-center gap-2">
              <Users className="h-6 w-6 text-blue-600" />
              Members ({agency._count?.users || 0})
            </h2>
            <Link href="/members/new">
              <Button>
                <Plus className="mr-2 h-4 w-4" />
                Add Member
              </Button>
            </Link>
          </div>

          {agency.users && agency.users.length > 0 ? (
            <div className="overflow-x-auto">
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
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Actions
                    </th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {agency.users.map((member) => (
                    <tr key={member.id} className="hover:bg-gray-50">
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="text-sm font-medium text-gray-900">
                          {member.firstName} {member.lastName}
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="text-sm text-gray-500">
                          {member.email}
                        </div>
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
                      <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                        <div className="flex gap-2">
                          <Link href={`/members/${member.id}/edit`}>
                            <Button variant="outline" size="sm">
                              <Edit className="h-4 w-4" />
                            </Button>
                          </Link>
                          <Button
                            variant="destructive"
                            size="sm"
                            onClick={() => handleDeleteMember(member.id)}
                          >
                            <Trash2 className="h-4 w-4" />
                          </Button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          ) : (
            <div className="text-center py-8">
              <Users className="mx-auto h-12 w-12 text-gray-400" />
              <p className="mt-2 text-sm text-gray-500">
                No members in this agency yet.
              </p>
              <Link href="/members/new">
                <Button className="mt-4">
                  <Plus className="mr-2 h-4 w-4" />
                  Add First Member
                </Button>
              </Link>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
