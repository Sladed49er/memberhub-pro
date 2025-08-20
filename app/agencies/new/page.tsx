"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { useUser } from "@clerk/nextjs";
import AgencyForm from "@/components/AgencyForm";

export default function NewAgencyPage() {
  const { user } = useUser();
  const router = useRouter();
  const [error, setError] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);

  const userRole = user?.unsafeMetadata?.role as string;

  // Only Super Admins can create agencies
  if (userRole !== "SUPER_ADMIN") {
    return (
      <div className="container mx-auto px-4 py-8">
        <div className="bg-red-50 border border-red-200 rounded-lg p-4">
          <p className="text-red-800">
            Only Super Admins can create new agencies.
          </p>
          <button
            onClick={() => router.back()}
            className="mt-4 text-red-600 underline"
          >
            Go back
          </button>
        </div>
      </div>
    );
  }

  const handleSubmit = async (formData: any) => {
    setSaving(true);
    setError(null);

    try {
      const response = await fetch("/api/agencies", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(formData),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || "Failed to create agency");
      }

      router.push(`/agencies/${data.id}`);
    } catch (err) {
      console.error("Error creating agency:", err);
      setError(err instanceof Error ? err.message : "Failed to create agency");
      setSaving(false);
    }
  };

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="max-w-2xl mx-auto">
        <h1 className="text-3xl font-bold mb-6 bg-gradient-to-r from-purple-600 to-pink-600 bg-clip-text text-transparent">
          Add New Agency
        </h1>
        {error && (
          <div className="bg-red-50 border border-red-200 rounded-lg p-4 mb-6">
            <p className="text-red-800">{error}</p>
          </div>
        )}
        <div className="bg-white rounded-lg p-6">
          <AgencyForm
            onSubmit={handleSubmit}
            isLoading={saving}
            isEdit={false}
            userRole={userRole}
          />
        </div>
      </div>
    </div>
  );
}
