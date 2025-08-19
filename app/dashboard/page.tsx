"use client";

import { useState, useEffect } from "react";
import { useUser, UserButton } from "@clerk/nextjs";
import { useRouter } from "next/navigation";
import MemberForm from "@/components/MemberForm";

export default function Dashboard() {
  const { user, isLoaded } = useUser();
  const router = useRouter();
  const [showAddModal, setShowAddModal] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);
  const [selectedMember, setSelectedMember] = useState<any>(null);
  const [members, setMembers] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  // Get user role from metadata
  const metadata = user?.unsafeMetadata as any;
  const userRole = (metadata?.role as string) || "SUPER_ADMIN"; // Default to SUPER_ADMIN for you
  const agencyName = (metadata?.agencyName as string) || "MemberHub Pro HQ";

  const stats = [
    {
      title: "Total Members",
      value: members.length.toString(),
      change: "+12.5%",
      color: "from-blue-500 to-indigo-600",
      icon: "👥",
    },
    {
      title: "Active Agencies",
      value: "12",
      change: "+8.3%",
      color: "from-purple-500 to-pink-600",
      icon: "🏢",
    },
    {
      title: "Upcoming Events",
      value: "5",
      change: "+2",
      color: "from-green-500 to-teal-600",
      icon: "📅",
    },
    {
      title: "Monthly Revenue",
      value: "$28.4K",
      change: "+18.2%",
      color: "from-orange-500 to-red-600",
      icon: "💰",
    },
  ];

  useEffect(() => {
    fetchMembers();
  }, []);

  const fetchMembers = async () => {
    try {
      setLoading(true);
      const response = await fetch("/api/members?limit=10");
      if (response.ok) {
        const data = await response.json();
        setMembers(data);
      }
    } catch (error) {
      console.error("Error fetching members:", error);
    } finally {
      setLoading(false);
    }
  };

  const handleEditMember = (member: any) => {
    setSelectedMember(member);
    setShowEditModal(true);
  };

  const handleDeleteMember = async (memberId: string) => {
    if (!confirm("Are you sure you want to delete this member?")) return;

    try {
      const response = await fetch(`/api/members/${memberId}`, {
        method: "DELETE",
      });

      if (response.ok) {
        // Refresh the members list
        fetchMembers();
        // Show success message (you can replace with a toast notification)
        alert("Member deleted successfully!");
      } else {
        alert("Failed to delete member. Please try again.");
      }
    } catch (error) {
      console.error("Error deleting member:", error);
      alert("An error occurred while deleting the member.");
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

  const getRoleBadge = () => {
    const badges: {
      [key: string]: { color: string; icon: string; label: string };
    } = {
      SUPER_ADMIN: {
        color: "from-red-500 to-pink-600",
        icon: "👑",
        label: "Super Admin",
      },
      AGENCY_ADMIN: {
        color: "from-blue-500 to-purple-600",
        icon: "🏢",
        label: "Agency Admin",
      },
      AGENCY_USER: {
        color: "from-green-500 to-teal-600",
        icon: "👤",
        label: "Member",
      },
    };
    return badges[userRole] || badges["SUPER_ADMIN"];
  };

  const roleBadge = getRoleBadge();

  const sidebarItems = [
    { icon: "📊", label: "Dashboard", active: true, href: "/dashboard" },
    { icon: "👥", label: "Members", href: "/members" },
    { icon: "🏢", label: "Agencies", href: "/agencies" },
    { icon: "📅", label: "Events", href: "/events" },
    { icon: "🎓", label: "Education", href: "/education" },
    { icon: "💰", label: "Billing", href: "/billing" },
    { icon: "📧", label: "Communications", href: "/communications" },
    { icon: "📁", label: "Documents", href: "/documents" },
    { icon: "📈", label: "Reports", href: "/reports" },
    { icon: "⚙️", label: "Settings", href: "/settings" },
  ];

  if (!isLoaded) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-indigo-500 via-purple-500 to-pink-500 flex items-center justify-center">
        <div className="text-white text-xl">Loading dashboard...</div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-indigo-500 via-purple-500 to-pink-500">
      {/* Navigation */}
      <nav className="bg-white/10 backdrop-blur-md border-b border-white/20 sticky top-0 z-40">
        <div className="px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16">
            <div className="flex items-center gap-4">
              <span className="text-2xl font-bold text-white">
                ⚡ MemberHub Pro
              </span>
              <div
                className={`px-3 py-1 bg-gradient-to-r ${roleBadge.color} rounded-full flex items-center gap-2`}
              >
                <span>{roleBadge.icon}</span>
                <span className="text-white text-sm font-medium">
                  {roleBadge.label}
                </span>
              </div>
            </div>
            <div className="flex items-center gap-4">
              <div className="text-white/80">
                <span className="text-sm">Welcome, </span>
                <span className="font-medium">
                  {user?.firstName || "Admin"}
                </span>
              </div>
              <UserButton
                afterSignOutUrl="/"
                appearance={{
                  elements: {
                    avatarBox: "w-10 h-10",
                  },
                }}
              />
            </div>
          </div>
        </div>
      </nav>

      <div className="flex">
        {/* Sidebar */}
        <aside className="w-64 bg-white/10 backdrop-blur-md min-h-screen p-4">
          <div className="mb-6 p-4 bg-white/10 rounded-lg">
            <p className="text-white/70 text-sm">Organization</p>
            <p className="text-white font-semibold">{agencyName}</p>
          </div>
          <ul className="space-y-2">
            {sidebarItems.map((item) => (
              <li key={item.label}>
                <a
                  href={item.href || "#"}
                  onClick={(e) => {
                    if (item.href && item.href !== "#") {
                      e.preventDefault();
                      router.push(item.href);
                    }
                  }}
                  className={`flex items-center gap-3 px-4 py-3 rounded-lg transition-all ${
                    item.active
                      ? "bg-white/20 text-white shadow-lg"
                      : "text-white/80 hover:bg-white/10 hover:text-white"
                  }`}
                >
                  <span>{item.icon}</span>
                  <span>{item.label}</span>
                </a>
              </li>
            ))}
          </ul>
        </aside>

        {/* Main Content */}
        <main className="flex-1 p-8">
          <h1 className="text-3xl font-bold text-white mb-8">
            Dashboard Overview
          </h1>

          {/* Stats Grid */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
            {stats.map((stat) => (
              <div
                key={stat.title}
                className="bg-white/10 backdrop-blur-md rounded-xl p-6 border border-white/20 hover:bg-white/15 transition-all cursor-pointer group"
              >
                <div className="flex items-center justify-between mb-4">
                  <div
                    className={`p-3 rounded-lg bg-gradient-to-r ${stat.color} group-hover:scale-110 transition-transform`}
                  >
                    <span className="text-white text-2xl">{stat.icon}</span>
                  </div>
                  <span
                    className={`text-sm font-semibold ${
                      stat.change.startsWith("+")
                        ? "text-green-400"
                        : "text-red-400"
                    }`}
                  >
                    {stat.change}
                  </span>
                </div>
                <h3 className="text-3xl font-bold text-white mb-1">
                  {stat.value}
                </h3>
                <p className="text-white/70">{stat.title}</p>
              </div>
            ))}
          </div>

          {/* Recent Members Table */}
          <div className="bg-white/10 backdrop-blur-md rounded-xl p-6 border border-white/20">
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-2xl font-bold text-white">
                Members ({members.length})
              </h2>
              <button
                onClick={() => setShowAddModal(true)}
                className="px-4 py-2 bg-gradient-to-r from-blue-500 to-purple-600 text-white rounded-lg hover:shadow-lg transition-all"
              >
                + Add Member
              </button>
            </div>

            {/* Table */}
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="border-b border-white/20">
                    <th className="text-left py-3 px-4 text-white/80">
                      Member
                    </th>
                    <th className="text-left py-3 px-4 text-white/80">
                      Agency
                    </th>
                    <th className="text-left py-3 px-4 text-white/80">Type</th>
                    <th className="text-left py-3 px-4 text-white/80">
                      Join Date
                    </th>
                    <th className="text-left py-3 px-4 text-white/80">
                      Status
                    </th>
                    <th className="text-left py-3 px-4 text-white/80">
                      Actions
                    </th>
                  </tr>
                </thead>
                <tbody>
                  {loading ? (
                    <tr>
                      <td
                        colSpan={6}
                        className="text-center py-8 text-white/60"
                      >
                        Loading members...
                      </td>
                    </tr>
                  ) : members.length > 0 ? (
                    members.map((member: any) => (
                      <tr
                        key={member.id}
                        className="border-b border-white/10 hover:bg-white/5 transition-colors"
                      >
                        <td className="py-4 px-4">
                          <div className="flex items-center gap-3">
                            <div className="w-10 h-10 bg-gradient-to-r from-blue-500 to-purple-600 rounded-full flex items-center justify-center text-white font-bold">
                              {member.firstName && member.lastName
                                ? `${member.firstName[0]}${member.lastName[0]}`.toUpperCase()
                                : member.name
                                ? member.name.substring(0, 2).toUpperCase()
                                : member.email.substring(0, 2).toUpperCase()}
                            </div>
                            <div>
                              <p className="text-white font-semibold">
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
                        <td className="py-4 px-4 text-white/80">
                          {member.agency?.name || "No Agency"}
                        </td>
                        <td className="py-4 px-4">
                          <span className="px-3 py-1 bg-purple-500/20 text-purple-300 rounded-full text-sm">
                            {member.membershipType
                              ? formatMembershipType(member.membershipType)
                              : "N/A"}
                          </span>
                        </td>
                        <td className="py-4 px-4 text-white/80">
                          {new Date(member.createdAt).toLocaleDateString()}
                        </td>
                        <td className="py-4 px-4">
                          <span
                            className={`px-3 py-1 rounded-full text-sm ${
                              member.status === "ACTIVE"
                                ? "bg-green-500/20 text-green-300"
                                : member.status === "INACTIVE"
                                ? "bg-gray-500/20 text-gray-300"
                                : "bg-red-500/20 text-red-300"
                            }`}
                          >
                            {member.status || "Active"}
                          </span>
                        </td>
                        <td className="py-4 px-4">
                          <div className="flex gap-2">
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
                            {(userRole === "SUPER_ADMIN" ||
                              userRole === "AGENCY_ADMIN") && (
                              <button
                                onClick={() => handleDeleteMember(member.id)}
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
                    ))
                  ) : (
                    <tr>
                      <td
                        colSpan={6}
                        className="text-center py-12 text-white/60"
                      >
                        <p className="text-lg mb-2">No members yet!</p>
                        <p>Click "Add Member" to get started.</p>
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </div>

          {/* Quick Actions */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mt-8">
            {[
              {
                icon: "📊",
                title: "Generate Report",
                desc: "Create custom reports",
              },
              {
                icon: "📧",
                title: "Send Campaign",
                desc: "Email your members",
              },
              {
                icon: "📅",
                title: "Schedule Event",
                desc: "Plan your next event",
              },
              { icon: "📂", title: "Import Data", desc: "Bulk import records" },
            ].map((action) => (
              <div
                key={action.title}
                className="bg-white/10 backdrop-blur-md rounded-xl p-6 border border-white/20 hover:bg-white/15 transition-all cursor-pointer hover:scale-105"
              >
                <span className="text-3xl mb-4 block">{action.icon}</span>
                <h3 className="text-white font-semibold mb-2">
                  {action.title}
                </h3>
                <p className="text-white/60 text-sm">{action.desc}</p>
              </div>
            ))}
          </div>
        </main>
      </div>

      {/* Add Member Modal */}
      {showAddModal && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <div className="bg-gradient-to-br from-indigo-500/90 to-purple-600/90 backdrop-blur-xl rounded-2xl p-8 max-w-2xl w-full mx-4 max-h-[90vh] overflow-y-auto border border-white/20">
            <div className="flex justify-between items-center mb-6">
              <h2 className="text-3xl font-bold text-white">Add New Member</h2>
              <button
                onClick={() => setShowAddModal(false)}
                className="text-white/80 hover:text-white text-2xl transition-colors"
              >
                ✕
              </button>
            </div>

            <MemberForm
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
