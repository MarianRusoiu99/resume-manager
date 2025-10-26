"use client";

import { useState, useEffect } from "react";
import { Input, Button } from "@/components/ui";
import { PersonalInfo } from "@/lib/validations/profile";

interface PersonalInfoFormProps {
  initialData?: PersonalInfo;
  onSave?: (data: PersonalInfo) => void;
}

export function PersonalInfoForm({ initialData, onSave }: PersonalInfoFormProps) {
  const [formData, setFormData] = useState<PersonalInfo>({
    name: initialData?.name || "",
    email: initialData?.email || "",
    phone: initialData?.phone || "",
    location: initialData?.location || "",
    linkedin: initialData?.linkedin || "",
    github: initialData?.github || "",
    website: initialData?.website || "",
  });

  const [errors, setErrors] = useState<Partial<Record<keyof PersonalInfo, string>>>({});
  const [isSaving, setIsSaving] = useState(false);

  useEffect(() => {
    if (initialData) {
      setFormData(initialData);
    }
  }, [initialData]);

  const handleChange = (field: keyof PersonalInfo, value: string) => {
    setFormData((prev) => ({ ...prev, [field]: value }));
    // Clear error for this field
    if (errors[field]) {
      setErrors((prev) => ({ ...prev, [field]: undefined }));
    }
  };

  const validateForm = (): boolean => {
    const newErrors: Partial<Record<keyof PersonalInfo, string>> = {};

    if (!formData.name.trim()) {
      newErrors.name = "Name is required";
    }

    if (!formData.email.trim()) {
      newErrors.email = "Email is required";
    } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(formData.email)) {
      newErrors.email = "Invalid email address";
    }

    if (formData.linkedin && !/^https?:\/\/.+/.test(formData.linkedin)) {
      newErrors.linkedin = "Must be a valid URL";
    }

    if (formData.github && !/^https?:\/\/.+/.test(formData.github)) {
      newErrors.github = "Must be a valid URL";
    }

    if (formData.website && !/^https?:\/\/.+/.test(formData.website)) {
      newErrors.website = "Must be a valid URL";
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!validateForm()) {
      return;
    }

    if (onSave) {
      setIsSaving(true);
      try {
        await onSave(formData);
      } finally {
        setIsSaving(false);
      }
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      <div className="grid grid-cols-1 gap-6 sm:grid-cols-2">
        <Input
          id="name"
          label="Full Name *"
          type="text"
          value={formData.name}
          onChange={(e) => handleChange("name", e.target.value)}
          error={errors.name}
          required
        />

        <Input
          id="email"
          label="Email Address *"
          type="email"
          value={formData.email}
          onChange={(e) => handleChange("email", e.target.value)}
          error={errors.email}
          required
        />

        <Input
          id="phone"
          label="Phone Number"
          type="tel"
          value={formData.phone}
          onChange={(e) => handleChange("phone", e.target.value)}
          error={errors.phone}
          helperText="Optional"
        />

        <Input
          id="location"
          label="Location"
          type="text"
          value={formData.location}
          onChange={(e) => handleChange("location", e.target.value)}
          error={errors.location}
          placeholder="City, State/Country"
          helperText="Optional"
        />

        <Input
          id="linkedin"
          label="LinkedIn URL"
          type="url"
          value={formData.linkedin}
          onChange={(e) => handleChange("linkedin", e.target.value)}
          error={errors.linkedin}
          placeholder="https://linkedin.com/in/username"
          helperText="Optional"
        />

        <Input
          id="github"
          label="GitHub URL"
          type="url"
          value={formData.github}
          onChange={(e) => handleChange("github", e.target.value)}
          error={errors.github}
          placeholder="https://github.com/username"
          helperText="Optional"
        />

        <div className="sm:col-span-2">
          <Input
            id="website"
            label="Personal Website"
            type="url"
            value={formData.website}
            onChange={(e) => handleChange("website", e.target.value)}
            error={errors.website}
            placeholder="https://yourwebsite.com"
            helperText="Optional"
          />
        </div>
      </div>

      <div className="flex justify-end">
        <Button type="submit" isLoading={isSaving}>
          Save Personal Information
        </Button>
      </div>
    </form>
  );
}
