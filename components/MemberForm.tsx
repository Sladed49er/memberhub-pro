// ============================================
// FILE: components/MemberForm.tsx
// PURPOSE: DEBUG VERSION - Shows role information
// This will help us see what role the system thinks you have
// ============================================

"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { useUser } from "@clerk/nextjs";

interface MemberFormProps {
  member?: any;
  agencyId?: string;
  onClose?: () => void;
  onSuccess?: () => void;
}

export default function MemberForm({
  member,
  agencyId,
  onClose,
  onSuccess,
}: MemberFormProps) {
  const router = useRouter();
  const { user } = useUser();
  const isEditMode = !!member;

  // Get current user's role and agency
  const metadata = user?.unsafeMetadata as any;
  const currentUserRole = metadata?.role || "NOT_SET";
  const currentUserAgencyId = metadata?.agencyId || null;
  const currentUserAgencyName = metadata?.agencyName || null;

  // DEBUG: Log the role information
  useEffect(() => {
    console.log("=== MEMBERFORM DEBUG INFO ===");
    console.log("User:", user?.emailAddresses[0]?.emailAddress);
    console.log("Metadata:", metadata);
    console.log("Current Role:", currentUserRole);
    console.log("Agency ID:", currentUserAgencyId);
    console.log("Agency Name:", currentUserAgencyName);
    console.log(
      "Can manage members?",
      currentUserRole === "SUPER_ADMIN" || currentUserRole === "AGENCY_ADMIN"
    );
    console.log("============================");
  }, [user, metadata]);

  // Initialize form
  const [formData, setFormData] = useState({
    firstName: member?.firstName || "",
    lastName: member?.lastName || "",
    email: member?.email || "",
    phone: member?.phone || "",
    role: member?.role || "AGENCY_USER",
    agencyId:
      member?.agencyId ||
      member?.agency?.id ||
      agencyId ||
      currentUserAgencyId ||
      "",
    status: member?.status || "ACTIVE",
  });

  const [agencies, setAgencies] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [debugInfo, setDebugInfo] = useState("");

  // Define what roles current user can assign
  const getAvailableRoles = () => {
    const allRoles = [
      { value: "AGENCY_USER", label: "Member", level: 1 },
      { value: "AGENCY_ADMIN", label: "Agency Admin", level: 2 },
      { value: "SUPER_ADMIN", label: "Super Admin", level: 3 },
    ];

    if (currentUserRole === "SUPER_ADMIN") {
      return allRoles;
    }

    if (currentUserRole === "AGENCY_ADMIN") {
      return allRoles.filter((role) => role.value !== "SUPER_ADMIN");
    }

    return [];
  };

  const statusOptions = [
    { value: "ACTIVE", label: "Active" },
    { value: "INACTIVE", label: "Inactive" },
    { value: "SUSPENDED", label: "Suspended" },
  ];

  useEffect(() => {
    // Check permissions
    const canManage =
      currentUserRole === "SUPER_ADMIN" || currentUserRole === "AGENCY_ADMIN";

    setDebugInfo(`Role: ${currentUserRole}, Can Manage: ${canManage}`);

    // ONLY block if user is AGENCY_USER or role is not set
    if (!canManage) {
      setError(
        `You don't have permission to manage members. Your role: ${currentUserRole}`
      );
      // Don't redirect immediately, let them see the error
      return;
    }

    // For Agency Admins, set their agency
    if (currentUserRole === "AGENCY_ADMIN" && currentUserAgencyId) {
      setAgencies([
        {
          id: currentUserAgencyId,
          name: currentUserAgencyName || "Your Agency",
          membershipType: "A1_AGENCY",
        },
      ]);

      setFormData((prev) => ({
        ...prev,
        agencyId: currentUserAgencyId,
      }));
    }

    fetchAgencies();
  }, [currentUserRole, currentUserAgencyId]);

  const fetchAgencies = async () => {
    try {
      const response = await fetch("/api/agencies");
      if (response.ok) {
        let data = await response.json();

        if (currentUserRole === "AGENCY_ADMIN" && currentUserAgencyId) {
          data = data.filter((a: any) => a.id === currentUserAgencyId);
          if (data.length === 0) {
            data = [
              {
                id: currentUserAgencyId,
                name: currentUserAgencyName || "Your Agency",
                membershipType: "A1_AGENCY",
              },
            ];
          }
        }

        setAgencies(data);
      }
    } catch (error) {
      console.error("Error fetching agencies:", error);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError("");

    // Final permission check
    if (
      currentUserRole !== "SUPER_ADMIN" &&
      currentUserRole !== "AGENCY_ADMIN"
    ) {
      setError(
        `Cannot submit: Your role (${currentUserRole}) doesn't have permission`
      );
      setLoading(false);
      return;
    }

    try {
      const dataToSend = {
        firstName: formData.firstName.trim(),
        lastName: formData.lastName.trim(),
        email: formData.email.trim().toLowerCase(),
        phone: formData.phone?.trim() || null,
        role: formData.role,
        status: formData.status,
        agencyId: formData.agencyId || null,
        name: `${formData.firstName.trim()} ${formData.lastName.trim()}`.trim(),
      };

      const url = isEditMode ? `/api/members/${member.id}` : "/api/members";
      const method = isEditMode ? "PUT" : "POST";

      console.log(`${method} to ${url} with data:`, dataToSend);

      const response = await fetch(url, {
        method,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(dataToSend),
      });

      let errorMessage = null;
      try {
        const text = await response.text();
        if (text) {
          const responseData = JSON.parse(text);
          if (responseData.error) {
            errorMessage = responseData.error;
          }
        }
      } catch (parseError) {
        console.log("Could not parse response");
      }

      if (errorMessage) {
        setError(errorMessage);
        setLoading(false);
        return;
      }

      console.log(`Member ${isEditMode ? "updated" : "created"} successfully`);
      await new Promise((resolve) => setTimeout(resolve, 500));

      if (onSuccess) onSuccess();
      if (onClose) onClose();
      else router.refresh();
    } catch (err) {
      console.error("Form submission error:", err);
      setError("An error occurred. Please try again.");
      setLoading(false);
    }
  };

  const handleChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>
  ) => {
    const { name, value } = e.target;
    setFormData((prev) => ({
      ...prev,
      [name]: value,
    }));
  };

  const availableRoles = getAvailableRoles();

  // Show debug info at the top
  return (
    <div className="space-y-6">
      {/* DEBUG INFO BOX */}
      <div className="bg-yellow-500/20 border border-yellow-500/40 rounded-lg p-4">
        <h3 className="text-yellow-300 font-bold mb-2">DEBUG INFO:</h3>
        <div className="text-yellow-200 text-sm space-y-1">
          <p>
            Your Role: <span className="font-bold">{currentUserRole}</span>
          </p>
          <p>Agency ID: {currentUserAgencyId || "NOT SET"}</p>
          <p>Agency Name: {currentUserAgencyName || "NOT SET"}</p>
          <p>
            Can Manage:{" "}
            {currentUserRole === "SUPER_ADMIN" ||
            currentUserRole === "AGENCY_ADMIN"
              ? "YES"
              : "NO"}
          </p>
          <p>{debugInfo}</p>
        </div>
      </div>

      {/* Error Message */}
      {error && (
        <div className="bg-red-500/10 backdrop-blur-md border border-red-500/20 text-red-300 px-4 py-3 rounded-lg">
          <div className="flex items-start gap-2">
            <span>❌</span>
            <span>{error}</span>
          </div>
        </div>
      )}

      {/* Only show form if user has permission */}
      {currentUserRole === "SUPER_ADMIN" ||
      currentUserRole === "AGENCY_ADMIN" ? (
        <form onSubmit={handleSubmit} className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {/* First Name */}
            <div>
              <label className="block text-sm font-medium text-white/90 mb-2">
                First Name *
              </label>
              <input
                type="text"
                name="firstName"
                required
                value={formData.firstName}
                onChange={handleChange}
                className="w-full px-4 py-3 bg-white/10 backdrop-blur-md border border-white/20 rounded-lg text-white placeholder-white/50 focus:outline-none focus:ring-2 focus:ring-purple-500"
                placeholder="John"
              />
            </div>

            {/* Last Name */}
            <div>
              <label className="block text-sm font-medium text-white/90 mb-2">
                Last Name *
              </label>
              <input
                type="text"
                name="lastName"
                required
                value={formData.lastName}
                onChange={handleChange}
                className="w-full px-4 py-3 bg-white/10 backdrop-blur-md border border-white/20 rounded-lg text-white placeholder-white/50 focus:outline-none focus:ring-2 focus:ring-purple-500"
                placeholder="Doe"
              />
            </div>

            {/* Email */}
            <div>
              <label className="block text-sm font-medium text-white/90 mb-2">
                Email *
              </label>
              <input
                type="email"
                name="email"
                required
                value={formData.email}
                onChange={handleChange}
                disabled={isEditMode}
                className="w-full px-4 py-3 bg-white/10 backdrop-blur-md border border-white/20 rounded-lg text-white placeholder-white/50 focus:outline-none focus:ring-2 focus:ring-purple-500 disabled:opacity-50"
                placeholder="john.doe@example.com"
              />
            </div>

            {/* Phone */}
            <div>
              <label className="block text-sm font-medium text-white/90 mb-2">
                Phone
              </label>
              <input
                type="tel"
                name="phone"
                value={formData.phone}
                onChange={handleChange}
                className="w-full px-4 py-3 bg-white/10 backdrop-blur-md border border-white/20 rounded-lg text-white placeholder-white/50 focus:outline-none focus:ring-2 focus:ring-purple-500"
                placeholder="+1 (555) 123-4567"
              />
            </div>

            {/* Agency */}
            {currentUserRole === "SUPER_ADMIN" ? (
              <div>
                <label className="block text-sm font-medium text-white/90 mb-2">
                  Agency
                </label>
                <select
                  name="agencyId"
                  value={formData.agencyId}
                  onChange={handleChange}
                  className="w-full px-4 py-3 bg-white/10 backdrop-blur-md border border-white/20 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-purple-500 cursor-pointer"
                >
                  <option value="" className="bg-purple-900">
                    No Agency
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
            ) : (
              <div>
                <label className="block text-sm font-medium text-white/90 mb-2">
                  Agency{" "}
                  <span className="text-white/50 text-xs">(Auto-assigned)</span>
                </label>
                <div className="px-4 py-3 bg-white/5 border border-white/10 rounded-lg text-white/70">
                  {currentUserAgencyName || "Your Agency"}
                </div>
              </div>
            )}

            {/* User Role */}
            <div>
              <label className="block text-sm font-medium text-white/90 mb-2">
                User Role
              </label>
              <select
                name="role"
                value={formData.role}
                onChange={handleChange}
                className="w-full px-4 py-3 bg-white/10 backdrop-blur-md border border-white/20 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-purple-500 cursor-pointer"
              >
                {availableRoles.map((role) => (
                  <option
                    key={role.value}
                    value={role.value}
                    className="bg-purple-900"
                  >
                    {role.label}
                  </option>
                ))}
              </select>
            </div>

            {/* Status */}
            <div>
              <label className="block text-sm font-medium text-white/90 mb-2">
                Status
              </label>
              <select
                name="status"
                value={formData.status}
                onChange={handleChange}
                className="w-full px-4 py-3 bg-white/10 backdrop-blur-md border border-white/20 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-purple-500 cursor-pointer"
              >
                {statusOptions.map((option) => (
                  <option
                    key={option.value}
                    value={option.value}
                    className="bg-purple-900"
                  >
                    {option.label}
                  </option>
                ))}
              </select>
            </div>
          </div>

          {/* Action Buttons */}
          <div className="flex gap-4 justify-end pt-4">
            {onClose && (
              <button
                type="button"
                onClick={onClose}
                disabled={loading}
                className="px-6 py-3 bg-white/10 backdrop-blur-md border border-white/20 rounded-lg text-white hover:bg-white/15 transition-all disabled:opacity-50"
              >
                Cancel
              </button>
            )}
            <button
              type="submit"
              disabled={loading}
              className="px-6 py-3 bg-gradient-to-r from-indigo-500 to-purple-500 hover:from-indigo-600 hover:to-purple-600 text-white font-semibold rounded-lg shadow-lg hover:shadow-xl transition-all disabled:opacity-50 flex items-center gap-2"
            >
              {loading ? (
                <>
                  <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                  <span>Saving...</span>
                </>
              ) : (
                <span>{isEditMode ? "Update Member" : "Add Member"}</span>
              )}
            </button>
          </div>
        </form>
      ) : (
        <div className="text-center py-8">
          <p className="text-red-300 text-lg mb-4">Permission Denied</p>
          <p className="text-white/60">
            Your role ({currentUserRole}) doesn't have permission to manage
            members.
          </p>
          <p className="text-white/60 text-sm mt-2">
            Please visit /fix-role to set your role to AGENCY_ADMIN or
            SUPER_ADMIN
          </p>
        </div>
      )}
    </div>
  );
}
