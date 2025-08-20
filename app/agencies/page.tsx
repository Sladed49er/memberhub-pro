// app/agencies/page.tsx
// Enhanced version with debugging to fix display issue

"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { useUser } from "@clerk/nextjs";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";

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
  const [deleteId, setDeleteId] = useState<string | null>(null);
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

  const handleDelete = async () => {
    if (!deleteId) return;

    try {
      const response = await fetch(`/api/agencies/${deleteId}`, {
        method: "DELETE",
      });

      if (!response.ok) {
        const data = await response.json();
        throw new Error(data.error || "Failed to delete agency");
      }

      // Refresh the list
      await fetchAgencies();
      setDeleteId(null);
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
    <div className="container mx-auto px-4 py-8">
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-3xl font-bold bg-gradient-to-r from-purple-600 to-pink-600 bg-clip-text text-transparent">
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
        <div className="bg-gray-50 rounded-lg p-8 text-center">
          <p className="text-gray-600 mb-4">No agencies found.</p>
          {canManageAgencies && (
            <Link href="/agencies/new">
              <Button className="bg-gradient-to-r from-purple-600 to-pink-600 text-white">
                Create First Agency
              </Button>
            </Link>
          )}
        </div>
      ) : (
        <div className="bg-white rounded-lg shadow overflow-hidden">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Agency Name
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Email
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Phone
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  City, State
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Membership
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Status
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Actions
                </th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {agencies.map((agency) => (
                <tr key={agency.id} className="hover:bg-gray-50">
                  <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                    {agency.name}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                    {agency.email}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                    {agency.phone || "-"}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                    {agency.city && agency.state
                      ? `${agency.city}, ${agency.state}`
                      : "-"}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                    <span className="px-2 py-1 text-xs rounded-full bg-purple-100 text-purple-800">
                      {agency.membershipType?.replace(/_/g, " ") || "Not Set"}
                    </span>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm">
                    <span
                      className={`px-2 py-1 text-xs rounded-full ${
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
                  <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                    <div className="flex space-x-2">
                      <Link href={`/agencies/${agency.id}`}>
                        <Button variant="outline" size="sm">
                          View
                        </Button>
                      </Link>
                      {canManageAgencies && (
                        <>
                          <Link href={`/agencies/${agency.id}/edit`}>
                            <Button variant="outline" size="sm">
                              Edit
                            </Button>
                          </Link>
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => setDeleteId(agency.id)}
                            className="text-red-600 hover:text-red-700"
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

      {/* Delete Confirmation Dialog */}
      <AlertDialog open={!!deleteId} onOpenChange={() => setDeleteId(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Are you sure?</AlertDialogTitle>
            <AlertDialogDescription>
              This will permanently delete this agency and all associated
              members. This action cannot be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleDelete}
              className="bg-red-600 hover:bg-red-700"
            >
              Delete
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
