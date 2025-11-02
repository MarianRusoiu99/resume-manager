"use client";

import { useEffect, useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Form,
  FormControl,
  FormDescription,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { PersonalInfo } from "@/lib/validations/profile";
import { useAutoSave } from "@/lib/hooks/useAutoSave";

// Temporary form schema that bridges the gap between old UI and JSON Resume
const personalInfoFormSchema = z.object({
  name: z
    .string()
    .min(1, "Name is required")
    .transform((val) => val.trim()),
  email: z
    .string()
    .email("Invalid email address")
    .transform((val) => val.trim()),
  phone: z.string().optional(),
  locationCity: z.string().optional(),
  url: z
    .string()
    .optional()
    .refine(
      (val) => !val || /^https?:\/\/.+/.test(val),
      "Must be a valid URL"
    ),
  linkedin: z
    .string()
    .optional()
    .refine(
      (val) => !val || /^https?:\/\/.+/.test(val),
      "Must be a valid URL"
    ),
  github: z
    .string()
    .optional()
    .refine(
      (val) => !val || /^https?:\/\/.+/.test(val),
      "Must be a valid URL"
    ),
});

type PersonalInfoFormData = z.infer<typeof personalInfoFormSchema>;

interface PersonalInfoFormProps {
  initialData?: PersonalInfo;
  onSave?: (data: PersonalInfo) => void;
  autoSave?: boolean;
}

// Helper function to convert JSON Resume basics to form data
function basicsToFormData(basics?: PersonalInfo): PersonalInfoFormData {
  const linkedinProfile = basics?.profiles?.find(p => p.network?.toLowerCase() === 'linkedin');
  const githubProfile = basics?.profiles?.find(p => p.network?.toLowerCase() === 'github');
  
  return {
    name: basics?.name || "",
    email: basics?.email || "",
    phone: basics?.phone || "",
    locationCity: basics?.location?.city || "",
    url: basics?.url || "",
    linkedin: linkedinProfile?.url || "",
    github: githubProfile?.url || "",
  };
}

// Helper function to convert form data to JSON Resume basics
function formDataToBasics(formData: PersonalInfoFormData): PersonalInfo {
  const profiles = [];
  
  if (formData.linkedin) {
    profiles.push({
      network: "LinkedIn",
      url: formData.linkedin,
    });
  }
  
  if (formData.github) {
    profiles.push({
      network: "GitHub",
      url: formData.github,
    });
  }
  
  return {
    name: formData.name,
    email: formData.email,
    phone: formData.phone,
    url: formData.url,
    location: formData.locationCity ? {
      city: formData.locationCity,
    } : undefined,
    profiles: profiles.length > 0 ? profiles : undefined,
  };
}

export function PersonalInfoForm({
  initialData,
  onSave,
  autoSave = true,
}: PersonalInfoFormProps) {
  const [isSaving, setIsSaving] = useState(false);

  const form = useForm<PersonalInfoFormData>({
    resolver: zodResolver(personalInfoFormSchema),
    defaultValues: basicsToFormData(initialData),
  });

  // Reset form when initialData changes
  useEffect(() => {
    if (initialData) {
      form.reset(basicsToFormData(initialData));
    }
  }, [initialData, form]);

  const saveData = async (data: PersonalInfoFormData) => {
    const isValid = await form.trigger();
    if (!isValid || !onSave) return;

    setIsSaving(true);
    try {
      const basicsData = formDataToBasics(data);
      await onSave(basicsData);
    } finally {
      setIsSaving(false);
    }
  };

  // Auto-save hook - saves after 2 seconds of no changes
  useAutoSave({
    data: form.watch(),
    onSave: saveData,
    delay: 2000,
    enabled: autoSave && !!onSave,
  });

  const onSubmit = async (data: PersonalInfoFormData) => {
    if (!onSave) return;

    setIsSaving(true);
    try {
      const basicsData = formDataToBasics(data);
      await onSave(basicsData);
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
        <div className="grid grid-cols-1 gap-6 sm:grid-cols-2">
          <FormField
            control={form.control}
            name="name"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Full Name *</FormLabel>
                <FormControl>
                  <Input {...field} />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />

          <FormField
            control={form.control}
            name="email"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Email Address *</FormLabel>
                <FormControl>
                  <Input type="email" {...field} />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />

          <FormField
            control={form.control}
            name="phone"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Phone Number</FormLabel>
                <FormControl>
                  <Input type="tel" {...field} />
                </FormControl>
                <FormDescription>Optional</FormDescription>
                <FormMessage />
              </FormItem>
            )}
          />

          <FormField
            control={form.control}
            name="locationCity"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Location</FormLabel>
                <FormControl>
                  <Input placeholder="City, State/Country" {...field} />
                </FormControl>
                <FormDescription>Optional</FormDescription>
                <FormMessage />
              </FormItem>
            )}
          />

          <FormField
            control={form.control}
            name="linkedin"
            render={({ field }) => (
              <FormItem>
                <FormLabel>LinkedIn URL</FormLabel>
                <FormControl>
                  <Input
                    type="url"
                    placeholder="https://linkedin.com/in/username"
                    {...field}
                  />
                </FormControl>
                <FormDescription>Optional</FormDescription>
                <FormMessage />
              </FormItem>
            )}
          />

          <FormField
            control={form.control}
            name="github"
            render={({ field }) => (
              <FormItem>
                <FormLabel>GitHub URL</FormLabel>
                <FormControl>
                  <Input
                    type="url"
                    placeholder="https://github.com/username"
                    {...field}
                  />
                </FormControl>
                <FormDescription>Optional</FormDescription>
                <FormMessage />
              </FormItem>
            )}
          />

          <div className="sm:col-span-2">
            <FormField
              control={form.control}
              name="url"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Personal Website</FormLabel>
                  <FormControl>
                    <Input
                      type="url"
                      placeholder="https://yourwebsite.com"
                      {...field}
                    />
                  </FormControl>
                  <FormDescription>Optional</FormDescription>
                  <FormMessage />
                </FormItem>
              )}
            />
          </div>
        </div>

        <div className="flex justify-between items-center">
          {autoSave && (
            <div className="text-sm text-muted-foreground">
              {isSaving ? (
                <span className="flex items-center">
                  <svg
                    className="animate-spin h-4 w-4 mr-2"
                    xmlns="http://www.w3.org/2000/svg"
                    fill="none"
                    viewBox="0 0 24 24"
                  >
                    <circle
                      className="opacity-25"
                      cx="12"
                      cy="12"
                      r="10"
                      stroke="currentColor"
                      strokeWidth="4"
                    ></circle>
                    <path
                      className="opacity-75"
                      fill="currentColor"
                      d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
                    ></path>
                  </svg>
                  Saving...
                </span>
              ) : (
                <span className="text-green-600">✓ Auto-save enabled</span>
              )}
            </div>
          )}
          <Button type="submit" disabled={isSaving}>
            {isSaving ? "Saving..." : "Save Personal Information"}
          </Button>
        </div>
      </form>
    </Form>
  );
}
