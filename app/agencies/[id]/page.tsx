// app/agencies/[id]/page.tsx
// View single agency page

"use client";

import { useEffect, useState, use } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { useUser } from "@clerk/nextjs";
import { Button } from "@/components/ui/button";

interface Agency {
  id: string;
  name: string;
  email: string;
  phone?: string;
  address?: string;
  city?: string;
  state?: string;
  zipCode?: string;
  website?: string;
  membershipType?: string;
  status: string;
  primaryContactName?: string;
  primaryContactEmail?: string;
  primaryContactPhone?: string;
  createdAt: string;
  updatedAt: string;
  users?: Array<{
    id: string;
    email: string;
    firstName?: string;
    lastName?: string;
    role: string;
  }>;
}

export default function AgencyViewPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const resolvedParams = use(params);
  const { user } = useUser();
  const router = useRouter();
  const [agency, setAgency] = useState<Agency | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const userRole = user?.unsafeMetadata?.role as string;
  const userAgencyId = user?.unsafeMetadata?.agencyId as string;

  // Check permissions
  const canView =
    userRole === "SUPER_ADMIN" ||
    (userRole === "ADMIN" && userAgencyId === resolvedParams.id) ||
    (userRole === "PRIMARY" && userAgencyId === resolvedParams.id);

  const canEdit =
    userRole === "SUPER_ADMIN" ||
    (userRole === "ADMIN" && userAgencyId === resolvedParams.id);

  useEffect(() => {
    if (!canView) {
      setError("You do not have permission to view this agency");
      setLoading(false);
      return;
    }

    fetchAgency();
  }, [resolvedParams.id, canView]);

  const fetchAgency = async () => {
    try {
      const response = await fetch(`/api/agencies/${resolvedParams.id}`);

      if (!response.ok) {
        const data = await response.json();
        throw new Error(data.error || "Failed to fetch agency");
      }

      const data = await response.json();
      setAgency(data);
    } catch (err) {
      console.error("Error fetching agency:", err);
      setError(err instanceof Error ? err.message : "An error occurred");
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="container mx-auto px-4 py-8">
        <div className="flex justify-center items-center h-64">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-purple-600"></div>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="container mx-auto px-4 py-8">
        <div className="bg-red-50 border border-red-200 rounded-lg p-4">
          <p className="text-red-800">{error}</p>
          <button
            onClick={() => router.back()}
            className="mt-4 text-red-600 underline"
          >
            Go back
          </button>
        </div>
      </div>
    );
  }

  if (!agency) {
    return (
      <div className="container mx-auto px-4 py-8">
        <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4">
          <p className="text-yellow-800">Agency not found</p>
        </div>
      </div>
    );
  }

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="max-w-4xl mx-auto">
        {/* Header */}
        <div className="flex justify-between items-start mb-6">
          <div>
            <h1 className="text-3xl font-bold bg-gradient-to-r from-purple-600 to-pink-600 bg-clip-text text-transparent">
              {agency.name}
            </h1>
            <div className="flex items-center gap-4 mt-2">
              <span
                className={`px-3 py-1 text-sm rounded-full ${
                  agency.status === "ACTIVE"
                    ? "bg-green-100 text-green-800"
                    : agency.status === "PENDING"
                    ? "bg-yellow-100 text-yellow-800"
                    : agency.status === "SUSPENDED"
                    ? "bg-red-100 text-red-800"
                    : "bg-gray-100 text-gray-800"
                }`}
              >
                {agency.status}
              </span>
              {agency.membershipType && (
                <span className="px-3 py-1 text-sm rounded-full bg-purple-100 text-purple-800">
                  {agency.membershipType.replace(/_/g, " ")}
                </span>
              )}
            </div>
          </div>

          {canEdit && (
            <div className="flex gap-2">
              <Link href={`/agencies/${agency.id}/edit`}>
                <Button className="bg-gradient-to-r from-purple-600 to-pink-600 text-white">
                  Edit Agency
                </Button>
              </Link>
              <Link href="/agencies">
                <Button variant="outline">Back to Agencies</Button>
              </Link>
            </div>
          )}
        </div>

        {/* Agency Details */}
        <div className="bg-white rounded-lg shadow-lg p-6 space-y-6">
          {/* Contact Information */}
          <div>
            <h2 className="text-lg font-semibold mb-4 text-gray-900">
              Contact Information
            </h2>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <p className="text-sm text-gray-600">Email</p>
                <p className="font-medium">{agency.email}</p>
              </div>
              {agency.phone && (
                <div>
                  <p className="text-sm text-gray-600">Phone</p>
                  <p className="font-medium">{agency.phone}</p>
                </div>
              )}
              {agency.website && (
                <div>
                  <p className="text-sm text-gray-600">Website</p>
                  <a
                    href={agency.website}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="font-medium text-purple-600 hover:text-purple-700"
                  >
                    {agency.website}
                  </a>
                </div>
              )}
            </div>
          </div>

          {/* Address */}
          {(agency.address ||
            agency.city ||
            agency.state ||
            agency.zipCode) && (
            <div>
              <h2 className="text-lg font-semibold mb-4 text-gray-900">
                Address
              </h2>
              <div className="text-gray-700">
                {agency.address && <p>{agency.address}</p>}
                {(agency.city || agency.state || agency.zipCode) && (
                  <p>
                    {agency.city && `${agency.city}, `}
                    {agency.state && `${agency.state} `}
                    {agency.zipCode}
                  </p>
                )}
              </div>
            </div>
          )}

          {/* Primary Contact */}
          {(agency.primaryContactName ||
            agency.primaryContactEmail ||
            agency.primaryContactPhone) && (
            <div>
              <h2 className="text-lg font-semibold mb-4 text-gray-900">
                Primary Contact
              </h2>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {agency.primaryContactName && (
                  <div>
                    <p className="text-sm text-gray-600">Name</p>
                    <p className="font-medium">{agency.primaryContactName}</p>
                  </div>
                )}
                {agency.primaryContactEmail && (
                  <div>
                    <p className="text-sm text-gray-600">Email</p>
                    <p className="font-medium">{agency.primaryContactEmail}</p>
                  </div>
                )}
                {agency.primaryContactPhone && (
                  <div>
                    <p className="text-sm text-gray-600">Phone</p>
                    <p className="font-medium">{agency.primaryContactPhone}</p>
                  </div>
                )}
              </div>
            </div>
          )}

          {/* Agency Members */}
          {agency.users && agency.users.length > 0 && (
            <div>
              <h2 className="text-lg font-semibold mb-4 text-gray-900">
                Agency Members ({agency.users.length})
              </h2>
              <div className="bg-gray-50 rounded-lg overflow-hidden">
                <table className="min-w-full">
                  <thead className="bg-gray-100">
                    <tr>
                      <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase">
                        Name
                      </th>
                      <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase">
                        Email
                      </th>
                      <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase">
                        Role
                      </th>
                    </tr>
                  </thead>
                  <tbody className="bg-white divide-y divide-gray-200">
                    {agency.users.map((member) => (
                      <tr key={member.id}>
                        <td className="px-4 py-2 text-sm text-gray-900">
                          {member.firstName} {member.lastName}
                        </td>
                        <td className="px-4 py-2 text-sm text-gray-500">
                          {member.email}
                        </td>
                        <td className="px-4 py-2 text-sm">
                          <span className="px-2 py-1 text-xs rounded-full bg-purple-100 text-purple-800">
                            {member.role}
                          </span>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}

          {/* Metadata */}
          <div className="pt-4 border-t border-gray-200">
            <div className="grid grid-cols-2 gap-4 text-sm text-gray-500">
              <div>
                <span className="font-medium">Created:</span>{" "}
                {new Date(agency.createdAt).toLocaleDateString()}
              </div>
              <div>
                <span className="font-medium">Last Updated:</span>{" "}
                {new Date(agency.updatedAt).toLocaleDateString()}
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
