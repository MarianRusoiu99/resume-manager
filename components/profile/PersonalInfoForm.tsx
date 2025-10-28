"use client";

import { useState, useEffect } from "react";
import { Input, Button } from "@/components/ui";
import { PersonalInfo } from "@/lib/validations/profile";
import { useAutoSave } from "@/lib/hooks/useAutoSave";

interface PersonalInfoFormProps {
  initialData?: PersonalInfo;
  onSave?: (data: PersonalInfo) => void;
  autoSave?: boolean; // Enable auto-save (default: true)
}

export function PersonalInfoForm({ initialData, onSave, autoSave = true }: PersonalInfoFormProps) {
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

  const saveData = async (data: PersonalInfo) => {
    // Only auto-save if data is valid
    if (!validateForm()) {
      return;
    }

    if (onSave) {
      setIsSaving(true);
      try {
        await onSave(data);
      } finally {
        setIsSaving(false);
      }
    }
  };

  // Auto-save hook - saves after 2 seconds of no changes
  useAutoSave({
    data: formData,
    onSave: saveData,
    delay: 2000,
    enabled: autoSave && !!onSave,
  });

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

      <div className="flex justify-between items-center">
        {autoSave && (
          <div className="text-sm text-gray-600">
            {isSaving ? (
              <span className="flex items-center">
                <svg className="animate-spin h-4 w-4 mr-2" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                </svg>
                Saving...
              </span>
            ) : (
              <span className="text-green-600">✓ Auto-save enabled</span>
            )}
          </div>
        )}
        <Button type="submit" isLoading={isSaving}>
          Save Personal Information
        </Button>
      </div>
    </form>
  );
}
