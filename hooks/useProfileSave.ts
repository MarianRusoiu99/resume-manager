"use client";

import { useState } from "react";
import { toast } from "sonner";
import type { Resume } from "@/lib/validations/jsonresume";
import { apiFetch } from "@/lib/utils/api-client";
import { API_V1 } from "@/lib/constants";
import { parseApiJson, readApiErrorMessage } from "@/lib/utils/api-response";

interface Profile {
  userId: string;
  resume: Resume;
}

type ResumeSection = keyof Omit<Resume, "$schema" | "meta">;

export function useProfileSave() {
  const [isSaving, setIsSaving] = useState(false);

  const saveSection = async <T extends ResumeSection>(
    profile: Profile | null,
    section: T,
    data: Resume[T],
    onSuccess: (updatedProfile: Profile) => void
  ): Promise<boolean> => {
    if (!profile) return false;

    const sectionLabels: Record<ResumeSection, string> = {
      basics: "Personal Information",
      work: "Work Experience",
      volunteer: "Volunteer Experience",
      education: "Education",
      awards: "Awards",
      certificates: "Certifications",
      publications: "Publications",
      skills: "Skills",
      languages: "Languages",
      interests: "Interests",
      references: "References",
      projects: "Projects",
    };

    setIsSaving(true);

    try {
      const response = await apiFetch(API_V1.PROFILE.LIST, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          resume: { ...profile.resume, [section]: data },
        }),
      });

      if (!response.ok) {
        throw new Error(await readApiErrorMessage(response, `Failed to save ${sectionLabels[section]}`));
      }

      const updatedProfile = await parseApiJson<Profile>(response);
      onSuccess(updatedProfile);
      toast.success(`${sectionLabels[section]} saved successfully!`);
      return true;
    } catch (error) {
      console.error(`Error saving ${section}:`, error);
      toast.error(`Failed to save ${sectionLabels[section]}`);
      return false;
    } finally {
      setIsSaving(false);
    }
  };

  return { saveSection, isSaving };
}
