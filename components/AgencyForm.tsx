// components/AgencyForm.tsx
"use client";

import { useState } from "react";
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

  // Parse existing contact name if editing
  const existingContactParts = agency?.primaryContactName?.split(" ") || [];
  const existingFirstName = existingContactParts[0] || "";
  const existingLastName = existingContactParts.slice(1).join(" ") || "";

  const [formData, setFormData] = useState({
    name: agency?.name || "",
    email: agency?.email || "",
    phone: agency?.phone || "",
    address: agency?.address || "",
    city: agency?.city || "",
    state: agency?.state || "",
    zipCode: agency?.zipCode || "",
    website: agency?.website || "",
    primaryContactFirstName: existingFirstName,
    primaryContactLastName: existingLastName,
    primaryContactEmail: agency?.primaryContactEmail || "",
    primaryContactPhone: agency?.primaryContactPhone || "",
    membershipType: agency?.membershipType || "A1_AGENCY",
    status: agency?.status || "PENDING",
  });

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  // Agency Admins can only edit certain fields
  const isAgencyAdmin = userRole === "AGENCY_ADMIN" || userRole === "ADMIN";
  const isSuperAdmin = userRole === "SUPER_ADMIN";

  // Format website URL
  const formatWebsiteUrl = (url: string) => {
    if (!url) return "";

    // Remove any whitespace
    url = url.trim();

    // If it doesn't start with http:// or https://, add https://
    if (!url.match(/^https?:\/\//)) {
      return `https://${url}`;
    }

    return url;
  };

  const handleWebsiteChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setFormData({ ...formData, website: e.target.value });
  };

  const handleWebsiteBlur = () => {
    // Format the URL when user leaves the field
    if (formData.website) {
      setFormData({ ...formData, website: formatWebsiteUrl(formData.website) });
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError("");

    try {
      // Combine first and last name for primaryContactName
      const primaryContactName =
        formData.primaryContactFirstName && formData.primaryContactLastName
          ? `${formData.primaryContactFirstName} ${formData.primaryContactLastName}`.trim()
          : formData.primaryContactFirstName ||
            formData.primaryContactLastName ||
            "";

      // Format website URL before sending
      const formattedWebsite = formatWebsiteUrl(formData.website);

      // For Agency Admins, only send editable fields
      const dataToSend =
        isAgencyAdmin && mode === "edit"
          ? {
              name: formData.name,
              email: formData.email,
              phone: formData.phone || null,
              address: formData.address || null,
              city: formData.city || null,
              state: formData.state || null,
              zipCode: formData.zipCode || null,
              website: formattedWebsite || null,
              primaryContactName: primaryContactName || null,
              primaryContactEmail: formData.primaryContactEmail || null,
              primaryContactPhone: formData.primaryContactPhone || null,
              // Explicitly exclude membershipType and status for Agency Admins
            }
          : {
              name: formData.name,
              email: formData.email,
              phone: formData.phone || null,
              address: formData.address || null,
              city: formData.city || null,
              state: formData.state || null,
              zipCode: formData.zipCode || null,
              website: formattedWebsite || null,
              primaryContactName: primaryContactName || null,
              primaryContactEmail: formData.primaryContactEmail || null,
              primaryContactPhone: formData.primaryContactPhone || null,
              membershipType: formData.membershipType,
              status: formData.status,
            };

      const url =
        mode === "create" ? "/api/agencies" : `/api/agencies/${agency.id}`;

      const method = mode === "create" ? "POST" : "PUT";

      console.log("Sending data:", dataToSend); // Debug log

      const response = await fetch(url, {
        method,
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(dataToSend),
      });

      const responseData = await response.json();

      if (!response.ok) {
        throw new Error(responseData.error || "Failed to save agency");
      }

      router.push("/agencies");
      router.refresh();
    } catch (err: any) {
      console.error("Error saving agency:", err); // Debug log
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
    <form onSubmit={handleSubmit} className="space-y-6">
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

      {/* Agency Information */}
      <div className="space-y-4">
        <h3 className="text-lg font-semibold">Agency Information</h3>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <Label htmlFor="name">Agency Name *</Label>
            <Input
              id="name"
              value={formData.name}
              onChange={(e) =>
                setFormData({ ...formData, name: e.target.value })
              }
              required
              placeholder="Agency Name"
            />
          </div>

          <div>
            <Label htmlFor="email">Email *</Label>
            <Input
              id="email"
              type="email"
              value={formData.email}
              onChange={(e) =>
                setFormData({ ...formData, email: e.target.value })
              }
              required
              placeholder="agency@example.com"
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
              placeholder="(555) 123-4567"
            />
          </div>

          <div>
            <Label htmlFor="website">Website</Label>
            <Input
              id="website"
              value={formData.website}
              onChange={handleWebsiteChange}
              onBlur={handleWebsiteBlur}
              placeholder="example.com or https://example.com"
            />
            <p className="text-xs text-gray-500 mt-1">
              Enter domain name (e.g., example.com)
            </p>
          </div>
        </div>
      </div>

      {/* Address Information */}
      <div className="space-y-4">
        <h3 className="text-lg font-semibold">Address</h3>

        <div>
          <Label htmlFor="address">Street Address</Label>
          <Input
            id="address"
            value={formData.address}
            onChange={(e) =>
              setFormData({ ...formData, address: e.target.value })
            }
            placeholder="123 Main Street"
          />
        </div>

        <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
          <div>
            <Label htmlFor="city">City</Label>
            <Input
              id="city"
              value={formData.city}
              onChange={(e) =>
                setFormData({ ...formData, city: e.target.value })
              }
              placeholder="Portland"
            />
          </div>

          <div>
            <Label htmlFor="state">State</Label>
            <Input
              id="state"
              value={formData.state}
              onChange={(e) =>
                setFormData({
                  ...formData,
                  state: e.target.value.toUpperCase(),
                })
              }
              placeholder="OR"
              maxLength={2}
            />
          </div>

          <div>
            <Label htmlFor="zipCode">ZIP Code</Label>
            <Input
              id="zipCode"
              value={formData.zipCode}
              onChange={(e) =>
                setFormData({ ...formData, zipCode: e.target.value })
              }
              placeholder="97201"
              maxLength={10}
            />
          </div>
        </div>
      </div>

      {/* Primary Contact */}
      <div className="space-y-4">
        <h3 className="text-lg font-semibold">Primary Contact</h3>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <Label htmlFor="primaryContactFirstName">First Name</Label>
            <Input
              id="primaryContactFirstName"
              value={formData.primaryContactFirstName}
              onChange={(e) =>
                setFormData({
                  ...formData,
                  primaryContactFirstName: e.target.value,
                })
              }
              placeholder="John"
            />
          </div>

          <div>
            <Label htmlFor="primaryContactLastName">Last Name</Label>
            <Input
              id="primaryContactLastName"
              value={formData.primaryContactLastName}
              onChange={(e) =>
                setFormData({
                  ...formData,
                  primaryContactLastName: e.target.value,
                })
              }
              placeholder="Doe"
            />
          </div>

          <div>
            <Label htmlFor="primaryContactPhone">Contact Phone</Label>
            <Input
              id="primaryContactPhone"
              type="tel"
              value={formData.primaryContactPhone}
              onChange={(e) =>
                setFormData({
                  ...formData,
                  primaryContactPhone: e.target.value,
                })
              }
              placeholder="(555) 123-4567"
            />
          </div>

          <div>
            <Label htmlFor="primaryContactEmail">Contact Email</Label>
            <Input
              id="primaryContactEmail"
              type="email"
              value={formData.primaryContactEmail}
              onChange={(e) =>
                setFormData({
                  ...formData,
                  primaryContactEmail: e.target.value,
                })
              }
              placeholder="john.doe@example.com"
            />
          </div>
        </div>
      </div>

      {/* Membership and Status - Only for Super Admins or read-only for Agency Admins */}
      <div className="space-y-4">
        <h3 className="text-lg font-semibold">Membership & Status</h3>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {isSuperAdmin ? (
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
                    <SelectItem value="PENDING">Pending</SelectItem>
                    <SelectItem value="SUSPENDED">Suspended</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </>
          ) : isAgencyAdmin && mode === "edit" ? (
            <>
              <div>
                <Label>Membership Type (Read-only)</Label>
                <div className="p-2 bg-gray-100 rounded-md border">
                  {formData.membershipType.replace("_", " ")}
                </div>
              </div>

              <div>
                <Label>Status (Read-only)</Label>
                <div className="p-2 bg-gray-100 rounded-md border">
                  {formData.status}
                </div>
              </div>
            </>
          ) : null}
        </div>
      </div>

      <div className="flex gap-4 pt-4">
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
