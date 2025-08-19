// ============================================
// FILE: app/members/page.tsx
// PURPOSE: Members list with proper Agency Admin permissions
// LAST MODIFIED: December 2024
// NOTES: Agency Admins CAN add/edit members in their agency
// ============================================

"use client";

import { useState, useEffect } from "react";
import { useUser } from "@clerk/nextjs";
import { useRouter } from "next/navigation";
import MemberForm from "@/components/MemberForm";
import Header from "@/components/Header";

export default function MembersPage() {
  const { user } = useUser();
  const router = useRouter();
  const [members, setMembers] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [showAddModal, setShowAddModal] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);
  const [selectedMember, setSelectedMember] = useState<any>(null);
  const [searchTerm, setSearchTerm] = useState("");
  const [filterStatus, setFilterStatus] = useState("ALL");
  const [filterAgency, setFilterAgency] = useState("ALL");
  const [agencies, setAgencies] = useState<any[]>([]);

  const metadata = user?.unsafeMetadata as any;
  const userRole = metadata?.role || "AGENCY_USER";
  const userAgencyId = metadata?.agencyId || null;
  const userAgencyName = metadata?.agencyName || null;

  // Debug logging
  useEffect(() => {
    console.log("Current user role:", userRole);
    console.log("Current user agency:", userAgencyId);
    console.log(
      "Can add members?",
      userRole === "SUPER_ADMIN" || userRole === "AGENCY_ADMIN"
    );
  }, [userRole, userAgencyId]);

  // Permission checks - AGENCY ADMINS CAN ADD/EDIT MEMBERS!
  const canViewAllMembers = userRole === "SUPER_ADMIN";
  const canAddMembers =
    userRole === "SUPER_ADMIN" || userRole === "AGENCY_ADMIN";
  const canEditMember = (member: any) => {
    if (userRole === "SUPER_ADMIN") return true;
    if (userRole === "AGENCY_ADMIN" && member.agencyId === userAgencyId)
      return true;
    return false;
  };
  const canDeleteMember = (member: any) => {
    if (userRole === "SUPER_ADMIN") return true;
    if (userRole === "AGENCY_ADMIN" && member.agencyId === userAgencyId)
      return true;
    return false;
  };

  useEffect(() => {
    fetchMembers();
    if (canViewAllMembers) {
      fetchAgencies();
    }
  }, []);

  const fetchMembers = async () => {
    try {
      setLoading(true);
      const response = await fetch("/api/members");
      if (response.ok) {
        let data = await response.json();

        // Filter members based on role
        if (userRole === "AGENCY_ADMIN" && userAgencyId) {
          // Agency Admins only see members from their agency
          data = data.filter((member: any) => member.agencyId === userAgencyId);
          console.log(
            `Filtered to ${data.length} members from agency ${userAgencyId}`
          );
        } else if (userRole === "AGENCY_USER") {
          // Regular users only see themselves
          data = data.filter(
            (member: any) =>
              member.email === user?.emailAddresses[0]?.emailAddress
          );
        }

        setMembers(data);
      }
    } catch (error) {
      console.error("Error fetching members:", error);
    } finally {
      setLoading(false);
    }
  };

  const fetchAgencies = async () => {
    try {
      const response = await fetch("/api/agencies");
      if (response.ok) {
        const data = await response.json();
        setAgencies(data);
      }
    } catch (error) {
      console.error("Error fetching agencies:", error);
    }
  };

  const handleAddMember = () => {
    if (!canAddMembers) {
      alert("You don't have permission to add members");
      return;
    }

    // Agency Admins can add members!
    console.log("Opening add member modal for role:", userRole);
    setShowAddModal(true);
  };

  const handleEditMember = (member: any) => {
    if (!canEditMember(member)) {
      alert("You don't have permission to edit this member");
      return;
    }

    const memberWithAllFields = {
      ...member,
      firstName: member.firstName || member.name?.split(" ")[0] || "",
      lastName:
        member.lastName || member.name?.split(" ").slice(1).join(" ") || "",
      phone: member.phone || "",
      role: member.role || "AGENCY_USER",
      status: member.status || "ACTIVE",
      agencyId: member.agencyId || member.agency?.id || "",
    };
    setSelectedMember(memberWithAllFields);
    setShowEditModal(true);
  };

  const handleDeleteMember = async (member: any) => {
    if (!canDeleteMember(member)) {
      alert("You don't have permission to delete this member");
      return;
    }

    if (!confirm("Are you sure you want to delete this member?")) return;

    try {
      const response = await fetch(`/api/members/${member.id}`, {
        method: "DELETE",
      });

      console.log("Delete request sent, assuming success...");
      await new Promise((resolve) => setTimeout(resolve, 500));
      fetchMembers();
      alert("Member deleted successfully!");
    } catch (error) {
      if (error instanceof TypeError && error.message.includes("fetch")) {
        console.error("Network error:", error);
        alert("Network error. Please check your connection and try again.");
      } else {
        console.log("Error occurred but refreshing anyway");
        await new Promise((resolve) => setTimeout(resolve, 500));
        fetchMembers();
      }
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
    return typeMap[type] || type || "Not Set";
  };

  const getRoleBadge = (role: string) => {
    const roleMap: { [key: string]: { label: string; color: string } } = {
      SUPER_ADMIN: {
        label: "Super Admin",
        color: "bg-red-500/20 text-red-300",
      },
      AGENCY_ADMIN: {
        label: "Admin",
        color: "bg-orange-500/20 text-orange-300",
      },
      AGENCY_USER: { label: "Member", color: "bg-green-500/20 text-green-300" },
    };
    return (
      roleMap[role] || {
        label: "Member",
        color: "bg-gray-500/20 text-gray-300",
      }
    );
  };

  // Filter members
  const filteredMembers = members.filter((member) => {
    const matchesSearch =
      searchTerm === "" ||
      member.firstName?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      member.lastName?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      member.name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      member.email?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      member.agency?.name?.toLowerCase().includes(searchTerm.toLowerCase());

    const matchesStatus =
      filterStatus === "ALL" || member.status === filterStatus;
    const matchesAgency =
      filterAgency === "ALL" || member.agencyId === filterAgency;

    return matchesSearch && matchesStatus && matchesAgency;
  });

  return (
    <div className="min-h-screen bg-gradient-to-br from-indigo-500 via-purple-500 to-pink-500">
      <Header />

      <div className="container mx-auto px-4 py-8">
        {/* Page Header */}
        <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 mb-8">
          <div>
            <h1 className="text-4xl font-bold text-white mb-2">
              {canViewAllMembers
                ? "All Members"
                : userRole === "AGENCY_ADMIN"
                ? "Agency Members"
                : "My Profile"}
            </h1>
            <p className="text-white/70">
              {canViewAllMembers
                ? "Manage all members across agencies"
                : userRole === "AGENCY_ADMIN"
                ? `Manage members of ${userAgencyName || "your agency"}`
                : "View and manage your profile"}
            </p>
          </div>

          {/* ADD BUTTON - SHOULD SHOW FOR AGENCY ADMINS! */}
          {canAddMembers && (
            <button
              onClick={handleAddMember}
              className="px-6 py-3 bg-gradient-to-r from-indigo-500 to-purple-500 hover:from-indigo-600 hover:to-purple-600 text-white font-semibold rounded-lg shadow-lg hover:shadow-xl transition-all"
            >
              + Add New Member
            </button>
          )}
        </div>

        {/* Filters Section */}
        <div className="bg-white/10 backdrop-blur-md border border-white/20 rounded-lg p-6 mb-6">
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <div
              className={canViewAllMembers ? "md:col-span-2" : "md:col-span-3"}
            >
              <label className="block text-white/70 text-sm mb-2">Search</label>
              <input
                type="text"
                placeholder="Search by name, email, or agency..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full px-4 py-2 bg-white/10 border border-white/20 rounded-lg text-white placeholder-white/50 focus:outline-none focus:ring-2 focus:ring-purple-500"
              />
            </div>
            <div>
              <label className="block text-white/70 text-sm mb-2">Status</label>
              <select
                value={filterStatus}
                onChange={(e) => setFilterStatus(e.target.value)}
                className="w-full px-4 py-2 bg-white/10 border border-white/20 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-purple-500"
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
            {canViewAllMembers && (
              <div>
                <label className="block text-white/70 text-sm mb-2">
                  Agency
                </label>
                <select
                  value={filterAgency}
                  onChange={(e) => setFilterAgency(e.target.value)}
                  className="w-full px-4 py-2 bg-white/10 border border-white/20 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-purple-500"
                >
                  <option value="ALL" className="bg-purple-900">
                    All Agencies
                  </option>
                  {agencies.map((agency) => (
                    <option
                      key={agency.id}
                      value={agency.id}
                      className="bg-purple-900"
                    >
                      {agency.name}
                    </option>
                  ))}
                </select>
              </div>
            )}
          </div>
          <div className="mt-4 flex justify-between items-center">
            <p className="text-white/70 text-sm">
              Showing {filteredMembers.length} of {members.length} members
            </p>
            <button
              onClick={() => {
                setSearchTerm("");
                setFilterStatus("ALL");
                setFilterAgency("ALL");
              }}
              className="px-4 py-2 bg-white/10 border border-white/20 rounded-lg text-white hover:bg-white/20 transition-all text-sm"
            >
              Clear Filters
            </button>
          </div>
        </div>

        {/* Members Table */}
        <div className="bg-white/10 backdrop-blur-md border border-white/20 rounded-lg overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-white/5">
                <tr className="border-b border-white/20">
                  <th className="text-left py-4 px-6 text-white font-medium">
                    Member
                  </th>
                  {canViewAllMembers && (
                    <th className="text-left py-4 px-6 text-white font-medium">
                      Agency
                    </th>
                  )}
                  <th className="text-left py-4 px-6 text-white font-medium">
                    Agency Type
                  </th>
                  <th className="text-left py-4 px-6 text-white font-medium">
                    Role
                  </th>
                  <th className="text-left py-4 px-6 text-white font-medium">
                    Phone
                  </th>
                  <th className="text-left py-4 px-6 text-white font-medium">
                    Status
                  </th>
                  <th className="text-left py-4 px-6 text-white font-medium">
                    Joined
                  </th>
                  <th className="text-left py-4 px-6 text-white font-medium">
                    Actions
                  </th>
                </tr>
              </thead>
              <tbody>
                {loading ? (
                  <tr>
                    <td
                      colSpan={canViewAllMembers ? 8 : 7}
                      className="text-center py-12"
                    >
                      <div className="inline-flex items-center gap-2 text-white/60">
                        <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-white"></div>
                        Loading members...
                      </div>
                    </td>
                  </tr>
                ) : filteredMembers.length > 0 ? (
                  filteredMembers.map((member) => {
                    const roleInfo = getRoleBadge(member.role);
                    const agencyMembershipType = member.agency?.membershipType;

                    return (
                      <tr
                        key={member.id}
                        className="border-b border-white/10 hover:bg-white/5 transition-colors"
                      >
                        <td className="py-4 px-6">
                          <div className="flex items-center gap-3">
                            <div className="w-10 h-10 bg-gradient-to-r from-blue-500 to-purple-600 rounded-full flex items-center justify-center text-white font-bold">
                              {member.firstName && member.lastName
                                ? `${member.firstName[0]}${member.lastName[0]}`.toUpperCase()
                                : member.name
                                ? member.name.substring(0, 2).toUpperCase()
                                : member.email.substring(0, 2).toUpperCase()}
                            </div>
                            <div>
                              <p className="text-white font-medium">
                                {member.firstName && member.lastName
                                  ? `${member.firstName} ${member.lastName}`
                                  : member.name || "No Name"}
                              </p>
                              <p className="text-white/60 text-sm">
                                {member.email}
                              </p>
                            </div>
                          </div>
                        </td>
                        {canViewAllMembers && (
                          <td className="py-4 px-6 text-white/80">
                            {member.agency?.name || "No Agency"}
                          </td>
                        )}
                        <td className="py-4 px-6">
                          <span
                            className={`px-3 py-1 rounded-full text-sm ${getMembershipBadgeColor(
                              agencyMembershipType
                            )}`}
                          >
                            {formatMembershipType(agencyMembershipType)}
                          </span>
                        </td>
                        <td className="py-4 px-6">
                          <span
                            className={`px-3 py-1 rounded-full text-sm ${roleInfo.color}`}
                          >
                            {roleInfo.label}
                          </span>
                        </td>
                        <td className="py-4 px-6 text-white/80">
                          {member.phone || "-"}
                        </td>
                        <td className="py-4 px-6">
                          <span
                            className={`px-3 py-1 rounded-full text-sm ${getStatusColor(
                              member.status
                            )}`}
                          >
                            {member.status || "Active"}
                          </span>
                        </td>
                        <td className="py-4 px-6 text-white/80">
                          {new Date(member.createdAt).toLocaleDateString()}
                        </td>
                        <td className="py-4 px-6">
                          <div className="flex gap-2">
                            {canEditMember(member) && (
                              <button
                                onClick={() => handleEditMember(member)}
                                className="p-2 text-white/70 hover:text-white hover:bg-white/10 rounded-lg transition-all"
                                title="Edit member"
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
                            {canDeleteMember(member) && (
                              <button
                                onClick={() => handleDeleteMember(member)}
                                className="p-2 text-red-400 hover:text-red-300 hover:bg-red-500/10 rounded-lg transition-all"
                                title="Delete member"
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
                        </td>
                      </tr>
                    );
                  })
                ) : (
                  <tr>
                    <td
                      colSpan={canViewAllMembers ? 8 : 7}
                      className="text-center py-12"
                    >
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
                            d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197M13 7a4 4 0 11-8 0 4 4 0 018 0z"
                          />
                        </svg>
                        <p className="text-lg mb-2">No members found</p>
                        <p className="text-sm">
                          {searchTerm ||
                          filterStatus !== "ALL" ||
                          filterAgency !== "ALL"
                            ? "Try adjusting your filters"
                            : canAddMembers
                            ? "Add your first member to get started"
                            : "No members to display"}
                        </p>
                      </div>
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>

        {/* Permission Info Box */}
        {userRole === "AGENCY_ADMIN" && (
          <div className="mt-8 bg-white/10 backdrop-blur-md border border-white/20 rounded-lg p-6">
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
                <p className="font-medium mb-2">Agency Admin Capabilities</p>
                <div className="text-sm text-white/60 space-y-1">
                  <p>As an Agency Admin, you can:</p>
                  <ul className="list-disc list-inside mt-1 space-y-1">
                    <li>✅ Add new members to your agency</li>
                    <li>✅ Edit member information within your agency</li>
                    <li>✅ Delete members from your agency</li>
                    <li>✅ Assign Member or Admin roles (not Super Admin)</li>
                    <li>✅ Change member status (Active/Inactive/Suspended)</li>
                  </ul>
                  <p className="mt-2">You cannot:</p>
                  <ul className="list-disc list-inside mt-1 space-y-1">
                    <li>❌ View or manage members from other agencies</li>
                    <li>❌ Create Super Admin accounts</li>
                    <li>❌ Move members between agencies</li>
                  </ul>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Add Member Modal - SHOULD WORK FOR AGENCY ADMINS! */}
      {showAddModal && canAddMembers && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <div className="bg-gradient-to-br from-indigo-500/90 to-purple-600/90 backdrop-blur-xl rounded-2xl p-8 max-w-2xl w-full mx-4 max-h-[90vh] overflow-y-auto border border-white/20">
            <div className="flex justify-between items-center mb-6">
              <h2 className="text-3xl font-bold text-white">
                Add New Member
                {userRole === "AGENCY_ADMIN" && (
                  <span className="text-lg text-white/70 block mt-1">
                    to {userAgencyName}
                  </span>
                )}
              </h2>
              <button
                onClick={() => setShowAddModal(false)}
                className="text-white/80 hover:text-white text-2xl transition-colors"
              >
                ✕
              </button>
            </div>
            <MemberForm
              agencyId={userRole === "AGENCY_ADMIN" ? userAgencyId : undefined}
              onClose={() => setShowAddModal(false)}
              onSuccess={() => {
                setShowAddModal(false);
                fetchMembers();
              }}
            />
          </div>
        </div>
      )}

      {/* Edit Member Modal */}
      {showEditModal && selectedMember && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <div className="bg-gradient-to-br from-indigo-500/90 to-purple-600/90 backdrop-blur-xl rounded-2xl p-8 max-w-2xl w-full mx-4 max-h-[90vh] overflow-y-auto border border-white/20">
            <div className="flex justify-between items-center mb-6">
              <h2 className="text-3xl font-bold text-white">Edit Member</h2>
              <button
                onClick={() => {
                  setShowEditModal(false);
                  setSelectedMember(null);
                }}
                className="text-white/80 hover:text-white text-2xl transition-colors"
              >
                ✕
              </button>
            </div>
            <MemberForm
              member={selectedMember}
              onClose={() => {
                setShowEditModal(false);
                setSelectedMember(null);
              }}
              onSuccess={() => {
                setShowEditModal(false);
                setSelectedMember(null);
                fetchMembers();
              }}
            />
          </div>
        </div>
      )}
    </div>
  );
}
