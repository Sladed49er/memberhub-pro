// ============================================
// FILE: app/onboarding/page.tsx
// PURPOSE: Let new users select their role/agency after sign up
// INSTRUCTIONS: Create this page and update Clerk to redirect here after sign up
// ============================================

"use client";

import { useState, useEffect } from "react";
import { useUser } from "@clerk/nextjs";
import { useRouter } from "next/navigation";

export default function OnboardingPage() {
  const { user, isLoaded } = useUser();
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [agencies, setAgencies] = useState<any[]>([]);
  const [selectedRole, setSelectedRole] = useState("");
  const [selectedAgency, setSelectedAgency] = useState("");
  const [accessCode, setAccessCode] = useState("");

  useEffect(() => {
    if (isLoaded && user) {
      // Check if user already has a role
      const metadata = user.unsafeMetadata as any;
      if (metadata?.role) {
        // Already onboarded, redirect to dashboard
        router.push("/dashboard");
      } else {
        // Load agencies for selection
        fetchAgencies();
      }
    }
  }, [isLoaded, user]);

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

  const completeOnboarding = async () => {
    if (!selectedRole) {
      alert("Please select a role");
      return;
    }

    if (selectedRole !== "SUPER_ADMIN" && !selectedAgency) {
      alert("Please select an agency");
      return;
    }

    setLoading(true);

    try {
      // Set the user's role
      const response = await fetch("/api/onboarding/complete", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          role: selectedRole,
          agencyId: selectedAgency,
          accessCode: accessCode,
        }),
      });

      const data = await response.json();

      if (response.ok) {
        // Success! Redirect to dashboard
        alert("Welcome! Redirecting to dashboard...");
        window.location.href = "/dashboard";
      } else {
        alert(data.error || "Failed to complete onboarding");
      }
    } catch (error) {
      console.error("Onboarding error:", error);
      alert("An error occurred during onboarding");
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

  return (
    <div className="min-h-screen bg-gradient-to-br from-indigo-500 via-purple-500 to-pink-500 flex items-center justify-center p-4">
      <div className="bg-white/10 backdrop-blur-md border border-white/20 rounded-xl p-8 max-w-2xl w-full">
        <h1 className="text-3xl font-bold text-white mb-2 text-center">
          Welcome to MemberHub Pro!
        </h1>
        <p className="text-white/80 text-center mb-8">
          Let's get you set up with the right access level
        </p>

        <div className="space-y-6">
          {/* Role Selection */}
          <div>
            <label className="block text-white font-semibold mb-3">
              What's your role?
            </label>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
              <button
                onClick={() => setSelectedRole("AGENCY_USER")}
                className={`p-4 rounded-lg border-2 transition-all ${
                  selectedRole === "AGENCY_USER"
                    ? "bg-green-500/30 border-green-400 text-white"
                    : "bg-white/10 border-white/20 text-white/80 hover:bg-white/20"
                }`}
              >
                <div className="text-2xl mb-2">👤</div>
                <div className="font-semibold">Member</div>
                <div className="text-sm mt-1 opacity-80">
                  View your profile and agency info
                </div>
              </button>

              <button
                onClick={() => setSelectedRole("AGENCY_ADMIN")}
                className={`p-4 rounded-lg border-2 transition-all ${
                  selectedRole === "AGENCY_ADMIN"
                    ? "bg-orange-500/30 border-orange-400 text-white"
                    : "bg-white/10 border-white/20 text-white/80 hover:bg-white/20"
                }`}
              >
                <div className="text-2xl mb-2">🏢</div>
                <div className="font-semibold">Agency Admin</div>
                <div className="text-sm mt-1 opacity-80">
                  Manage your agency & members
                </div>
              </button>

              <button
                onClick={() => setSelectedRole("SUPER_ADMIN")}
                className={`p-4 rounded-lg border-2 transition-all ${
                  selectedRole === "SUPER_ADMIN"
                    ? "bg-red-500/30 border-red-400 text-white"
                    : "bg-white/10 border-white/20 text-white/80 hover:bg-white/20"
                }`}
              >
                <div className="text-2xl mb-2">👑</div>
                <div className="font-semibold">Super Admin</div>
                <div className="text-sm mt-1 opacity-80">
                  Full system access
                </div>
              </button>
            </div>
          </div>

          {/* Agency Selection (if not Super Admin) */}
          {selectedRole && selectedRole !== "SUPER_ADMIN" && (
            <div>
              <label className="block text-white font-semibold mb-3">
                Select your agency
              </label>
              <select
                value={selectedAgency}
                onChange={(e) => setSelectedAgency(e.target.value)}
                className="w-full px-4 py-3 bg-white/10 backdrop-blur-md border border-white/20 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-purple-500"
              >
                <option value="" className="bg-purple-900">
                  Choose your agency...
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

              <p className="text-white/60 text-sm mt-2">
                Don't see your agency? Contact your administrator.
              </p>
            </div>
          )}

          {/* Access Code (for Super Admin) */}
          {selectedRole === "SUPER_ADMIN" && (
            <div>
              <label className="block text-white font-semibold mb-3">
                Super Admin Access Code
              </label>
              <input
                type="password"
                value={accessCode}
                onChange={(e) => setAccessCode(e.target.value)}
                placeholder="Enter access code"
                className="w-full px-4 py-3 bg-white/10 backdrop-blur-md border border-white/20 rounded-lg text-white placeholder-white/50 focus:outline-none focus:ring-2 focus:ring-purple-500"
              />
              <p className="text-yellow-300 text-sm mt-2">
                ⚠️ Super Admin access requires authorization
              </p>
            </div>
          )}

          {/* Submit Button */}
          <button
            onClick={completeOnboarding}
            disabled={
              loading ||
              !selectedRole ||
              (selectedRole !== "SUPER_ADMIN" && !selectedAgency)
            }
            className="w-full px-6 py-3 bg-gradient-to-r from-indigo-500 to-purple-500 text-white font-semibold rounded-lg hover:from-indigo-600 hover:to-purple-600 disabled:opacity-50 disabled:cursor-not-allowed transition-all"
          >
            {loading ? "Setting up..." : "Complete Setup"}
          </button>
        </div>
      </div>
    </div>
  );
}
