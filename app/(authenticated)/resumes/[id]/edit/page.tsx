"use client";

import { PageHeader } from "@/components/layout/PageHeader";
import { PageContainer } from "@/components/layout/PageContainer";
import { EditorUI } from "@/components/editor/EditorUI";
import { EditorProvider } from "@/lib/contexts/EditorContext";
import type { Resume } from "@/lib/validations/jsonresume";
import { Button } from "@/components/ui/button";
import { ArrowLeft } from "lucide-react";
import Link from "next/link";
import { useParams } from "next/navigation";

/**
 * Resume Edit Page - Uses Unified Editor Context
 * 
 * This page edits a specific generated resume (not the master profile).
 * Uses EditorProvider with resume-specific load/save callbacks.
 */
export default function ResumeEditPage() {
  const params = useParams();
  const resumeId = params.id as string;

  /**
   * Load specific resume data from API
   */
  const handleLoad = async (): Promise<Resume | null> => {
    try {
      const response = await fetch(`/api/resumes/${resumeId}`);
      
      if (!response.ok) {
        throw new Error("Failed to load resume");
      }

      const data = await response.json();
      // API returns { id, content, metadata, ... } where content is the Resume JSON
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
      const response = await fetch(`/api/resumes/${resumeId}`, {
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

  return (
    <EditorProvider onLoad={handleLoad} onSave={handleSave}>
      <PageHeader
        title="Edit Resume"
        description="Customize this resume for your specific needs"
        breadcrumbs={[
          { label: "Dashboard", href: "/dashboard" },
          { label: "Resumes", href: "/resumes" },
          { label: "Edit" },
        ]}
      />
      <PageContainer>
        <div className="mb-4">
          <Link href={`/resumes/${resumeId}`}>
            <Button variant="outline" size="sm">
              <ArrowLeft className="w-4 h-4 mr-2" />
              Back to Resume
            </Button>
          </Link>
        </div>
        
        <EditorUI />
      </PageContainer>
    </EditorProvider>
  );
}
