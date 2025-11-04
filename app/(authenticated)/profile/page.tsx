"use client";

import { PageHeader } from "@/components/layout/PageHeader";
import { PageContainer } from "@/components/layout/PageContainer";
import { ResumeParser } from "@/components/editor/forms/ResumeParser";
import { EditorProvider } from "@/lib/contexts/EditorContext";
import { EditorUI } from "@/components/editor/EditorUI";
import type { Resume } from "@/lib/validations/jsonresume";

/**
 * Unified Profile Page
 * 
 * Uses the unified EditorContext with profile-specific load/save callbacks.
 * Displays resume parser and completion tracking.
 */
export default function ProfilePage() {
  /**
   * Load profile data from API
   */
  const handleLoad = async (): Promise<Resume | null> => {
    try {
      const response = await fetch("/api/profile");
      
      if (response.status === 200) {
        const data = await response.json();
        return data.resume;
      } else if (response.status === 404 || response.status === 400) {
        // Profile doesn't exist yet - return null to use empty resume
        return null;
      }
      
      throw new Error("Failed to load profile");
    } catch (error) {
      console.error("Error loading profile:", error);
      return null;
    }
  };

  /**
   * Save profile data to API
   */
  const handleSave = async (resume: Resume): Promise<boolean> => {
    try {
      const response = await fetch("/api/profile", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ resume }),
      });

      if (!response.ok) {
        const errorData = await response.json();
        console.error("Profile save error:", errorData);
        throw new Error(errorData.error || "Failed to save profile");
      }

      return true;
    } catch (error) {
      console.error("Error saving profile:", error);
      return false;
    }
  };

  return (
    <EditorProvider onLoad={handleLoad} onSave={handleSave}>
      <PageHeader
        title="Professional Profile"
        description="Build your professional profile to generate optimized resumes"
        breadcrumbs={[
          { label: "Dashboard", href: "/dashboard" },
          { label: "Profile" },
        ]}
      />
      <PageContainer>
        <EditorUI
          showParser
          parserComponent={<ResumeParser />}
        />
      </PageContainer>
    </EditorProvider>
  );
}
