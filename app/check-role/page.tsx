// ============================================
// FILE: app/check-role/page.tsx
// PURPOSE: Debug and fix user role issues
// INSTRUCTIONS: Create this file to check and fix your role
// ============================================

"use client";

import { useUser } from "@clerk/nextjs";
import { useState } from "react";
import { useRouter } from "next/navigation";

export default function CheckRolePage() {
  const { user, isLoaded } = useUser();
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState("");

  if (!isLoaded) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-indigo-500 via-purple-500 to-pink-500 flex items-center justify-center">
        <div className="text-white text-xl">Loading...</div>
      </div>
    );
  }

  const metadata = user?.unsafeMetadata as any;
  const currentRole = metadata?.role;
  const currentAgencyId = metadata?.agencyId;
  const currentAgencyName = metadata?.agencyName;

  const fixMyRole = async (newRole: string) => {
    setLoading(true);
    setMessage("");

    try {
      // Call an API endpoint to fix the role
      const response = await fetch("/api/fix-role", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          userId: user?.id,
          role: newRole,
          agencyId: currentAgencyId || "netstar-agency-001", // Default agency ID
          agencyName: currentAgencyName || "Netstar, Inc.",
        }),
      });

      if (response.ok) {
        setMessage(`Role updated to ${newRole}! Refreshing...`);
        setTimeout(() => {
          window.location.reload();
        }, 2000);
      } else {
        setMessage("Failed to update role. Check console for details.");
      }
    } catch (error) {
      console.error("Error updating role:", error);
      setMessage("Error updating role. See console.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-indigo-500 via-purple-500 to-pink-500 p-8">
      <div className="max-w-4xl mx-auto">
        <button
          onClick={() => router.push("/dashboard")}
          className="mb-4 px-4 py-2 bg-white/10 backdrop-blur-md border border-white/20 rounded-lg text-white hover:bg-white/20"
        >
          ← Back to Dashboard
        </button>

        <div className="bg-white/10 backdrop-blur-md border border-white/20 rounded-xl p-8">
          <h1 className="text-3xl font-bold text-white mb-6">
            Role Checker & Fixer
          </h1>

          {/* Current User Info */}
          <div className="bg-white/10 backdrop-blur-md border border-white/20 rounded-lg p-6 mb-6">
            <h2 className="text-xl font-semibold text-white mb-4">
              Current User Information
            </h2>
            <div className="space-y-2 text-white">
              <p>
                <span className="text-white/60">Name:</span> {user?.firstName}{" "}
                {user?.lastName}
              </p>
              <p>
                <span className="text-white/60">Email:</span>{" "}
                {user?.emailAddresses[0]?.emailAddress}
              </p>
              <p>
                <span className="text-white/60">Clerk ID:</span> {user?.id}
              </p>
            </div>
          </div>

          {/* Current Metadata */}
          <div className="bg-white/10 backdrop-blur-md border border-white/20 rounded-lg p-6 mb-6">
            <h2 className="text-xl font-semibold text-white mb-4">
              Current Metadata
            </h2>
            <div className="space-y-2">
              <p className="text-white">
                <span className="text-white/60">Role:</span>{" "}
                <span
                  className={`px-3 py-1 rounded-full text-sm ${
                    currentRole === "SUPER_ADMIN"
                      ? "bg-red-500/20 text-red-300"
                      : currentRole === "AGENCY_ADMIN"
                      ? "bg-orange-500/20 text-orange-300"
                      : currentRole === "AGENCY_USER"
                      ? "bg-green-500/20 text-green-300"
                      : "bg-gray-500/20 text-gray-300"
                  }`}
                >
                  {currentRole || "NOT SET"}
                </span>
              </p>
              <p className="text-white">
                <span className="text-white/60">Agency ID:</span>{" "}
                {currentAgencyId || "NOT SET"}
              </p>
              <p className="text-white">
                <span className="text-white/60">Agency Name:</span>{" "}
                {currentAgencyName || "NOT SET"}
              </p>
            </div>
          </div>

          {/* Raw Metadata */}
          <div className="bg-white/10 backdrop-blur-md border border-white/20 rounded-lg p-6 mb-6">
            <h2 className="text-xl font-semibold text-white mb-4">
              Raw Metadata (Debug)
            </h2>
            <pre className="text-white/80 text-xs overflow-auto">
              {JSON.stringify(metadata, null, 2)}
            </pre>
          </div>

          {/* Quick Fix Buttons */}
          <div className="bg-white/10 backdrop-blur-md border border-white/20 rounded-lg p-6">
            <h2 className="text-xl font-semibold text-white mb-4">
              Quick Fix Options
            </h2>

            {message && (
              <div
                className={`mb-4 p-3 rounded-lg ${
                  message.includes("updated")
                    ? "bg-green-500/20 text-green-300"
                    : "bg-red-500/20 text-red-300"
                }`}
              >
                {message}
              </div>
            )}

            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <button
                onClick={() => fixMyRole("AGENCY_USER")}
                disabled={loading || currentRole === "AGENCY_USER"}
                className="px-6 py-3 bg-gradient-to-r from-green-500 to-teal-500 text-white rounded-lg hover:from-green-600 hover:to-teal-600 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                Set as Member
              </button>

              <button
                onClick={() => fixMyRole("AGENCY_ADMIN")}
                disabled={loading || currentRole === "AGENCY_ADMIN"}
                className="px-6 py-3 bg-gradient-to-r from-orange-500 to-yellow-500 text-white rounded-lg hover:from-orange-600 hover:to-yellow-600 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                Set as Agency Admin
              </button>

              <button
                onClick={() => fixMyRole("SUPER_ADMIN")}
                disabled={loading || currentRole === "SUPER_ADMIN"}
                className="px-6 py-3 bg-gradient-to-r from-red-500 to-pink-500 text-white rounded-lg hover:from-red-600 hover:to-pink-600 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                Set as Super Admin
              </button>
            </div>

            <div className="mt-6 p-4 bg-yellow-500/10 border border-yellow-500/20 rounded-lg">
              <p className="text-yellow-300 text-sm">
                <strong>Note:</strong> After changing your role, the page will
                refresh. You should then be able to add/edit members according
                to your new role.
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
