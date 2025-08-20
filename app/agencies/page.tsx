// app/agencies/page.tsx
// Simplified version without alert dialog for testing

"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { useUser } from "@clerk/nextjs";

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
}

export default function AgenciesPage() {
  const { user } = useUser();
  const router = useRouter();
  const [agencies, setAgencies] = useState<Agency[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [debugInfo, setDebugInfo] = useState<any>(null);

  const userRole = user?.unsafeMetadata?.role as string;
  const userAgencyId = user?.unsafeMetadata?.agencyId as string;

  // Check if user has permission to view all agencies
  const canViewAllAgencies = userRole === "SUPER_ADMIN";
  const canManageAgencies = userRole === "SUPER_ADMIN" || userRole === "ADMIN";

  useEffect(() => {
    fetchAgencies();
  }, [user]);

  const fetchAgencies = async () => {
    try {
      setLoading(true);
      setError(null);

      // Debug: Log the request being made
      console.log(
        "Fetching agencies with role:",
        userRole,
        "agencyId:",
        userAgencyId
      );

      const response = await fetch("/api/agencies", {
        headers: {
          "Content-Type": "application/json",
        },
      });

      // Debug: Log response status
      console.log("Response status:", response.status);

      const data = await response.json();

      // Debug: Log the raw response
      console.log("Raw API response:", data);

      if (!response.ok) {
        throw new Error(data.error || "Failed to fetch agencies");
      }

      // Set debug info for display
      setDebugInfo({
        role: userRole,
        agencyId: userAgencyId,
        totalAgencies: data.length,
        apiResponse: data,
      });

      setAgencies(data);
    } catch (err) {
      console.error("Error fetching agencies:", err);
      setError(err instanceof Error ? err.message : "An error occurred");
      setDebugInfo({
        error: err instanceof Error ? err.message : "Unknown error",
        role: userRole,
        agencyId: userAgencyId,
      });
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async (id: string) => {
    // Simple confirmation without alert dialog
    if (
      !confirm(
        "Are you sure you want to delete this agency? This action cannot be undone."
      )
    ) {
      return;
    }

    try {
      const response = await fetch(`/api/agencies/${id}`, {
        method: "DELETE",
      });

      if (!response.ok) {
        const data = await response.json();
        throw new Error(data.error || "Failed to delete agency");
      }

      // Refresh the list
      await fetchAgencies();
    } catch (err) {
      console.error("Error deleting agency:", err);
      alert(err instanceof Error ? err.message : "Failed to delete agency");
    }
  };

  // If user is not a Super Admin, redirect or show limited view
  if (userRole === "ADMIN" && userAgencyId) {
    // Redirect Agency Admins to their own agency page
    router.push(`/agencies/${userAgencyId}`);
    return null;
  }

  if (!canViewAllAgencies && !canManageAgencies) {
    return (
      <div className="container mx-auto px-4 py-8">
        <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4">
          <p className="text-yellow-800">
            You don't have permission to view this page.
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="px-4 py-8">
      <div className="flex justify-between items-center mb-8">
        <h1 className="text-4xl font-bold bg-gradient-to-r from-purple-600 to-pink-600 bg-clip-text text-transparent">
          All Agencies
        </h1>
        {canManageAgencies && (
          <Link href="/agencies/new">
            <Button className="bg-gradient-to-r from-purple-600 to-pink-600 text-white">
              + Add New Agency
            </Button>
          </Link>
        )}
      </div>

      {/* Debug Panel - Remove this in production */}
      {process.env.NODE_ENV === "development" && (
        <div className="mb-6 p-4 bg-gray-100 rounded-lg">
          <h3 className="font-bold mb-2">Debug Information:</h3>
          <pre className="text-xs overflow-auto">
            {JSON.stringify(debugInfo, null, 2)}
          </pre>
        </div>
      )}

      {error && (
        <div className="bg-red-50 border border-red-200 rounded-lg p-4 mb-6">
          <p className="text-red-800">Error: {error}</p>
          <button
            onClick={fetchAgencies}
            className="mt-2 text-sm text-red-600 underline"
          >
            Try again
          </button>
        </div>
      )}

      {loading ? (
        <div className="flex justify-center items-center h-64">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-purple-600"></div>
        </div>
      ) : agencies.length === 0 ? (
        <div className="bg-white/90 backdrop-blur-sm rounded-xl shadow-xl p-12 text-center border border-purple-100">
          <div className="max-w-md mx-auto">
            <svg
              className="mx-auto h-12 w-12 text-gray-400 mb-4"
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4"
              />
            </svg>
            <p className="text-gray-600 mb-6">No agencies found.</p>
            {canManageAgencies && (
              <Link href="/agencies/new">
                <Button className="bg-gradient-to-r from-purple-600 to-pink-600 text-white hover:from-purple-700 hover:to-pink-700">
                  Create First Agency
                </Button>
              </Link>
            )}
          </div>
        </div>
      ) : (
        <div className="bg-white/90 backdrop-blur-sm rounded-xl shadow-xl overflow-hidden border border-purple-100">
          <table className="min-w-full divide-y divide-purple-100">
            <thead className="bg-gradient-to-r from-purple-50 to-pink-50">
              <tr>
                <th className="px-6 py-4 text-left text-xs font-semibold text-gray-700 uppercase tracking-wider">
                  Agency Name
                </th>
                <th className="px-6 py-4 text-left text-xs font-semibold text-gray-700 uppercase tracking-wider">
                  Email
                </th>
                <th className="px-6 py-4 text-left text-xs font-semibold text-gray-700 uppercase tracking-wider">
                  Phone
                </th>
                <th className="px-6 py-4 text-left text-xs font-semibold text-gray-700 uppercase tracking-wider">
                  City, State
                </th>
                <th className="px-6 py-4 text-left text-xs font-semibold text-gray-700 uppercase tracking-wider">
                  Membership
                </th>
                <th className="px-6 py-4 text-left text-xs font-semibold text-gray-700 uppercase tracking-wider">
                  Status
                </th>
                <th className="px-6 py-4 text-left text-xs font-semibold text-gray-700 uppercase tracking-wider">
                  Actions
                </th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-purple-50">
              {agencies.map((agency) => (
                <tr
                  key={agency.id}
                  className="hover:bg-purple-50/50 transition-colors"
                >
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="text-sm font-semibold text-gray-900">
                      {agency.name}
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="text-sm text-gray-600">{agency.email}</div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="text-sm text-gray-600">
                      {agency.phone || "-"}
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="text-sm text-gray-600">
                      {agency.city && agency.state
                        ? `${agency.city}, ${agency.state}`
                        : "-"}
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <span className="px-3 py-1 text-xs font-medium rounded-full bg-gradient-to-r from-purple-100 to-pink-100 text-purple-800">
                      {agency.membershipType?.replace(/_/g, " ") || "Not Set"}
                    </span>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <span
                      className={`px-3 py-1 text-xs font-medium rounded-full ${
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
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="flex items-center space-x-2">
                      <Link href={`/agencies/${agency.id}`}>
                        <Button
                          variant="ghost"
                          size="sm"
                          className="text-purple-600 hover:text-purple-700 hover:bg-purple-50"
                        >
                          View
                        </Button>
                      </Link>
                      {canManageAgencies && (
                        <>
                          <Link href={`/agencies/${agency.id}/edit`}>
                            <Button
                              variant="ghost"
                              size="sm"
                              className="text-blue-600 hover:text-blue-700 hover:bg-blue-50"
                            >
                              Edit
                            </Button>
                          </Link>
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => handleDelete(agency.id)}
                            className="text-red-600 hover:text-red-700 hover:bg-red-50"
                          >
                            Delete
                          </Button>
                        </>
                      )}
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
