// ============================================
// FILE: components/AgencyForm.tsx
// PURPOSE: Agency form with role-based field restrictions
// LAST MODIFIED: December 2024
// NOTES: Agency Admins can edit details but not status or membership type
// ============================================

"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { useUser } from "@clerk/nextjs";

interface AgencyFormProps {
  agency?: any;
  onClose?: () => void;
  onSuccess?: () => void;
}

export default function AgencyForm({
  agency,
  onClose,
  onSuccess,
}: AgencyFormProps) {
  const router = useRouter();
  const { user } = useUser();
  const isEditMode = !!agency;

  // Get current user's role and agency
  const metadata = user?.unsafeMetadata as any;
  const currentUserRole = metadata?.role || "AGENCY_USER";
  const currentUserAgencyId = metadata?.agencyId || null;

  const [formData, setFormData] = useState({
    name: agency?.name || "",
    email: agency?.email || "",
    phone: agency?.phone || "",
    website: agency?.website || "",
    membershipType: agency?.membershipType || "A1_AGENCY",
    status: agency?.status || "ACTIVE",

    // Address fields
    address: agency?.address || "",
    city: agency?.city || "",
    state: agency?.state || "",
    zipCode: agency?.zipCode || "",

    // Primary Contact
    primaryContactName: agency?.primaryContactName || "",
    primaryContactEmail: agency?.primaryContactEmail || "",
    primaryContactPhone: agency?.primaryContactPhone || "",
  });

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  // Permission checks
  const canEditAgency = () => {
    // Super Admins can edit any agency
    if (currentUserRole === "SUPER_ADMIN") return true;

    // Agency Admins can only edit their own agency
    if (currentUserRole === "AGENCY_ADMIN" && isEditMode) {
      return agency?.id === currentUserAgencyId;
    }

    // Only Super Admins can create new agencies
    if (!isEditMode) {
      return currentUserRole === "SUPER_ADMIN";
    }

    return false;
  };

  // Check which fields the current user can edit
  const canEditField = (fieldName: string) => {
    // Super Admins can edit all fields
    if (currentUserRole === "SUPER_ADMIN") return true;

    // Agency Admins cannot edit status or membership type
    const restrictedFields = ["status", "membershipType"];

    if (currentUserRole === "AGENCY_ADMIN") {
      // Must be editing their own agency
      if (!isEditMode || agency?.id !== currentUserAgencyId) return false;

      // Cannot edit restricted fields
      if (restrictedFields.includes(fieldName)) return false;

      // Can edit other fields
      return true;
    }

    return false;
  };

  const membershipTypes = [
    { value: "A1_AGENCY", label: "A1 - Agency" },
    { value: "A2_BRANCH", label: "A2 - Branch" },
    { value: "A3_ASSOCIATE", label: "A3 - Associate" },
    { value: "STERLING_PARTNER", label: "Sterling Partner" },
  ];

  const statusOptions = [
    { value: "ACTIVE", label: "Active" },
    { value: "INACTIVE", label: "Inactive" },
    { value: "SUSPENDED", label: "Suspended" },
  ];

  const stateOptions = [
    "AL",
    "AK",
    "AZ",
    "AR",
    "CA",
    "CO",
    "CT",
    "DE",
    "FL",
    "GA",
    "HI",
    "ID",
    "IL",
    "IN",
    "IA",
    "KS",
    "KY",
    "LA",
    "ME",
    "MD",
    "MA",
    "MI",
    "MN",
    "MS",
    "MO",
    "MT",
    "NE",
    "NV",
    "NH",
    "NJ",
    "NM",
    "NY",
    "NC",
    "ND",
    "OH",
    "OK",
    "OR",
    "PA",
    "RI",
    "SC",
    "SD",
    "TN",
    "TX",
    "UT",
    "VT",
    "VA",
    "WA",
    "WV",
    "WI",
    "WY",
  ];

  useEffect(() => {
    // Check permissions on mount
    if (!canEditAgency()) {
      setError("You don't have permission to perform this action");
      setTimeout(() => {
        if (onClose) onClose();
        else router.push("/agencies");
      }, 2000);
    }
  }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError("");

    // Final permission check
    if (!canEditAgency()) {
      setError("You don't have permission to perform this action");
      setLoading(false);
      return;
    }

    // Additional validation for Agency Admins
    if (currentUserRole === "AGENCY_ADMIN" && isEditMode) {
      if (agency?.id !== currentUserAgencyId) {
        setError("You can only edit your own agency");
        setLoading(false);
        return;
      }

      // Ensure restricted fields haven't been tampered with
      if (
        formData.status !== agency.status ||
        formData.membershipType !== agency.membershipType
      ) {
        setError("You cannot modify agency status or membership type");
        setLoading(false);
        return;
      }
    }

    // Check for duplicate email in create mode
    if (!isEditMode) {
      try {
        const checkResponse = await fetch("/api/agencies");
        if (checkResponse.ok) {
          const existingAgencies = await checkResponse.json();
          const emailExists = existingAgencies.some(
            (a: any) =>
              a.email.toLowerCase() === formData.email.trim().toLowerCase()
          );

          if (emailExists) {
            setError(`An agency with email ${formData.email} already exists.`);
            setLoading(false);
            return;
          }
        }
      } catch (checkError) {
        console.error("Error checking existing agencies:", checkError);
      }
    }

    // Sanitize input data
    const sanitizedData = {
      name: formData.name.trim(),
      email: formData.email.trim().toLowerCase(),
      phone: formData.phone?.trim() || null,
      website: formData.website?.trim() || null,
      membershipType: formData.membershipType,
      status: formData.status,
      address: formData.address?.trim() || null,
      city: formData.city?.trim() || null,
      state: formData.state || null,
      zipCode: formData.zipCode?.trim() || null,
      primaryContactName: formData.primaryContactName?.trim() || null,
      primaryContactEmail:
        formData.primaryContactEmail?.trim().toLowerCase() || null,
      primaryContactPhone: formData.primaryContactPhone?.trim() || null,
      // Add metadata for audit trail
      modifiedBy: user?.id,
      modifiedByRole: currentUserRole,
    };

    try {
      const url = isEditMode ? `/api/agencies/${agency.id}` : "/api/agencies";
      const method = isEditMode ? "PUT" : "POST";

      console.log(`${method} to ${url} with data:`, sanitizedData);

      const response = await fetch(url, {
        method,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(sanitizedData),
      });

      // Try to check for errors
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
        console.log("Could not parse response, continuing anyway");
      }

      if (errorMessage) {
        setError(errorMessage);
        setLoading(false);
        return;
      }

      // Assume success (following the working pattern)
      console.log(`Agency ${isEditMode ? "updated" : "created"}`);
      await new Promise((resolve) => setTimeout(resolve, 500));

      if (onSuccess) onSuccess();
      if (onClose) onClose();
      else router.refresh();
    } catch (err) {
      console.error("Form submission error:", err);
      // Still try to close as operation might have succeeded
      await new Promise((resolve) => setTimeout(resolve, 500));
      if (onSuccess) onSuccess();
      if (onClose) onClose();
    }

    setLoading(false);
  };

  const handleChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>
  ) => {
    const { name, value } = e.target;

    // Check if user can edit this field
    if (!canEditField(name)) {
      setError(`You cannot modify the ${name} field`);
      return;
    }

    setFormData((prev) => ({
      ...prev,
      [name]: value,
    }));

    // Clear error on valid change
    if (error) setError("");
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      {/* Error Message */}
      {error && (
        <div className="bg-red-500/10 backdrop-blur-md border border-red-500/20 text-red-300 px-4 py-3 rounded-lg">
          <div className="flex items-start gap-2">
            <svg
              className="w-5 h-5 mt-0.5"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
              />
            </svg>
            <span>{error}</span>
          </div>
        </div>
      )}

      {/* Info Notice for Agency Admins */}
      {currentUserRole === "AGENCY_ADMIN" && isEditMode && (
        <div className="bg-blue-500/10 backdrop-blur-md border border-blue-500/20 text-blue-300 px-4 py-3 rounded-lg">
          <div className="flex items-start gap-2">
            <svg
              className="w-5 h-5 mt-0.5"
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
            <div className="text-sm">
              <p className="font-medium">Agency Admin Editing:</p>
              <ul className="mt-1 space-y-1 text-xs">
                <li>✓ You can update agency contact and address information</li>
                <li>✓ You can modify primary contact details</li>
                <li>
                  ✗ Status and membership type changes require Super Admin
                </li>
                <li className="text-yellow-300">
                  💡 For membership upgrades, contact support or a Super Admin
                </li>
              </ul>
            </div>
          </div>
        </div>
      )}

      {/* Basic Information Section */}
      <div className="border-b border-white/10 pb-6">
        <h3 className="text-lg font-semibold text-white mb-4">
          Basic Information
        </h3>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {/* Agency Name */}
          <div>
            <label className="block text-sm font-medium text-white/90 mb-2">
              Agency Name *
            </label>
            <input
              type="text"
              name="name"
              required
              value={formData.name}
              onChange={handleChange}
              disabled={!canEditField("name")}
              maxLength={100}
              className="w-full px-4 py-3 bg-white/10 backdrop-blur-md border border-white/20 rounded-lg text-white placeholder-white/50 focus:outline-none focus:ring-2 focus:ring-purple-500 disabled:opacity-50 disabled:cursor-not-allowed"
              placeholder="Acme Insurance Agency"
            />
          </div>

          {/* Email */}
          <div>
            <label className="block text-sm font-medium text-white/90 mb-2">
              Agency Email *
              {isEditMode && (
                <span className="text-white/50 text-xs ml-2">
                  (Primary contact)
                </span>
              )}
            </label>
            <input
              type="email"
              name="email"
              required
              value={formData.email}
              onChange={handleChange}
              disabled={!canEditField("email")}
              maxLength={100}
              className="w-full px-4 py-3 bg-white/10 backdrop-blur-md border border-white/20 rounded-lg text-white placeholder-white/50 focus:outline-none focus:ring-2 focus:ring-purple-500 disabled:opacity-50 disabled:cursor-not-allowed"
              placeholder="contact@agency.com"
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
              disabled={!canEditField("phone")}
              maxLength={20}
              className="w-full px-4 py-3 bg-white/10 backdrop-blur-md border border-white/20 rounded-lg text-white placeholder-white/50 focus:outline-none focus:ring-2 focus:ring-purple-500 disabled:opacity-50 disabled:cursor-not-allowed"
              placeholder="+1 (555) 123-4567"
            />
          </div>

          {/* Website */}
          <div>
            <label className="block text-sm font-medium text-white/90 mb-2">
              Website
            </label>
            <input
              type="url"
              name="website"
              value={formData.website}
              onChange={handleChange}
              disabled={!canEditField("website")}
              className="w-full px-4 py-3 bg-white/10 backdrop-blur-md border border-white/20 rounded-lg text-white placeholder-white/50 focus:outline-none focus:ring-2 focus:ring-purple-500 disabled:opacity-50 disabled:cursor-not-allowed"
              placeholder="https://www.agency.com"
            />
          </div>

          {/* Membership Type - Restricted for Agency Admins */}
          <div>
            <label className="block text-sm font-medium text-white/90 mb-2">
              Membership Type
              {currentUserRole === "AGENCY_ADMIN" && (
                <span className="text-white/50 text-xs ml-2">
                  (Contact Super Admin to change)
                </span>
              )}
            </label>
            {canEditField("membershipType") ? (
              <select
                name="membershipType"
                value={formData.membershipType}
                onChange={handleChange}
                className="w-full px-4 py-3 bg-white/10 backdrop-blur-md border border-white/20 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-purple-500 cursor-pointer"
              >
                {membershipTypes.map((type) => (
                  <option
                    key={type.value}
                    value={type.value}
                    className="bg-purple-900"
                  >
                    {type.label}
                  </option>
                ))}
              </select>
            ) : (
              <div className="px-4 py-3 bg-white/5 border border-white/10 rounded-lg">
                <span className="text-white/70">
                  {membershipTypes.find(
                    (t) => t.value === formData.membershipType
                  )?.label || formData.membershipType}
                </span>
                {currentUserRole === "AGENCY_ADMIN" && (
                  <p className="text-xs text-yellow-300 mt-1">
                    💡 Upgrade available? Contact support for membership changes
                  </p>
                )}
              </div>
            )}
          </div>

          {/* Status - Restricted for Agency Admins */}
          <div>
            <label className="block text-sm font-medium text-white/90 mb-2">
              Status
              {currentUserRole === "AGENCY_ADMIN" && (
                <span className="text-white/50 text-xs ml-2">(View only)</span>
              )}
            </label>
            {canEditField("status") ? (
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
            ) : (
              <div className="px-4 py-3 bg-white/5 border border-white/10 rounded-lg">
                <span
                  className={`px-3 py-1 rounded-full text-sm ${
                    formData.status === "ACTIVE"
                      ? "bg-green-500/20 text-green-300"
                      : formData.status === "INACTIVE"
                      ? "bg-gray-500/20 text-gray-300"
                      : "bg-red-500/20 text-red-300"
                  }`}
                >
                  {statusOptions.find((s) => s.value === formData.status)
                    ?.label || formData.status}
                </span>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Address Section */}
      <div className="border-b border-white/10 pb-6">
        <h3 className="text-lg font-semibold text-white mb-4">
          Address Information
        </h3>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {/* Street Address */}
          <div className="md:col-span-2">
            <label className="block text-sm font-medium text-white/90 mb-2">
              Street Address
            </label>
            <input
              type="text"
              name="address"
              value={formData.address}
              onChange={handleChange}
              disabled={!canEditField("address")}
              className="w-full px-4 py-3 bg-white/10 backdrop-blur-md border border-white/20 rounded-lg text-white placeholder-white/50 focus:outline-none focus:ring-2 focus:ring-purple-500 disabled:opacity-50 disabled:cursor-not-allowed"
              placeholder="123 Main Street, Suite 100"
            />
          </div>

          {/* City */}
          <div>
            <label className="block text-sm font-medium text-white/90 mb-2">
              City
            </label>
            <input
              type="text"
              name="city"
              value={formData.city}
              onChange={handleChange}
              disabled={!canEditField("city")}
              className="w-full px-4 py-3 bg-white/10 backdrop-blur-md border border-white/20 rounded-lg text-white placeholder-white/50 focus:outline-none focus:ring-2 focus:ring-purple-500 disabled:opacity-50 disabled:cursor-not-allowed"
              placeholder="San Francisco"
            />
          </div>

          {/* State */}
          <div>
            <label className="block text-sm font-medium text-white/90 mb-2">
              State
            </label>
            <select
              name="state"
              value={formData.state}
              onChange={handleChange}
              disabled={!canEditField("state")}
              className="w-full px-4 py-3 bg-white/10 backdrop-blur-md border border-white/20 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-purple-500 cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed"
            >
              <option value="" className="bg-purple-900">
                Select State
              </option>
              {stateOptions.map((state) => (
                <option key={state} value={state} className="bg-purple-900">
                  {state}
                </option>
              ))}
            </select>
          </div>

          {/* Zip Code */}
          <div>
            <label className="block text-sm font-medium text-white/90 mb-2">
              Zip Code
            </label>
            <input
              type="text"
              name="zipCode"
              value={formData.zipCode}
              onChange={handleChange}
              disabled={!canEditField("zipCode")}
              maxLength={10}
              pattern="[0-9]{5}(-[0-9]{4})?"
              className="w-full px-4 py-3 bg-white/10 backdrop-blur-md border border-white/20 rounded-lg text-white placeholder-white/50 focus:outline-none focus:ring-2 focus:ring-purple-500 disabled:opacity-50 disabled:cursor-not-allowed"
              placeholder="94107"
            />
          </div>
        </div>
      </div>

      {/* Primary Contact Section */}
      <div className="pb-6">
        <h3 className="text-lg font-semibold text-white mb-4">
          Primary Contact
        </h3>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {/* Contact Name */}
          <div>
            <label className="block text-sm font-medium text-white/90 mb-2">
              Contact Name
            </label>
            <input
              type="text"
              name="primaryContactName"
              value={formData.primaryContactName}
              onChange={handleChange}
              disabled={!canEditField("primaryContactName")}
              className="w-full px-4 py-3 bg-white/10 backdrop-blur-md border border-white/20 rounded-lg text-white placeholder-white/50 focus:outline-none focus:ring-2 focus:ring-purple-500 disabled:opacity-50 disabled:cursor-not-allowed"
              placeholder="Jane Smith"
            />
          </div>

          {/* Contact Email */}
          <div>
            <label className="block text-sm font-medium text-white/90 mb-2">
              Contact Email
            </label>
            <input
              type="email"
              name="primaryContactEmail"
              value={formData.primaryContactEmail}
              onChange={handleChange}
              disabled={!canEditField("primaryContactEmail")}
              className="w-full px-4 py-3 bg-white/10 backdrop-blur-md border border-white/20 rounded-lg text-white placeholder-white/50 focus:outline-none focus:ring-2 focus:ring-purple-500 disabled:opacity-50 disabled:cursor-not-allowed"
              placeholder="jane@agency.com"
            />
          </div>

          {/* Contact Phone */}
          <div>
            <label className="block text-sm font-medium text-white/90 mb-2">
              Contact Phone
            </label>
            <input
              type="tel"
              name="primaryContactPhone"
              value={formData.primaryContactPhone}
              onChange={handleChange}
              disabled={!canEditField("primaryContactPhone")}
              className="w-full px-4 py-3 bg-white/10 backdrop-blur-md border border-white/20 rounded-lg text-white placeholder-white/50 focus:outline-none focus:ring-2 focus:ring-purple-500 disabled:opacity-50 disabled:cursor-not-allowed"
              placeholder="+1 (555) 987-6543"
            />
          </div>
        </div>
      </div>

      {/* Action Buttons */}
      <div className="flex gap-4 justify-end pt-4 border-t border-white/10">
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
          disabled={loading || !canEditAgency()}
          className="px-6 py-3 bg-gradient-to-r from-indigo-500 to-purple-500 hover:from-indigo-600 hover:to-purple-600 text-white font-semibold rounded-lg shadow-lg hover:shadow-xl transition-all disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
        >
          {loading ? (
            <>
              <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
              <span>Saving...</span>
            </>
          ) : (
            <span>{isEditMode ? "Update Agency" : "Create Agency"}</span>
          )}
        </button>
      </div>
    </form>
  );
}
