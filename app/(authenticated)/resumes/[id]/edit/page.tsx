"use client";

import { useState, useEffect } from "react";
import { ResumeEditor } from "@/components/editor/ResumeEditor";
import { EditorProvider } from "@/lib/contexts";
import type { Resume } from "@/lib/validations/jsonresume";
import { Button } from "@/components/ui/button";
import { ArrowLeft } from "lucide-react";
import { useParams, useRouter } from "next/navigation";
import { toast } from "sonner";
import { apiFetch } from "@/lib/utils/api-client";

/**
 * Resume Edit Page - Full-screen editor like profile editor
 * 
 * This page edits a specific generated resume (not the master profile).
 * Uses EditorProvider with resume-specific load/save callbacks.
 * ResumeEditor includes the preview panel built-in.
 */
export default function ResumeEditPage() {
  const params = useParams();
  const router = useRouter();
  const resumeId = params.id as string;
  const [jobTitle, setJobTitle] = useState("");

  // Load job title from metadata
  useEffect(() => {
    const loadJobTitle = async () => {
      try {
        const response = await apiFetch(`/api/resume/${resumeId}`);
        if (response.ok) {
          const data = await response.json();
          setJobTitle(data.jobMetadata?.jobTitle || "");
        }
      } catch (error) {
        console.error("Error loading job title:", error);
      }
    };
    loadJobTitle();
  }, [resumeId]);

  /**
   * Load specific resume data from API
   */
  const handleLoad = async (): Promise<Resume | null> => {
    try {
      const response = await apiFetch(`/api/resume/${resumeId}`);
      
      if (!response.ok) {
        throw new Error("Failed to load resume");
      }

      const data = await response.json();
      return data.content as Resume;
    } catch (error) {
      console.error("Error loading resume:", error);
      return null;
    }
  };

  /**
   * Save specific resume data to API
   */
  const handleSave = async (resume: Resume): Promise<boolean> => {
    try {
      const response = await apiFetch(`/api/resume/${resumeId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ resume }),
      });

      if (!response.ok) {
        const errorData = await response.json();
        console.error("Resume save error:", errorData);
        throw new Error(errorData.error || "Failed to save resume");
      }

      return true;
    } catch (error) {
      console.error("Error saving resume:", error);
      return false;
    }
  };

  /**
   * Save job title (display name for resume context)
   */
  const handleSaveJobTitle = async (newTitle: string) => {
    try {
      const response = await apiFetch(`/api/resume/${resumeId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ 
          jobMetadata: { jobTitle: newTitle } 
        }),
      });

      if (!response.ok) {
        throw new Error("Failed to save job title");
      }

      setJobTitle(newTitle);
      toast.success("Job title updated successfully");
    } catch (error) {
      console.error("Error saving job title:", error);
      toast.error("Failed to save job title");
    }
  };

  return (
    <EditorProvider onLoad={handleLoad} onSave={handleSave}>
      <div className="h-screen flex flex-col">
        {/* Header with Back Button */}
        <div className="border-b bg-background px-6 py-3">
          <Button
            variant="ghost"
            size="sm"
            onClick={() => router.push("/resumes")}
          >
            <ArrowLeft className="h-4 w-4 mr-2" />
            Back to Resumes
          </Button>
        </div>

        {/* Editor */}
        <div className="flex-1">
          <ResumeEditor
            id={resumeId}
            displayName={jobTitle}
            onDisplayNameChange={handleSaveJobTitle}
          />
        </div>
      </div>
    </EditorProvider>
  );
}
