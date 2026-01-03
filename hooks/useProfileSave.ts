"use client";

import { useState } from "react";
import { toast } from "sonner";
import type { Resume } from "@/lib/validations/jsonresume";
import { createComponentLogger } from "@/lib/utils/client-logger";
import { updateProfile } from "@/app/actions/profile";
import { type ProfileDto } from "@/lib/actions/types";

type ResumeSection = keyof Omit<Resume, "$schema" | "meta">;

const log = createComponentLogger("useProfileSave");

export function useProfileSave() {
  const [isSaving, setIsSaving] = useState(false);

  const saveSection = async <T extends ResumeSection>(
    profile: Pick<ProfileDto, 'id' | 'resume'> | null,
    section: T,
    data: Resume[T],
    onSuccess: (updatedProfile: Pick<ProfileDto, 'id' | 'resume'>) => void
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
      const result = await updateProfile(profile.id, { resume: updatedResume as unknown as Resume });

      if (!result.success || !result.data) {
        throw new Error(result.success ? `Failed to save ${sectionLabels[section]}` : result.error);
      }

      const updatedProfile = result.data as unknown as Pick<ProfileDto, 'id' | 'resume'>;
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
