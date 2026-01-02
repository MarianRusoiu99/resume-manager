"use client";

import * as z from "zod";
import { Input } from "@/components/ui/input";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { useAutoSaveForm } from "@/hooks/useAutoSaveForm";
import { Basics } from "@/lib/validations/jsonresume";

// Temporary form schema that bridges the gap between old UI and JSON Resume
const personalInfoFormSchema = z.object({
  name: z
    .string()
    .min(1, "Name is required")
    .transform((val) => val.trim()),
  label: z.string().optional(),
  image: z.string().optional(),
  email: z
    .string()
    .email("Invalid email address")
    .transform((val) => val.trim()),
  phone: z.string().optional(),
  locationAddress: z.string().optional(),
  locationPostalCode: z.string().optional(),
  locationCity: z.string().optional(),
  locationCountryCode: z.string().optional(),
  locationRegion: z.string().optional(),
  url: z.string().optional(),
  linkedin: z.string().optional(),
  github: z.string().optional(),
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
    label: basics?.label || "",
    image: basics?.image || "",
    email: basics?.email || "",
    phone: basics?.phone || "",
    locationAddress: basics?.location?.address || "",
    locationPostalCode: basics?.location?.postalCode || "",
    locationCity: basics?.location?.city || "",
    locationCountryCode: basics?.location?.countryCode || "",
    locationRegion: basics?.location?.region || "",
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
    label: formData.label,
    image: formData.image,
    email: formData.email,
    phone: formData.phone,
    url: formData.url,
    location: {
      address: formData.locationAddress,
      postalCode: formData.locationPostalCode,
      city: formData.locationCity,
      countryCode: formData.locationCountryCode,
      region: formData.locationRegion,
    },
    profiles: profiles.length > 0 ? profiles : undefined,
  };
}

export function PersonalInfoForm({
  initialData,
  onChange,
}: PersonalInfoFormProps) {
  const form = useAutoSaveForm<PersonalInfoFormData>({
    schema: personalInfoFormSchema,
    defaultValues: basicsToFormData(initialData),
    onSave: (data) => {
      if (onChange) {
        onChange(formDataToBasics(data));
      }
    },
    mode: "onChange",
  });

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
            name="label"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Professional Label</FormLabel>
                <FormControl>
                  <Input placeholder="e.g. Full Stack Developer" {...field} />
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
                <FormMessage />
              </FormItem>
            )}
          />

          <FormField
            control={form.control}
            name="image"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Profile Image URL</FormLabel>
                <FormControl>
                  <Input type="url" placeholder="https://..." {...field} />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />

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
                <FormMessage />
              </FormItem>
            )}
          />

          <div className="sm:col-span-2 grid grid-cols-1 gap-6 sm:grid-cols-3 border-t pt-6">
            <h4 className="sm:col-span-3 font-medium">Location</h4>
            <FormField
              control={form.control}
              name="locationAddress"
              render={({ field }) => (
                <FormItem className="sm:col-span-2">
                  <FormLabel>Address</FormLabel>
                  <FormControl>
                    <Input placeholder="123 Street Name" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="locationPostalCode"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Postal Code</FormLabel>
                  <FormControl>
                    <Input {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="locationCity"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>City</FormLabel>
                  <FormControl>
                    <Input {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="locationRegion"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Region / State</FormLabel>
                  <FormControl>
                    <Input {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="locationCountryCode"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Country Code</FormLabel>
                  <FormControl>
                    <Input placeholder="e.g. US, GB" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
          </div>

          <div className="sm:col-span-2 grid grid-cols-1 gap-6 sm:grid-cols-2 border-t pt-6">
            <h4 className="sm:col-span-2 font-medium">Social Profiles</h4>
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
