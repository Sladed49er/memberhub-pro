// components/MemberForm.tsx
"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { useUser } from "@clerk/nextjs";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Info } from "lucide-react";

interface MemberFormProps {
  member?: any;
  mode: "create" | "edit";
}

export default function MemberForm({ member, mode }: MemberFormProps) {
  const router = useRouter();
  const { user } = useUser();
  const userRole = user?.unsafeMetadata?.role as string;
  const userAgencyId = user?.unsafeMetadata?.agencyId as string;
  const userAgencyName = user?.unsafeMetadata?.agencyName as string;

  const [agencies, setAgencies] = useState<any[]>([]);
  const [formData, setFormData] = useState({
    email: member?.email || "",
    firstName: member?.firstName || "",
    lastName: member?.lastName || "",
    phone: member?.phone || "",
    role: member?.role || "AGENCY_USER",
    agencyId: member?.agencyId || userAgencyId || "",
  });

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const isAgencyAdmin = userRole === "AGENCY_ADMIN";
  const isSuperAdmin = userRole === "SUPER_ADMIN";

  useEffect(() => {
    // Only fetch agencies for Super Admins
    if (isSuperAdmin) {
      fetchAgencies();
    } else if (isAgencyAdmin) {
      // For Agency Admins, set their agency as the only option
      setAgencies([{ id: userAgencyId, name: userAgencyName }]);
      // Force the agencyId to be the user's agency
      setFormData((prev) => ({ ...prev, agencyId: userAgencyId }));
    }
  }, [isSuperAdmin, isAgencyAdmin, userAgencyId, userAgencyName]);

  const fetchAgencies = async () => {
    try {
      const response = await fetch("/api/agencies");
      if (response.ok) {
        const data = await response.json();
        setAgencies(data);
      }
    } catch (err) {
      console.error("Failed to fetch agencies:", err);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError("");

    try {
      // For Agency Admins, ensure agencyId is always their own
      const dataToSend = {
        ...formData,
        agencyId: isAgencyAdmin ? userAgencyId : formData.agencyId,
      };

      // Validate role assignment for Agency Admins
      if (isAgencyAdmin && dataToSend.role === "SUPER_ADMIN") {
        throw new Error("You cannot assign Super Admin role");
      }

      const url =
        mode === "create" ? "/api/members" : `/api/members/${member.id}`;

      const method = mode === "create" ? "POST" : "PUT";

      const response = await fetch(url, {
        method,
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(dataToSend),
      });

      if (!response.ok) {
        const data = await response.json();
        throw new Error(data.error || "Failed to save member");
      }

      router.push("/members");
      router.refresh();
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  // Check if Agency Admin is trying to edit a member from another agency
  if (isAgencyAdmin && mode === "edit" && member?.agencyId !== userAgencyId) {
    return (
      <Alert variant="destructive">
        <AlertDescription>
          You don't have permission to edit members from other agencies.
        </AlertDescription>
      </Alert>
    );
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-6 max-w-2xl">
      {error && (
        <Alert variant="destructive">
          <AlertDescription>{error}</AlertDescription>
        </Alert>
      )}

      {isAgencyAdmin && (
        <Alert>
          <Info className="h-4 w-4" />
          <AlertDescription>
            You are adding members to your agency: {userAgencyName}
          </AlertDescription>
        </Alert>
      )}

      <div className="space-y-4">
        <div>
          <Label htmlFor="email">Email</Label>
          <Input
            id="email"
            type="email"
            value={formData.email}
            onChange={(e) =>
              setFormData({ ...formData, email: e.target.value })
            }
            required
          />
        </div>

        <div>
          <Label htmlFor="firstName">First Name</Label>
          <Input
            id="firstName"
            value={formData.firstName}
            onChange={(e) =>
              setFormData({ ...formData, firstName: e.target.value })
            }
            required
          />
        </div>

        <div>
          <Label htmlFor="lastName">Last Name</Label>
          <Input
            id="lastName"
            value={formData.lastName}
            onChange={(e) =>
              setFormData({ ...formData, lastName: e.target.value })
            }
            required
          />
        </div>

        <div>
          <Label htmlFor="phone">Phone</Label>
          <Input
            id="phone"
            type="tel"
            value={formData.phone}
            onChange={(e) =>
              setFormData({ ...formData, phone: e.target.value })
            }
          />
        </div>

        <div>
          <Label htmlFor="role">Role</Label>
          <Select
            value={formData.role}
            onValueChange={(value) => setFormData({ ...formData, role: value })}
          >
            <SelectTrigger>
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="AGENCY_USER">Member</SelectItem>
              <SelectItem value="AGENCY_ADMIN">Agency Admin</SelectItem>
              {/* Only Super Admins can assign Super Admin role */}
              {isSuperAdmin && (
                <SelectItem value="SUPER_ADMIN">Super Admin</SelectItem>
              )}
            </SelectContent>
          </Select>
        </div>

        {/* Agency selection */}
        {isSuperAdmin ? (
          <div>
            <Label htmlFor="agency">Agency</Label>
            <Select
              value={formData.agencyId}
              onValueChange={(value) =>
                setFormData({ ...formData, agencyId: value })
              }
            >
              <SelectTrigger>
                <SelectValue placeholder="Select an agency" />
              </SelectTrigger>
              <SelectContent>
                {agencies.map((agency) => (
                  <SelectItem key={agency.id} value={agency.id}>
                    {agency.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        ) : (
          <div>
            <Label>Agency</Label>
            <div className="p-2 bg-gray-100 rounded-md">
              {userAgencyName} (Auto-assigned)
            </div>
          </div>
        )}
      </div>

      <div className="flex gap-4">
        <Button type="submit" disabled={loading}>
          {loading
            ? "Saving..."
            : mode === "create"
            ? "Create Member"
            : "Update Member"}
        </Button>

        <Button
          type="button"
          variant="outline"
          onClick={() => router.push("/members")}
        >
          Cancel
        </Button>
      </div>
    </form>
  );
}
