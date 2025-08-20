// app/check-role/page.tsx
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
          agencyId: currentAgencyId || null, // No default agency ID
          agencyName: currentAgencyName || null, // No default agency name
        }),
      });

      if (response.ok) {
        setMessage(`Role updated to ${newRole}! Refreshing...`);
        setTimeout(() => {
          window.location.reload();
        }, 2000);
      } else {
        setMessage("Failed to update role. Please try again.");
      }
    } catch (error) {
      console.error("Error updating role:", error);
      setMessage("An error occurred. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-indigo-500 via-purple-500 to-pink-500 p-8">
      <div className="max-w-4xl mx-auto">
        <button
          onClick={() => router.push("/dashboard")}
          className="mb-6 px-4 py-2 bg-white/20 text-white rounded-lg hover:bg-white/30 transition-all"
        >
          ← Back to Dashboard
        </button>

        <div className="bg-white/10 backdrop-blur-md rounded-xl p-8 border border-white/20">
          <h1 className="text-3xl font-bold text-white mb-8">
            Check & Fix User Role
          </h1>

          {/* Current Status */}
          <div className="mb-8 p-6 bg-white/10 rounded-lg">
            <h2 className="text-xl font-semibold text-white mb-4">
              Current Status
            </h2>
            <div className="space-y-2 text-white/90">
              <p>
                <span className="font-semibold">User ID:</span> {user?.id}
              </p>
              <p>
                <span className="font-semibold">Email:</span>{" "}
                {user?.emailAddresses?.[0]?.emailAddress}
              </p>
              <p>
                <span className="font-semibold">Current Role:</span>{" "}
                <span
                  className={`px-3 py-1 rounded-full text-sm ${
                    currentRole === "SUPER_ADMIN"
                      ? "bg-red-500/30 text-red-200"
                      : currentRole === "ADMIN" ||
                        currentRole === "AGENCY_ADMIN"
                      ? "bg-orange-500/30 text-orange-200"
                      : currentRole === "PRIMARY"
                      ? "bg-blue-500/30 text-blue-200"
                      : currentRole === "STANDARD"
                      ? "bg-green-500/30 text-green-200"
                      : "bg-gray-500/30 text-gray-200"
                  }`}
                >
                  {currentRole || "NOT SET"}
                </span>
              </p>
              {currentAgencyId && (
                <>
                  <p>
                    <span className="font-semibold">Agency ID:</span>{" "}
                    {currentAgencyId}
                  </p>
                  <p>
                    <span className="font-semibold">Agency Name:</span>{" "}
                    {currentAgencyName}
                  </p>
                </>
              )}
            </div>
          </div>

          {/* Quick Fix Buttons */}
          <div className="mb-8">
            <h2 className="text-xl font-semibold text-white mb-4">
              Quick Fix Options
            </h2>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              <button
                onClick={() => fixMyRole("SUPER_ADMIN")}
                disabled={loading || currentRole === "SUPER_ADMIN"}
                className="p-4 bg-gradient-to-r from-red-500 to-pink-600 text-white rounded-lg hover:shadow-lg transition-all disabled:opacity-50 disabled:cursor-not-allowed"
              >
                <div className="font-semibold">Super Admin</div>
                <div className="text-sm opacity-80">Full system access</div>
              </button>

              <button
                onClick={() => fixMyRole("ADMIN")}
                disabled={loading || currentRole === "ADMIN"}
                className="p-4 bg-gradient-to-r from-orange-500 to-amber-600 text-white rounded-lg hover:shadow-lg transition-all disabled:opacity-50 disabled:cursor-not-allowed"
              >
                <div className="font-semibold">Agency Admin</div>
                <div className="text-sm opacity-80">
                  Manage agency & members
                </div>
              </button>

              <button
                onClick={() => fixMyRole("PRIMARY")}
                disabled={loading || currentRole === "PRIMARY"}
                className="p-4 bg-gradient-to-r from-blue-500 to-cyan-600 text-white rounded-lg hover:shadow-lg transition-all disabled:opacity-50 disabled:cursor-not-allowed"
              >
                <div className="font-semibold">Primary Member</div>
                <div className="text-sm opacity-80">Enhanced member access</div>
              </button>

              <button
                onClick={() => fixMyRole("STANDARD")}
                disabled={loading || currentRole === "STANDARD"}
                className="p-4 bg-gradient-to-r from-green-500 to-teal-600 text-white rounded-lg hover:shadow-lg transition-all disabled:opacity-50 disabled:cursor-not-allowed"
              >
                <div className="font-semibold">Standard Member</div>
                <div className="text-sm opacity-80">Basic member access</div>
              </button>

              <button
                onClick={() => fixMyRole("GUEST")}
                disabled={loading || currentRole === "GUEST"}
                className="p-4 bg-gradient-to-r from-gray-500 to-slate-600 text-white rounded-lg hover:shadow-lg transition-all disabled:opacity-50 disabled:cursor-not-allowed"
              >
                <div className="font-semibold">Guest</div>
                <div className="text-sm opacity-80">Limited access</div>
              </button>
            </div>
          </div>

          {/* Message Display */}
          {message && (
            <div
              className={`p-4 rounded-lg ${
                message.includes("Failed") || message.includes("error")
                  ? "bg-red-500/20 text-red-200"
                  : "bg-green-500/20 text-green-200"
              }`}
            >
              {message}
            </div>
          )}

          {/* Instructions */}
          <div className="mt-8 p-6 bg-white/5 rounded-lg">
            <h3 className="text-lg font-semibold text-white mb-2">
              Instructions
            </h3>
            <ul className="space-y-2 text-white/80 text-sm">
              <li>• This page helps you check and fix your user role</li>
              <li>• Click any button above to update your role</li>
              <li>• The page will refresh after updating</li>
              <li>• Use Super Admin for full system access</li>
              <li>• Use Agency Admin to manage an agency</li>
            </ul>
          </div>
        </div>
      </div>
    </div>
  );
}
