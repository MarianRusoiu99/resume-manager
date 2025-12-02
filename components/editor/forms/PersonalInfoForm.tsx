"use client";

import { useEffect, useRef } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
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
import { Basics } from "@/lib/validations/jsonresume";

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
  initialData?: Basics;
  onChange?: (data: Basics) => void;
}

// Helper function to convert JSON Resume basics to form data
function basicsToFormData(basics?: Basics): PersonalInfoFormData {
  const linkedinProfile = basics?.profiles?.filter(p => p).find(p => p!.network?.toLowerCase() === 'linkedin');
  const githubProfile = basics?.profiles?.filter(p => p).find(p => p!.network?.toLowerCase() === 'github');

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
function formDataToBasics(formData: PersonalInfoFormData): Basics {
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
  onChange,
}: PersonalInfoFormProps) {
  const prevInitialDataRef = useRef<string>("");

  const form = useForm<PersonalInfoFormData>({
    resolver: zodResolver(personalInfoFormSchema),
    defaultValues: basicsToFormData(initialData),
    mode: "onChange",
  });

  // Reset form when initialData changes (using JSON comparison to avoid unnecessary resets)
  useEffect(() => {
    const currentDataStr = JSON.stringify(initialData);
    if (initialData && currentDataStr !== prevInitialDataRef.current) {
      prevInitialDataRef.current = currentDataStr;
      form.reset(basicsToFormData(initialData));
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [initialData]);

  // Watch for changes and propagate to parent
  useEffect(() => {
    const subscription = form.watch((value) => {
      if (onChange) {
        // Debounce could be added here if needed, but for text inputs, 
        // the parent context usually handles debouncing or we can add a small delay.
        // For now, let's use a small timeout to avoid too many updates
        const timeoutId = setTimeout(() => {
          // Validate before sending? Or send partial data?
          // Usually we want to send data even if invalid so user doesn't lose it,
          // but for strict types we might want to validate.
          // schema transform trim() might need to be handled carefully.

          // We cast value to PersonalInfoFormData because watch returns Partial<T>
          const data = value as PersonalInfoFormData;
          const basicsData = formDataToBasics(data);
          onChange(basicsData);
        }, 500);
        return () => clearTimeout(timeoutId);
      }
    });
    return () => subscription.unsubscribe();
  }, [form, onChange]);

  return (
    <Form {...form}>
      <form className="space-y-6">
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
      </form>
    </Form>
  );
}
