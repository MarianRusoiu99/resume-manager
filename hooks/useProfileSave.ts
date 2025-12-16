"use client";

import { useState } from "react";
import { toast } from "sonner";
import type { Resume } from "@/lib/validations/jsonresume";
import { apiV1 } from "@/lib/client";
import { createComponentLogger } from "@/lib/utils/client-logger";

interface Profile {
  id: string;
  resume: Resume;
}

type ResumeSection = keyof Omit<Resume, "$schema" | "meta">;

const log = createComponentLogger("useProfileSave");

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
      const updatedResume = { ...profile.resume, [section]: data };
      const result = await apiV1.PROFILE.GET(profile.id).patch<Profile>({ resume: updatedResume });

      if (result.error || !result.data) {
        throw new Error(result.error ?? `Failed to save ${sectionLabels[section]}`);
      }

      const updatedProfile = result.data;
      onSuccess(updatedProfile);
      toast.success(`${sectionLabels[section]} saved successfully!`);
      return true;
    } catch (error) {
      log.error(`Error saving ${section}`, error, { section });
      toast.error(`Failed to save ${sectionLabels[section]}`);
      return false;
    } finally {
      setIsSaving(false);
    }
  };

  return { saveSection, isSaving };
}
