// app/debug-db/page.tsx
// Diagnostic page to check database directly

"use client";

import { useEffect, useState } from "react";
import { useUser } from "@clerk/nextjs";
import { Button } from "@/components/ui/button";

export default function DebugDatabasePage() {
  const { user } = useUser();
  const [data, setData] = useState<any>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const userRole = user?.unsafeMetadata?.role as string;

  // Only allow Super Admins to view this page
  if (userRole !== "SUPER_ADMIN") {
    return (
      <div className="container mx-auto px-4 py-8">
        <div className="bg-red-50 border border-red-200 rounded-lg p-4">
          <p className="text-red-800">Access denied. Super Admin only.</p>
        </div>
      </div>
    );
  }

  const fetchDatabaseInfo = async () => {
    setLoading(true);
    setError(null);

    try {
      const response = await fetch("/api/debug-db");
      const result = await response.json();

      if (!response.ok) {
        throw new Error(result.error || "Failed to fetch database info");
      }

      setData(result);
    } catch (err) {
      setError(err instanceof Error ? err.message : "An error occurred");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="container mx-auto px-4 py-8">
      <h1 className="text-3xl font-bold mb-6 bg-gradient-to-r from-purple-600 to-pink-600 bg-clip-text text-transparent">
        Database Diagnostic Tool
      </h1>

      <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4 mb-6">
        <p className="text-yellow-800 font-semibold">
          ⚠️ Development Tool Only
        </p>
        <p className="text-yellow-700 text-sm">
          This page shows raw database contents for debugging.
        </p>
      </div>

      <Button
        onClick={fetchDatabaseInfo}
        disabled={loading}
        className="mb-6 bg-gradient-to-r from-purple-600 to-pink-600 text-white"
      >
        {loading ? "Fetching..." : "Fetch Database Info"}
      </Button>

      {error && (
        <div className="bg-red-50 border border-red-200 rounded-lg p-4 mb-6">
          <p className="text-red-800">Error: {error}</p>
        </div>
      )}

      {data && (
        <div className="space-y-6">
          {/* Summary */}
          <div className="bg-white rounded-lg shadow p-6">
            <h2 className="text-xl font-bold mb-4">Summary</h2>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <p className="text-gray-600">Total Agencies:</p>
                <p className="text-2xl font-bold text-purple-600">
                  {data.agencyCount}
                </p>
              </div>
              <div>
                <p className="text-gray-600">Total Users:</p>
                <p className="text-2xl font-bold text-pink-600">
                  {data.userCount}
                </p>
              </div>
            </div>
          </div>

          {/* All Agencies */}
          <div className="bg-white rounded-lg shadow p-6">
            <h2 className="text-xl font-bold mb-4">All Agencies in Database</h2>
            {data.agencies && data.agencies.length > 0 ? (
              <div className="overflow-x-auto">
                <table className="min-w-full divide-y divide-gray-200">
                  <thead className="bg-gray-50">
                    <tr>
                      <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase">
                        ID
                      </th>
                      <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase">
                        Name
                      </th>
                      <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase">
                        Email
                      </th>
                      <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase">
                        Status
                      </th>
                      <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase">
                        Created
                      </th>
                    </tr>
                  </thead>
                  <tbody className="bg-white divide-y divide-gray-200">
                    {data.agencies.map((agency: any) => (
                      <tr key={agency.id}>
                        <td className="px-4 py-2 text-sm font-mono text-gray-500">
                          {agency.id.substring(0, 8)}...
                        </td>
                        <td className="px-4 py-2 text-sm text-gray-900">
                          {agency.name}
                        </td>
                        <td className="px-4 py-2 text-sm text-gray-500">
                          {agency.email}
                        </td>
                        <td className="px-4 py-2 text-sm">
                          <span
                            className={`px-2 py-1 text-xs rounded-full ${
                              agency.status === "ACTIVE"
                                ? "bg-green-100 text-green-800"
                                : "bg-gray-100 text-gray-800"
                            }`}
                          >
                            {agency.status}
                          </span>
                        </td>
                        <td className="px-4 py-2 text-sm text-gray-500">
                          {new Date(agency.createdAt).toLocaleDateString()}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            ) : (
              <p className="text-gray-500">No agencies found in database.</p>
            )}
          </div>

          {/* All Users */}
          <div className="bg-white rounded-lg shadow p-6">
            <h2 className="text-xl font-bold mb-4">All Users in Database</h2>
            {data.users && data.users.length > 0 ? (
              <div className="overflow-x-auto">
                <table className="min-w-full divide-y divide-gray-200">
                  <thead className="bg-gray-50">
                    <tr>
                      <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase">
                        ID
                      </th>
                      <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase">
                        Email
                      </th>
                      <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase">
                        Name
                      </th>
                      <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase">
                        Role
                      </th>
                      <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase">
                        Agency ID
                      </th>
                    </tr>
                  </thead>
                  <tbody className="bg-white divide-y divide-gray-200">
                    {data.users.map((user: any) => (
                      <tr key={user.id}>
                        <td className="px-4 py-2 text-sm font-mono text-gray-500">
                          {user.id.substring(0, 8)}...
                        </td>
                        <td className="px-4 py-2 text-sm text-gray-900">
                          {user.email}
                        </td>
                        <td className="px-4 py-2 text-sm text-gray-500">
                          {user.firstName} {user.lastName}
                        </td>
                        <td className="px-4 py-2 text-sm">
                          <span className="px-2 py-1 text-xs rounded-full bg-purple-100 text-purple-800">
                            {user.role}
                          </span>
                        </td>
                        <td className="px-4 py-2 text-sm font-mono text-gray-500">
                          {user.agencyId
                            ? user.agencyId.substring(0, 8) + "..."
                            : "-"}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            ) : (
              <p className="text-gray-500">No users found in database.</p>
            )}
          </div>

          {/* Raw JSON Data */}
          <div className="bg-white rounded-lg shadow p-6">
            <h2 className="text-xl font-bold mb-4">Raw JSON Data</h2>
            <pre className="bg-gray-50 p-4 rounded-lg overflow-x-auto text-xs">
              {JSON.stringify(data, null, 2)}
            </pre>
          </div>
        </div>
      )}
    </div>
  );
}
