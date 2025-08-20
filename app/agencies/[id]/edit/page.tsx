// app/agencies/[id]/edit/page.tsx
// Edit agency page with proper permissions

"use client";

import { useEffect, useState, use } from "react";
import { useRouter } from "next/navigation";
import { useUser } from "@clerk/nextjs";
import AgencyForm from "@/components/AgencyForm";

interface Agency {
  id: string;
  name: string;
  email: string;
  phone?: string;
  address?: string;
  city?: string;
  state?: string;
  zipCode?: string;
  website?: string;
  membershipType?: string;
  status: string;
  primaryContactName?: string;
  primaryContactEmail?: string;
  primaryContactPhone?: string;
}

export default function EditAgencyPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const resolvedParams = use(params);
  const { user } = useUser();
  const router = useRouter();
  const [agency, setAgency] = useState<Agency | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);

  const userRole = user?.unsafeMetadata?.role as string;
  const userAgencyId = user?.unsafeMetadata?.agencyId as string;

  // Check permissions
  const canEdit =
    userRole === "SUPER_ADMIN" ||
    (userRole === "ADMIN" && userAgencyId === resolvedParams.id);

  useEffect(() => {
    if (!canEdit) {
      setError("You do not have permission to edit this agency");
      setLoading(false);
      return;
    }

    fetchAgency();
  }, [resolvedParams.id, canEdit]);

  const fetchAgency = async () => {
    try {
      const response = await fetch(`/api/agencies/${resolvedParams.id}`);

      if (!response.ok) {
        const data = await response.json();
        throw new Error(data.error || "Failed to fetch agency");
      }

      const data = await response.json();
      setAgency(data);
    } catch (err) {
      console.error("Error fetching agency:", err);
      setError(err instanceof Error ? err.message : "An error occurred");
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (formData: any) => {
    setSaving(true);
    setError(null);

    try {
      // For Agency Admins, preserve certain fields they can't change
      const dataToSend =
        userRole === "ADMIN"
          ? {
              ...formData,
              membershipType: agency?.membershipType, // Preserve original
              status: agency?.status, // Preserve original
            }
          : formData;

      const response = await fetch(`/api/agencies/${resolvedParams.id}`, {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(dataToSend),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || "Failed to update agency");
      }

      router.push(`/agencies/${resolvedParams.id}`);
    } catch (err) {
      console.error("Error updating agency:", err);
      setError(err instanceof Error ? err.message : "Failed to update agency");
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <div className="container mx-auto px-4 py-8">
        <div className="flex justify-center items-center h-64">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-purple-600"></div>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="container mx-auto px-4 py-8">
        <div className="bg-red-50 border border-red-200 rounded-lg p-4">
          <p className="text-red-800">{error}</p>
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

  if (!agency) {
    return (
      <div className="container mx-auto px-4 py-8">
        <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4">
          <p className="text-yellow-800">Agency not found</p>
        </div>
      </div>
    );
  }

  // Parse primary contact name for the form
  const nameParts = agency.primaryContactName?.split(" ") || [];
  const primaryContactFirstName = nameParts[0] || "";
  const primaryContactLastName = nameParts.slice(1).join(" ") || "";

  const initialData = {
    ...agency,
    primaryContactFirstName,
    primaryContactLastName,
  };

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="max-w-2xl mx-auto">
        <h1 className="text-3xl font-bold mb-6 bg-gradient-to-r from-purple-600 to-pink-600 bg-clip-text text-transparent">
          Edit Agency
        </h1>

        {userRole === "ADMIN" && (
          <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 mb-6">
            <p className="text-blue-800 text-sm">
              As an Agency Admin, you can edit agency details but cannot change
              membership type or status.
            </p>
          </div>
        )}

        <div className="bg-white rounded-lg shadow-lg p-6">
          <AgencyForm
            initialData={initialData}
            onSubmit={handleSubmit}
            isLoading={saving}
            isEdit={true}
            userRole={userRole}
          />
        </div>
      </div>
    </div>
  );
}
