// components/AgencyForm.tsx
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

interface AgencyFormProps {
  agency?: any;
  mode: "create" | "edit";
}

export default function AgencyForm({ agency, mode }: AgencyFormProps) {
  const router = useRouter();
  const { user } = useUser();
  const userRole = user?.unsafeMetadata?.role as string;

  const [formData, setFormData] = useState({
    name: agency?.name || "",
    address: agency?.address || "",
    phone: agency?.phone || "",
    email: agency?.email || "",
    membershipType: agency?.membershipType || "A1_AGENCY",
    status: agency?.status || "ACTIVE",
  });

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  // Agency Admins can only edit certain fields
  const isAgencyAdmin = userRole === "AGENCY_ADMIN";
  const isSuperAdmin = userRole === "SUPER_ADMIN";

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError("");

    try {
      // For Agency Admins, only send editable fields
      const dataToSend = isAgencyAdmin
        ? {
            name: formData.name,
            address: formData.address,
            phone: formData.phone,
            email: formData.email,
            // Explicitly exclude membershipType and status for Agency Admins
          }
        : formData; // Super Admins can send all fields

      const url =
        mode === "create" ? "/api/agencies" : `/api/agencies/${agency.id}`;

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
        throw new Error(data.error || "Failed to save agency");
      }

      router.push("/agencies");
      router.refresh();
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  // Agency Admins shouldn't be able to create agencies
  if (mode === "create" && isAgencyAdmin) {
    return (
      <Alert>
        <Info className="h-4 w-4" />
        <AlertDescription>
          You don't have permission to create new agencies.
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

      {isAgencyAdmin && mode === "edit" && (
        <Alert>
          <Info className="h-4 w-4" />
          <AlertDescription>
            As an Agency Admin, you can edit agency details but not membership
            type or status.
          </AlertDescription>
        </Alert>
      )}

      <div className="space-y-4">
        <div>
          <Label htmlFor="name">Agency Name</Label>
          <Input
            id="name"
            value={formData.name}
            onChange={(e) => setFormData({ ...formData, name: e.target.value })}
            required
          />
        </div>

        <div>
          <Label htmlFor="address">Address</Label>
          <Input
            id="address"
            value={formData.address}
            onChange={(e) =>
              setFormData({ ...formData, address: e.target.value })
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
            required
          />
        </div>

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

        {/* Only show these fields to Super Admins */}
        {isSuperAdmin && (
          <>
            <div>
              <Label htmlFor="membershipType">Membership Type</Label>
              <Select
                value={formData.membershipType}
                onValueChange={(value) =>
                  setFormData({ ...formData, membershipType: value })
                }
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="A1_AGENCY">A1 Agency</SelectItem>
                  <SelectItem value="A2_AGENCY">A2 Agency</SelectItem>
                  <SelectItem value="A3_AGENCY">A3 Agency</SelectItem>
                  <SelectItem value="A4_AGENCY">A4 Agency</SelectItem>
                  <SelectItem value="A5_AGENCY">A5 Agency</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div>
              <Label htmlFor="status">Status</Label>
              <Select
                value={formData.status}
                onValueChange={(value) =>
                  setFormData({ ...formData, status: value })
                }
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="ACTIVE">Active</SelectItem>
                  <SelectItem value="INACTIVE">Inactive</SelectItem>
                  <SelectItem value="SUSPENDED">Suspended</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </>
        )}

        {/* Show these fields as read-only for Agency Admins */}
        {isAgencyAdmin && mode === "edit" && (
          <>
            <div>
              <Label>Membership Type (Read-only)</Label>
              <div className="p-2 bg-gray-100 rounded-md">
                {formData.membershipType}
              </div>
            </div>

            <div>
              <Label>Status (Read-only)</Label>
              <div className="p-2 bg-gray-100 rounded-md">
                {formData.status}
              </div>
            </div>
          </>
        )}
      </div>

      <div className="flex gap-4">
        <Button type="submit" disabled={loading}>
          {loading
            ? "Saving..."
            : mode === "create"
            ? "Create Agency"
            : "Update Agency"}
        </Button>

        <Button
          type="button"
          variant="outline"
          onClick={() => router.push("/agencies")}
        >
          Cancel
        </Button>
      </div>
    </form>
  );
}
