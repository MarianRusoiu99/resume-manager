"use client";

import { useState, useEffect } from "react";
import { PageHeader } from "@/components/layout/PageHeader";
import { PageContainer } from "@/components/layout/PageContainer";
import { EditorUI } from "@/components/editor/EditorUI";
import { EditorProvider } from "@/lib/contexts/EditorContext";
import { UnifiedResumePreview } from "@/components/resume/UnifiedResumePreview";
import type { Resume } from "@/lib/validations/jsonresume";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { ArrowLeft, Save } from "lucide-react";
import Link from "next/link";
import { useParams } from "next/navigation";
import { toast } from "sonner";

/**
 * Resume Edit Page - Uses Unified Editor Context with Preview
 * 
 * This page edits a specific generated resume (not the master profile).
 * Uses EditorProvider with resume-specific load/save callbacks.
 * Shows live preview alongside the editor.
 */
export default function ResumeEditPage() {
  const params = useParams();
  const resumeId = params.id as string;
  const [jobTitle, setJobTitle] = useState("");
  const [isSavingJobTitle, setIsSavingJobTitle] = useState(false);
  const [previewKey, setPreviewKey] = useState(0);
  const [resumeData, setResumeData] = useState<Resume | null>(null);

  // Load job title from metadata
  useEffect(() => {
    const loadJobTitle = async () => {
      try {
        const response = await fetch(`/api/resumes/${resumeId}`);
        if (response.ok) {
          const data = await response.json();
          setJobTitle(data.jobMetadata?.jobTitle || "");
          setResumeData(data.content as Resume);
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

      // Trigger preview refresh
      setPreviewKey(prev => prev + 1);

      return true;
    } catch (error) {
      console.error("Error saving resume:", error);
      return false;
    }
  };

  /**
   * Save job title separately
   */
  const handleSaveJobTitle = async () => {
    setIsSavingJobTitle(true);
    try {
      const response = await fetch(`/api/resumes/${resumeId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ 
          jobMetadata: { jobTitle } 
        }),
      });

      if (!response.ok) {
        throw new Error("Failed to save job title");
      }

      toast("Job title updated successfully");
    } catch (error) {
      console.error("Error saving job title:", error);
      toast("Failed to save job title");
    } finally {
      setIsSavingJobTitle(false);
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
        <div className="mb-4 flex items-center gap-4">
          <Link href={`/resumes/${resumeId}`}>
            <Button variant="outline" size="sm">
              <ArrowLeft className="w-4 h-4 mr-2" />
              Back to Resume
            </Button>
          </Link>
        </div>

        {/* Job Title Editor */}
        <Card className="mb-6">
          <CardHeader>
            <CardTitle>Job Title</CardTitle>
            <CardDescription>Update the target job title for this resume</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="flex gap-2">
              <Input
                value={jobTitle}
                onChange={(e) => setJobTitle(e.target.value)}
                placeholder="e.g., Senior Software Engineer"
                className="flex-1"
              />
              <Button 
                onClick={handleSaveJobTitle} 
                disabled={isSavingJobTitle || !jobTitle.trim()}
              >
                <Save className="w-4 h-4 mr-2" />
                Save
              </Button>
            </div>
          </CardContent>
        </Card>

        {/* Split View: Editor + Preview */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Editor Section */}
          <div>
            <EditorUI />
          </div>

          {/* Preview Section */}
          <div className="lg:sticky lg:top-4 lg:h-[calc(100vh-8rem)] lg:overflow-y-auto">
            {resumeData && (
              <UnifiedResumePreview
                resumeData={resumeData}
                resumeId={resumeId}
                showCard={true}
                showTemplateSelector={true}
                previewKey={previewKey}
              />
            )}
          </div>
        </div>
      </PageContainer>
    </EditorProvider>
  );
}
