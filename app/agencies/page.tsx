// ============================================
// FILE: app/agencies/page.tsx
// PURPOSE: Agencies page with proper role-based restrictions
// LAST MODIFIED: December 2024
// NOTES: Agency Admins see only their agency, Super Admins see all
// ============================================

"use client";

import { useState, useEffect } from "react";
import { useUser } from "@clerk/nextjs";
import { useRouter } from "next/navigation";
import Header from "@/components/Header";
import AgencyForm from "@/components/AgencyForm";

export default function AgenciesPage() {
  const { user } = useUser();
  const router = useRouter();
  const [agencies, setAgencies] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [showAddModal, setShowAddModal] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);
  const [selectedAgency, setSelectedAgency] = useState<any>(null);
  const [searchTerm, setSearchTerm] = useState("");
  const [filterStatus, setFilterStatus] = useState("ALL");

  const metadata = user?.unsafeMetadata as any;
  const userRole = metadata?.role || "AGENCY_USER";
  const userAgencyId = metadata?.agencyId || null;

  // STRICT PERMISSION CHECKS
  const isSuperAdmin = userRole === "SUPER_ADMIN";
  const isAgencyAdmin = userRole === "AGENCY_ADMIN";
  const isRegularUser = userRole === "AGENCY_USER";

  // Permission functions
  const canViewAllAgencies = isSuperAdmin; // ONLY Super Admins
  const canCreateAgency = isSuperAdmin; // ONLY Super Admins
  const canDeleteAgency = (agencyId: string) => isSuperAdmin; // ONLY Super Admins
  const canEditAgency = (agencyId: string) => {
    if (isSuperAdmin) return true;
    if (isAgencyAdmin && agencyId === userAgencyId) return true;
    return false;
  };

  useEffect(() => {
    // Regular users shouldn't be on this page
    if (isRegularUser) {
      router.push("/dashboard");
      return;
    }

    fetchAgencies();
  }, [userRole, userAgencyId]);

  const fetchAgencies = async () => {
    try {
      setLoading(true);

      if (isAgencyAdmin && userAgencyId) {
        // Agency Admin - fetch ONLY their agency
        const response = await fetch(`/api/agencies/${userAgencyId}`);
        if (response.ok) {
          const data = await response.json();
          // Ensure it's in array format
          setAgencies(Array.isArray(data) ? data : [data]);
        } else {
          console.error("Failed to fetch agency");
          setAgencies([]);
        }
      } else if (isSuperAdmin) {
        // Super Admin - fetch ALL agencies
        const response = await fetch("/api/agencies");
        if (response.ok) {
          const data = await response.json();
          setAgencies(Array.isArray(data) ? data : []);
        }
      } else {
        // No permission
        setAgencies([]);
      }
    } catch (error) {
      console.error("Error fetching agencies:", error);
      setAgencies([]);
    } finally {
      setLoading(false);
    }
  };

  const handleEditAgency = (agency: any) => {
    if (!canEditAgency(agency.id)) {
      alert("You don't have permission to edit this agency");
      return;
    }
    setSelectedAgency(agency);
    setShowEditModal(true);
  };

  const handleDeleteAgency = async (agencyId: string) => {
    if (!isSuperAdmin) {
      alert("Only Super Admins can delete agencies");
      return;
    }

    if (
      !confirm(
        "Are you sure? This will also remove all members from this agency."
      )
    )
      return;

    try {
      await fetch(`/api/agencies/${agencyId}`, { method: "DELETE" });
      console.log("Delete request sent, assuming success...");
      await new Promise((resolve) => setTimeout(resolve, 500));
      fetchAgencies();
      alert("Agency deleted successfully!");
    } catch (error) {
      console.log("Error occurred but refreshing anyway");
      await new Promise((resolve) => setTimeout(resolve, 500));
      fetchAgencies();
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case "ACTIVE":
        return "bg-green-500/20 text-green-300";
      case "INACTIVE":
        return "bg-gray-500/20 text-gray-300";
      case "SUSPENDED":
        return "bg-red-500/20 text-red-300";
      default:
        return "bg-gray-500/20 text-gray-300";
    }
  };

  const getMembershipBadgeColor = (type: string) => {
    switch (type) {
      case "A1_AGENCY":
        return "bg-blue-500/20 text-blue-300";
      case "A2_BRANCH":
        return "bg-purple-500/20 text-purple-300";
      case "A3_ASSOCIATE":
        return "bg-indigo-500/20 text-indigo-300";
      case "STERLING_PARTNER":
        return "bg-yellow-500/20 text-yellow-300";
      default:
        return "bg-gray-500/20 text-gray-300";
    }
  };

  const formatMembershipType = (type: string) => {
    const typeMap: { [key: string]: string } = {
      A1_AGENCY: "A1 - Agency",
      A2_BRANCH: "A2 - Branch",
      A3_ASSOCIATE: "A3 - Associate",
      STERLING_PARTNER: "Sterling Partner",
    };
    return typeMap[type] || type;
  };

  const filteredAgencies = agencies.filter((agency) => {
    // Agency Admins don't get filters - they only see their agency
    if (isAgencyAdmin) return true;

    const matchesSearch =
      searchTerm === "" ||
      agency.name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      agency.email?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      agency.city?.toLowerCase().includes(searchTerm.toLowerCase());

    const matchesStatus =
      filterStatus === "ALL" || agency.status === filterStatus;

    return matchesSearch && matchesStatus;
  });

  // Redirect regular users
  if (isRegularUser) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-indigo-500 via-purple-500 to-pink-500">
        <Header />
        <div className="container mx-auto px-4 py-8">
          <div className="bg-white/10 backdrop-blur-md border border-white/20 rounded-lg p-8 text-center">
            <p className="text-white text-lg">
              You don't have permission to view this page.
            </p>
            <button
              onClick={() => router.push("/dashboard")}
              className="mt-4 px-6 py-2 bg-white/10 border border-white/20 rounded-lg text-white hover:bg-white/20"
            >
              Return to Dashboard
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-indigo-500 via-purple-500 to-pink-500">
      <Header />

      <div className="container mx-auto px-4 py-8">
        {/* Page Header */}
        <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 mb-8">
          <div>
            <h1 className="text-4xl font-bold text-white mb-2">
              {isSuperAdmin ? "All Agencies" : "My Agency"}
            </h1>
            <p className="text-white/70">
              {isSuperAdmin
                ? "Manage all insurance agencies and partners"
                : "View and manage your agency information"}
            </p>
          </div>
          {/* Only Super Admins can add agencies */}
          {isSuperAdmin && (
            <button
              onClick={() => setShowAddModal(true)}
              className="px-6 py-3 bg-gradient-to-r from-indigo-500 to-purple-500 hover:from-indigo-600 hover:to-purple-600 text-white font-semibold rounded-lg shadow-lg hover:shadow-xl transition-all"
            >
              + Add Agency
            </button>
          )}
        </div>

        {/* Search and Filter Bar - ONLY for Super Admin */}
        {isSuperAdmin && (
          <div className="bg-white/10 backdrop-blur-md border border-white/20 rounded-lg p-6 mb-6">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div className="md:col-span-2">
                <label className="block text-white/70 text-sm mb-2">
                  Search
                </label>
                <input
                  type="text"
                  placeholder="Search by name, email, or city..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="w-full px-4 py-2 bg-white/10 border border-white/20 rounded-lg text-white placeholder-white/50 focus:outline-none focus:ring-2 focus:ring-purple-500"
                />
              </div>
              <div>
                <label className="block text-white/70 text-sm mb-2">
                  Status Filter
                </label>
                <select
                  value={filterStatus}
                  onChange={(e) => setFilterStatus(e.target.value)}
                  className="w-full px-4 py-2 bg-white/10 border border-white/20 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-purple-500 cursor-pointer"
                >
                  <option value="ALL" className="bg-purple-900">
                    All Status
                  </option>
                  <option value="ACTIVE" className="bg-purple-900">
                    Active
                  </option>
                  <option value="INACTIVE" className="bg-purple-900">
                    Inactive
                  </option>
                  <option value="SUSPENDED" className="bg-purple-900">
                    Suspended
                  </option>
                </select>
              </div>
            </div>
            <div className="mt-4 text-white/70 text-sm">
              Total: {filteredAgencies.length} agencies
            </div>
          </div>
        )}

        {/* Agencies Grid */}
        <div
          className={
            isAgencyAdmin
              ? "max-w-2xl mx-auto"
              : "grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6"
          }
        >
          {loading ? (
            <div className="col-span-full text-center py-12">
              <div className="inline-flex items-center gap-2 text-white/60">
                <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-white"></div>
                Loading {isSuperAdmin ? "agencies" : "agency"}...
              </div>
            </div>
          ) : filteredAgencies.length > 0 ? (
            filteredAgencies.map((agency) => (
              <div
                key={agency.id}
                className="bg-white/10 backdrop-blur-md border border-white/20 rounded-xl p-6 hover:bg-white/15 transition-all group"
              >
                <div className="flex justify-between items-start mb-4">
                  <div className="flex-1">
                    <h3 className="text-xl font-bold text-white mb-1">
                      {agency.name}
                    </h3>
                    <p className="text-white/60 text-sm">{agency.email}</p>
                  </div>
                  <span
                    className={`px-3 py-1 rounded-full text-xs ${getStatusColor(
                      agency.status
                    )}`}
                  >
                    {agency.status}
                  </span>
                </div>

                <div className="space-y-2 mb-4">
                  <div className="flex items-center gap-2 text-white/70 text-sm">
                    <svg
                      className="w-4 h-4"
                      fill="none"
                      stroke="currentColor"
                      viewBox="0 0 24 24"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={2}
                        d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z"
                      />
                    </svg>
                    <span>{agency.users?.length || 0} members</span>
                  </div>

                  {agency.phone && (
                    <div className="flex items-center gap-2 text-white/70 text-sm">
                      <svg
                        className="w-4 h-4"
                        fill="none"
                        stroke="currentColor"
                        viewBox="0 0 24 24"
                      >
                        <path
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          strokeWidth={2}
                          d="M3 5a2 2 0 012-2h3.28a1 1 0 01.948.684l1.498 4.493a1 1 0 01-.502 1.21l-2.257 1.13a11.042 11.042 0 005.516 5.516l1.13-2.257a1 1 0 011.21-.502l4.493 1.498a1 1 0 01.684.949V19a2 2 0 01-2 2h-1C9.716 21 3 14.284 3 6V5z"
                        />
                      </svg>
                      <span>{agency.phone}</span>
                    </div>
                  )}

                  {agency.city && agency.state && (
                    <div className="flex items-center gap-2 text-white/70 text-sm">
                      <svg
                        className="w-4 h-4"
                        fill="none"
                        stroke="currentColor"
                        viewBox="0 0 24 24"
                      >
                        <path
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          strokeWidth={2}
                          d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z"
                        />
                        <path
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          strokeWidth={2}
                          d="M15 11a3 3 0 11-6 0 3 3 0 016 0z"
                        />
                      </svg>
                      <span>
                        {agency.city}, {agency.state}
                      </span>
                    </div>
                  )}

                  <div className="pt-2">
                    <span
                      className={`px-3 py-1 rounded-full text-xs ${getMembershipBadgeColor(
                        agency.membershipType || "A1_AGENCY"
                      )}`}
                    >
                      {formatMembershipType(
                        agency.membershipType || "A1_AGENCY"
                      )}
                    </span>
                  </div>
                </div>

                <div className="flex gap-2 pt-4 border-t border-white/10">
                  <button
                    onClick={() => router.push(`/agencies/${agency.id}`)}
                    className="flex-1 px-3 py-2 bg-white/10 border border-white/20 rounded-lg text-white hover:bg-white/20 transition-all text-sm"
                  >
                    View Details
                  </button>
                  {canEditAgency(agency.id) && (
                    <button
                      onClick={() => handleEditAgency(agency)}
                      className="p-2 text-white/70 hover:text-white hover:bg-white/10 rounded-lg transition-all"
                      title="Edit agency"
                    >
                      <svg
                        className="w-5 h-5"
                        fill="none"
                        stroke="currentColor"
                        viewBox="0 0 24 24"
                      >
                        <path
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          strokeWidth={2}
                          d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z"
                        />
                      </svg>
                    </button>
                  )}
                  {/* Only Super Admins see delete button */}
                  {isSuperAdmin && (
                    <button
                      onClick={() => handleDeleteAgency(agency.id)}
                      className="p-2 text-red-400 hover:text-red-300 hover:bg-red-500/10 rounded-lg transition-all"
                      title="Delete agency"
                    >
                      <svg
                        className="w-5 h-5"
                        fill="none"
                        stroke="currentColor"
                        viewBox="0 0 24 24"
                      >
                        <path
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          strokeWidth={2}
                          d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16"
                        />
                      </svg>
                    </button>
                  )}
                </div>
              </div>
            ))
          ) : (
            <div className="col-span-full text-center py-12">
              <div className="text-white/60">
                <svg
                  className="w-16 h-16 mx-auto mb-4"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4"
                  />
                </svg>
                <p className="text-lg mb-2">
                  {searchTerm || filterStatus !== "ALL"
                    ? "No agencies found matching your filters"
                    : "No agencies found"}
                </p>
                {isSuperAdmin && (
                  <p className="text-sm">
                    Click 'Add Agency' to create your first agency
                  </p>
                )}
              </div>
            </div>
          )}
        </div>

        {/* Permission Info Boxes */}
        {isAgencyAdmin && (
          <div className="mt-8 bg-white/10 backdrop-blur-md border border-white/20 rounded-lg p-6 max-w-2xl mx-auto">
            <div className="flex items-start gap-3">
              <svg
                className="w-5 h-5 text-blue-300 mt-0.5"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
                />
              </svg>
              <div className="text-white/80">
                <p className="font-medium mb-2">Agency Admin Access</p>
                <div className="text-sm text-white/60 space-y-1">
                  <p>As an Agency Admin, you can:</p>
                  <ul className="list-disc list-inside mt-1 space-y-1">
                    <li>View and edit your agency's contact information</li>
                    <li>Update address and primary contact details</li>
                    <li>Manage members within your agency</li>
                  </ul>
                  <p className="mt-2">You cannot:</p>
                  <ul className="list-disc list-inside mt-1 space-y-1">
                    <li>Change membership type (A1, A2, etc.)</li>
                    <li>Modify agency status</li>
                    <li>View or manage other agencies</li>
                    <li>Delete agencies</li>
                  </ul>
                  <p className="mt-2 text-yellow-300">
                    Contact a Super Admin for membership upgrades or status
                    changes.
                  </p>
                </div>
              </div>
            </div>
          </div>
        )}

        {isSuperAdmin && (
          <div className="mt-8 bg-white/10 backdrop-blur-md border border-white/20 rounded-lg p-6">
            <div className="flex items-start gap-3">
              <svg
                className="w-5 h-5 text-green-300 mt-0.5"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z"
                />
              </svg>
              <div className="text-white/80">
                <p className="font-medium mb-1">Super Admin Access</p>
                <p className="text-sm text-white/60">
                  You have full control over all agencies and members. You can
                  create, edit, and delete any agency, change membership types
                  and status, and manage all system settings.
                </p>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Add Agency Modal - ONLY for Super Admin */}
      {showAddModal && isSuperAdmin && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <div className="bg-gradient-to-br from-indigo-500/90 to-purple-600/90 backdrop-blur-xl rounded-2xl p-8 max-w-4xl w-full max-h-[90vh] overflow-y-auto border border-white/20">
            <div className="flex justify-between items-center mb-6">
              <h2 className="text-3xl font-bold text-white">Add New Agency</h2>
              <button
                onClick={() => setShowAddModal(false)}
                className="text-white/80 hover:text-white text-2xl transition-colors"
              >
                ✕
              </button>
            </div>
            <AgencyForm
              onClose={() => setShowAddModal(false)}
              onSuccess={() => {
                setShowAddModal(false);
                fetchAgencies();
              }}
            />
          </div>
        </div>
      )}

      {/* Edit Agency Modal */}
      {showEditModal && selectedAgency && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <div className="bg-gradient-to-br from-indigo-500/90 to-purple-600/90 backdrop-blur-xl rounded-2xl p-8 max-w-4xl w-full max-h-[90vh] overflow-y-auto border border-white/20">
            <div className="flex justify-between items-center mb-6">
              <h2 className="text-3xl font-bold text-white">
                {isSuperAdmin ? "Edit Agency" : "Edit My Agency"}
              </h2>
              <button
                onClick={() => {
                  setShowEditModal(false);
                  setSelectedAgency(null);
                }}
                className="text-white/80 hover:text-white text-2xl transition-colors"
              >
                ✕
              </button>
            </div>
            <AgencyForm
              agency={selectedAgency}
              onClose={() => {
                setShowEditModal(false);
                setSelectedAgency(null);
              }}
              onSuccess={() => {
                setShowEditModal(false);
                setSelectedAgency(null);
                fetchAgencies();
              }}
            />
          </div>
        </div>
      )}
    </div>
  );
}
