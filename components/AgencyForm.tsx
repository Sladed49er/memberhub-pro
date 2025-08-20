// components/AgencyForm.tsx
// Fixed version with proper TypeScript types

"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
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

interface AgencyFormData {
  name: string;
  email: string;
  phone?: string;
  address?: string;
  city?: string;
  state?: string;
  zipCode?: string;
  website?: string;
  membershipType?: string;
  status?: string;
  primaryContactFirstName?: string;
  primaryContactLastName?: string;
  primaryContactEmail?: string;
  primaryContactPhone?: string;
}

interface AgencyFormProps {
  initialData?: Partial<AgencyFormData>;
  onSubmit: (data: AgencyFormData) => void | Promise<void>;
  isLoading?: boolean;
  isEdit?: boolean;
  userRole?: string;
}

export default function AgencyForm({
  initialData = {},
  onSubmit,
  isLoading = false,
  isEdit = false,
  userRole = "SUPER_ADMIN",
}: AgencyFormProps) {
  const router = useRouter();
  const [errors, setErrors] = useState<Record<string, string>>({});

  // Initialize form data with defaults
  const [formData, setFormData] = useState<AgencyFormData>({
    name: initialData.name || "",
    email: initialData.email || "",
    phone: initialData.phone || "",
    address: initialData.address || "",
    city: initialData.city || "",
    state: initialData.state || "",
    zipCode: initialData.zipCode || "",
    website: initialData.website || "",
    membershipType: initialData.membershipType || "A1_AGENCY",
    status: initialData.status || "PENDING",
    primaryContactFirstName: initialData.primaryContactFirstName || "",
    primaryContactLastName: initialData.primaryContactLastName || "",
    primaryContactEmail: initialData.primaryContactEmail || "",
    primaryContactPhone: initialData.primaryContactPhone || "",
  });

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
    // Clear error for this field
    if (errors[name]) {
      setErrors((prev) => ({ ...prev, [name]: "" }));
    }
  };

  const handleSelectChange = (name: string, value: string) => {
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  const formatWebsite = (url: string) => {
    if (!url) return "";
    if (!url.startsWith("http://") && !url.startsWith("https://")) {
      return `https://${url}`;
    }
    return url;
  };

  const validateForm = () => {
    const newErrors: Record<string, string> = {};

    if (!formData.name.trim()) {
      newErrors.name = "Agency name is required";
    }

    if (!formData.email.trim()) {
      newErrors.email = "Email is required";
    } else if (!/\S+@\S+\.\S+/.test(formData.email)) {
      newErrors.email = "Invalid email format";
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!validateForm()) {
      return;
    }

    const dataToSubmit = {
      ...formData,
      website: formatWebsite(formData.website || ""),
    };

    await onSubmit(dataToSubmit);
  };

  // Determine if fields should be disabled based on user role
  const isAdmin = userRole === "ADMIN";
  const canEditMembershipAndStatus = userRole === "SUPER_ADMIN";

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      {/* Agency Information */}
      <div>
        <h2 className="text-lg font-semibold mb-4">Agency Information</h2>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <Label htmlFor="name">Agency Name *</Label>
            <Input
              id="name"
              name="name"
              value={formData.name}
              onChange={handleChange}
              disabled={isLoading}
              className={errors.name ? "border-red-500" : ""}
            />
            {errors.name && (
              <p className="text-red-500 text-sm mt-1">{errors.name}</p>
            )}
          </div>

          <div>
            <Label htmlFor="email">Email *</Label>
            <Input
              id="email"
              name="email"
              type="email"
              value={formData.email}
              onChange={handleChange}
              disabled={isLoading}
              className={errors.email ? "border-red-500" : ""}
            />
            {errors.email && (
              <p className="text-red-500 text-sm mt-1">{errors.email}</p>
            )}
          </div>

          <div>
            <Label htmlFor="phone">Phone</Label>
            <Input
              id="phone"
              name="phone"
              value={formData.phone}
              onChange={handleChange}
              disabled={isLoading}
            />
          </div>

          <div>
            <Label htmlFor="website">Website</Label>
            <Input
              id="website"
              name="website"
              value={formData.website}
              onChange={handleChange}
              placeholder="example.com"
              disabled={isLoading}
            />
            <p className="text-xs text-gray-500 mt-1">
              Enter domain name (e.g., example.com)
            </p>
          </div>
        </div>
      </div>

      {/* Address */}
      <div>
        <h2 className="text-lg font-semibold mb-4">Address</h2>
        <div className="space-y-4">
          <div>
            <Label htmlFor="address">Street Address</Label>
            <Input
              id="address"
              name="address"
              value={formData.address}
              onChange={handleChange}
              disabled={isLoading}
            />
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div>
              <Label htmlFor="city">City</Label>
              <Input
                id="city"
                name="city"
                value={formData.city}
                onChange={handleChange}
                disabled={isLoading}
              />
            </div>

            <div>
              <Label htmlFor="state">State</Label>
              <Input
                id="state"
                name="state"
                value={formData.state}
                onChange={handleChange}
                maxLength={2}
                placeholder="OR"
                disabled={isLoading}
              />
            </div>

            <div>
              <Label htmlFor="zipCode">ZIP Code</Label>
              <Input
                id="zipCode"
                name="zipCode"
                value={formData.zipCode}
                onChange={handleChange}
                disabled={isLoading}
              />
            </div>
          </div>
        </div>
      </div>

      {/* Primary Contact */}
      <div>
        <h2 className="text-lg font-semibold mb-4">Primary Contact</h2>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <Label htmlFor="primaryContactFirstName">First Name</Label>
            <Input
              id="primaryContactFirstName"
              name="primaryContactFirstName"
              value={formData.primaryContactFirstName}
              onChange={handleChange}
              disabled={isLoading}
            />
          </div>

          <div>
            <Label htmlFor="primaryContactLastName">Last Name</Label>
            <Input
              id="primaryContactLastName"
              name="primaryContactLastName"
              value={formData.primaryContactLastName}
              onChange={handleChange}
              disabled={isLoading}
            />
          </div>

          <div>
            <Label htmlFor="primaryContactPhone">Contact Phone</Label>
            <Input
              id="primaryContactPhone"
              name="primaryContactPhone"
              value={formData.primaryContactPhone}
              onChange={handleChange}
              disabled={isLoading}
            />
          </div>

          <div>
            <Label htmlFor="primaryContactEmail">Contact Email</Label>
            <Input
              id="primaryContactEmail"
              name="primaryContactEmail"
              type="email"
              value={formData.primaryContactEmail}
              onChange={handleChange}
              disabled={isLoading}
            />
          </div>
        </div>
      </div>

      {/* Membership & Status */}
      <div>
        <h2 className="text-lg font-semibold mb-4">Membership & Status</h2>
        {isAdmin && isEdit && (
          <div className="bg-blue-50 border border-blue-200 rounded-lg p-3 mb-4">
            <p className="text-blue-800 text-sm">
              As an Agency Admin, you can edit agency details but cannot change
              membership type or status.
            </p>
          </div>
        )}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <Label htmlFor="membershipType">Membership Type</Label>
            <Select
              value={formData.membershipType}
              onValueChange={(value) =>
                handleSelectChange("membershipType", value)
              }
              disabled={isLoading || !canEditMembershipAndStatus}
            >
              <SelectTrigger>
                <SelectValue placeholder="Select membership type" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="A1_AGENCY">A1 Agency</SelectItem>
                <SelectItem value="A2_BRANCH">A2 Branch</SelectItem>
                <SelectItem value="A3_ASSOCIATE">A3 Associate</SelectItem>
                <SelectItem value="STERLING_PARTNER">
                  Sterling Partner
                </SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div>
            <Label htmlFor="status">Status</Label>
            <Select
              value={formData.status}
              onValueChange={(value) => handleSelectChange("status", value)}
              disabled={isLoading || !canEditMembershipAndStatus}
            >
              <SelectTrigger>
                <SelectValue placeholder="Select status" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="ACTIVE">Active</SelectItem>
                <SelectItem value="INACTIVE">Inactive</SelectItem>
                <SelectItem value="PENDING">Pending</SelectItem>
                <SelectItem value="SUSPENDED">Suspended</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </div>
      </div>

      {/* Form Actions */}
      <div className="flex justify-end space-x-4 pt-4">
        <Button
          type="button"
          variant="outline"
          onClick={() => router.back()}
          disabled={isLoading}
        >
          Cancel
        </Button>
        <Button
          type="submit"
          disabled={isLoading}
          className="bg-gradient-to-r from-purple-600 to-pink-600 text-white"
        >
          {isLoading ? "Saving..." : isEdit ? "Update Agency" : "Create Agency"}
        </Button>
      </div>
    </form>
  );
}
