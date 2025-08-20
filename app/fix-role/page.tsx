// app/fix-role/page.tsx
"use client";

import { useUser } from "@clerk/nextjs";
import { useState } from "react";

export default function FixRolePage() {
  const { user, isLoaded } = useUser();
  const [status, setStatus] = useState("");
  const [loading, setLoading] = useState(false);

  const fixRole = async (role: string) => {
    setLoading(true);
    setStatus(`Setting role to ${role}...`);

    try {
      const metadata = user?.unsafeMetadata as any;
      const currentAgencyId = metadata?.agencyId;
      const currentAgencyName = metadata?.agencyName;

      const response = await fetch("/api/fix-role", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          role: role,
          agencyId: currentAgencyId || null,
          agencyName: currentAgencyName || null,
        }),
      });

      const data = await response.json();

      if (response.ok) {
        setStatus(
          `✅ Success! Role set to ${role}. Refreshing in 2 seconds...`
        );
        setTimeout(() => {
          window.location.href = "/dashboard";
        }, 2000);
      } else {
        setStatus(`❌ Error: ${data.error}`);
      }
    } catch (error) {
      setStatus(`❌ Error: ${error}`);
      console.error(error);
    } finally {
      setLoading(false);
    }
  };

  if (!isLoaded) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-indigo-500 via-purple-500 to-pink-500 flex items-center justify-center">
        <div className="text-white text-xl">Loading...</div>
      </div>
    );
  }

  const metadata = user?.unsafeMetadata as any;
  const currentRole = metadata?.role || "NOT SET";
  const currentAgencyId = metadata?.agencyId || "NOT SET";
  const currentAgencyName = metadata?.agencyName || "NOT SET";

  return (
    <div className="min-h-screen bg-gradient-to-br from-indigo-500 via-purple-500 to-pink-500 flex items-center justify-center p-4">
      <div className="bg-white/10 backdrop-blur-md border border-white/20 rounded-xl p-8 max-w-lg w-full">
        <h1 className="text-3xl font-bold text-white mb-6 text-center">
          Fix User Role
        </h1>

        {/* Current Status */}
        <div className="bg-white/10 rounded-lg p-4 mb-6">
          <h2 className="text-white font-semibold mb-2">Current Status:</h2>
          <div className="text-white/80 text-sm space-y-1">
            <p>
              User: {user?.firstName} {user?.lastName}
            </p>
            <p>Email: {user?.emailAddresses[0]?.emailAddress}</p>
            <p>
              Current Role:{" "}
              <span className="font-bold text-yellow-300">{currentRole}</span>
            </p>
            <p>Agency ID: {currentAgencyId}</p>
            <p>Agency Name: {currentAgencyName}</p>
          </div>
        </div>

        {/* Status Message */}
        {status && (
          <div
            className={`rounded-lg p-4 mb-6 ${
              status.includes("✅")
                ? "bg-green-500/20 text-green-300"
                : status.includes("❌")
                ? "bg-red-500/20 text-red-300"
                : "bg-blue-500/20 text-blue-300"
            }`}
          >
            {status}
          </div>
        )}

        {/* Action Buttons */}
        <div className="space-y-3">
          <button
            onClick={() => fixRole("SUPER_ADMIN")}
            disabled={loading}
            className="w-full px-6 py-3 bg-gradient-to-r from-red-500 to-pink-500 text-white rounded-lg hover:from-red-600 hover:to-pink-600 disabled:opacity-50 disabled:cursor-not-allowed font-semibold"
          >
            Set as Super Admin
          </button>

          <button
            onClick={() => fixRole("ADMIN")}
            disabled={loading}
            className="w-full px-6 py-3 bg-gradient-to-r from-orange-500 to-yellow-500 text-white rounded-lg hover:from-orange-600 hover:to-yellow-600 disabled:opacity-50 disabled:cursor-not-allowed font-semibold"
          >
            Set as Agency Admin
          </button>

          <button
            onClick={() => fixRole("PRIMARY")}
            disabled={loading}
            className="w-full px-6 py-3 bg-gradient-to-r from-blue-500 to-cyan-500 text-white rounded-lg hover:from-blue-600 hover:to-cyan-600 disabled:opacity-50 disabled:cursor-not-allowed font-semibold"
          >
            Set as Primary Member
          </button>

          <button
            onClick={() => fixRole("STANDARD")}
            disabled={loading}
            className="w-full px-6 py-3 bg-gradient-to-r from-green-500 to-teal-500 text-white rounded-lg hover:from-green-600 hover:to-teal-600 disabled:opacity-50 disabled:cursor-not-allowed font-semibold"
          >
            Set as Standard Member
          </button>

          <button
            onClick={() => fixRole("GUEST")}
            disabled={loading}
            className="w-full px-6 py-3 bg-gradient-to-r from-gray-500 to-slate-500 text-white rounded-lg hover:from-gray-600 hover:to-slate-600 disabled:opacity-50 disabled:cursor-not-allowed font-semibold"
          >
            Set as Guest
          </button>

          <button
            onClick={() => (window.location.href = "/dashboard")}
            disabled={loading}
            className="w-full px-6 py-3 bg-white/10 border border-white/20 text-white rounded-lg hover:bg-white/20 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            Back to Dashboard
          </button>
        </div>

        {/* Info Box */}
        <div className="mt-6 bg-blue-500/10 border border-blue-500/20 rounded-lg p-4">
          <p className="text-blue-300 text-sm">
            <strong>Note:</strong> After setting your role, the page will
            refresh and you'll be redirected to the dashboard. If you need an
            agency assignment, please contact your administrator.
          </p>
        </div>
      </div>
    </div>
  );
}
