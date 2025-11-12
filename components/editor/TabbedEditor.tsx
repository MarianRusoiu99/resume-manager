"use client";

import { useState, useEffect } from "react";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Button, Input } from "@/components/ui";
import { 
  Eye, 
  FileDown, 
  Save, 
  User, 
  Briefcase, 
  GraduationCap, 
  Code, 
  FolderOpen,
  Award,
  Languages,
  BookOpen,
  Heart,
  Users,
  HandHeart,
  Share2,
  Edit2,
  Check,
  X,
  Copy
} from "lucide-react";
import { useEditor } from "@/lib/contexts/EditorContext";
import { PersonalInfoForm } from "@/components/editor/forms/PersonalInfoForm";
import { SummaryForm } from "@/components/editor/forms/SummaryForm";
import { ExperienceForm } from "@/components/editor/forms/ExperienceForm";
import { EducationForm } from "@/components/editor/forms/EducationForm";
import SkillsForm from "@/components/editor/forms/SkillsForm";
import CertificationsForm from "@/components/editor/forms/CertificationsForm";
import LanguagesForm from "@/components/editor/forms/LanguagesForm";
import { ProjectsForm } from "@/components/editor/forms/ProjectsForm";
import { VolunteerForm } from "@/components/editor/forms/VolunteerForm";
import { AwardsForm } from "@/components/editor/forms/AwardsForm";
import { PublicationsForm } from "@/components/editor/forms/PublicationsForm";
import { InterestsForm } from "@/components/editor/forms/InterestsForm";
import { ReferencesForm } from "@/components/editor/forms/ReferencesForm";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { PreviewTemplateSelector } from "@/components/templates/PreviewTemplateSelector";
import { useTemplatePreview } from "@/lib/hooks/useTemplatePreview";
import { toast } from "sonner";
import type { Basics, Skill, Certificate, Language } from "@/lib/validations/jsonresume";
import { UnifiedResumePreview } from "../resume/UnifiedResumePreview";

interface TabbedEditorProps {
  readonly profileId?: string;
  readonly profileName?: string;
  readonly isPublic?: boolean;
  readonly publicSlug?: string;
  readonly onProfileNameChange?: (name: string) => Promise<void>;
  readonly onTogglePublic?: () => Promise<void>;
}

export function TabbedEditor({ 
  profileId, 
  profileName: initialProfileName, 
  isPublic: initialIsPublic,
  publicSlug: initialPublicSlug,
  onProfileNameChange,
  onTogglePublic
}: TabbedEditorProps) {
  const { resume, updateField, save, isDirty } = useEditor();
  const [activeTab, setActiveTab] = useState("basics");
  const [showPreview, setShowPreview] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [isEditingName, setIsEditingName] = useState(false);
  const [profileName, setProfileName] = useState(initialProfileName || "");
  const [showShareDialog, setShowShareDialog] = useState(false);
  const [isPublic, setIsPublic] = useState(initialIsPublic || false);
  const [publicSlug, setPublicSlug] = useState(initialPublicSlug || "");
  const [isExportingPDF, setIsExportingPDF] = useState(false);
  const [selectedTemplateId, setSelectedTemplateId] = useState<string | null>(null);

  // Hook for template preview rendering
  const { htmlContent, isLoading: isLoadingTemplate, error: templateError } = useTemplatePreview({
    templateId: selectedTemplateId,
    resumeData: resume,
  });

  useEffect(() => {
    if (initialProfileName) setProfileName(initialProfileName);
  }, [initialProfileName]);

  useEffect(() => {
    if (initialIsPublic !== undefined) setIsPublic(initialIsPublic);
  }, [initialIsPublic]);

  useEffect(() => {
    if (initialPublicSlug) setPublicSlug(initialPublicSlug);
  }, [initialPublicSlug]);

  const handleSave = async () => {
    setIsSaving(true);
    try {
      const success = await save();
      if (success) {
        toast.success("Profile saved successfully");
      } else {
        toast.error("Failed to save profile");
      }
    } finally {
      setIsSaving(false);
    }
  };

  const handlePersonalInfoSave = async (data?: Basics) => {
    if (!data) return;
    updateField('basics', data);
  };

  const handleSkillsChange = (skills: Skill[]) => {
    updateField('skills', skills);
  };

  const handleCertificationsChange = (certificates: Certificate[]) => {
    updateField('certificates', certificates);
  };

  const handleLanguagesChange = (languages: Language[]) => {
    updateField('languages', languages);
  };

  const handleSaveProfileName = async () => {
    if (!profileName.trim()) {
      toast.error("Profile name cannot be empty");
      return;
    }
    
    if (onProfileNameChange) {
      await onProfileNameChange(profileName);
      setIsEditingName(false);
    }
  };

  const handleExportPDF = async () => {
    if (!profileId) {
      toast.error("Profile ID is required for PDF export");
      return;
    }

    setIsExportingPDF(true);
    try {
      const response = await fetch(`/api/profiles/${profileId}/export-pdf`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ 
          resume
        }),
      });

      if (!response.ok) {
        throw new Error("Failed to export PDF");
      }

      const blob = await response.blob();
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = `${profileName || "resume"}.pdf`;
      document.body.appendChild(a);
      a.click();
      window.URL.revokeObjectURL(url);
      document.body.removeChild(a);

      toast.success("PDF exported successfully");
    } catch (error) {
      const message = error instanceof Error ? error.message : "Failed to export PDF";
      toast.error(message);
    } finally {
      setIsExportingPDF(false);
    }
  };

  const handleTogglePublic = async () => {
    if (onTogglePublic) {
      await onTogglePublic();
      setIsPublic(!isPublic);
    }
  };

  const handleCopyPublicLink = () => {
    const link = `${window.location.origin}/public/${publicSlug}`;
    navigator.clipboard.writeText(link);
    toast.success("Link copied to clipboard");
  };

  return (
    <div className="flex flex-col h-screen">
      {/* Top Bar */}
      <div className="flex items-center justify-between border-b bg-background px-6 py-3">
        <div className="flex items-center gap-3">
          {isEditingName ? (
            <div className="flex items-center gap-2">
              <Input
                value={profileName}
                onChange={(e) => setProfileName(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === "Enter") handleSaveProfileName();
                  if (e.key === "Escape") {
                    setProfileName(initialProfileName || "");
                    setIsEditingName(false);
                  }
                }}
                className="text-lg font-semibold h-8"
                autoFocus
              />
              <Button size="sm" variant="ghost" onClick={handleSaveProfileName}>
                <Check className="h-4 w-4" />
              </Button>
              <Button 
                size="sm" 
                variant="ghost" 
                onClick={() => {
                  setProfileName(initialProfileName || "");
                  setIsEditingName(false);
                }}
              >
                <X className="h-4 w-4" />
              </Button>
            </div>
          ) : (
            <div className="flex items-center gap-2">
              <h2 className="text-lg font-semibold">
                {profileName || resume.basics?.name || "Untitled Profile"}
              </h2>
              {onProfileNameChange && (
                <Button
                  size="sm"
                  variant="ghost"
                  onClick={() => setIsEditingName(true)}
                  className="h-6 w-6 p-0"
                >
                  <Edit2 className="h-3 w-3" />
                </Button>
              )}
            </div>
          )}
          {isDirty && (
            <span className="text-xs text-muted-foreground">(Unsaved changes)</span>
          )}
        </div>
        
        <div className="flex items-center gap-2">
          {/* Template Selector - temporarily hidden until properly implemented */}
          {/* <TemplateDropdown
            selectedTemplateId={selectedTemplateId}
            onTemplateChange={setSelectedTemplateId}
          /> */}

          {/* Share Button */}
          {profileId && (
            <Button
              variant="outline"
              size="sm"
              onClick={() => setShowShareDialog(true)}
            >
              <Share2 className="h-4 w-4 mr-2" />
              Share
            </Button>
          )}

          {/* Preview Toggle */}
          <Button
            variant="outline"
            size="sm"
            onClick={() => setShowPreview(!showPreview)}
          >
            <Eye className="h-4 w-4 mr-2" />
            {showPreview ? "Hide" : "Show"} Preview
          </Button>

          {/* Export PDF */}
          <Button
            variant="outline"
            size="sm"
            onClick={handleExportPDF}
            disabled={isExportingPDF || !profileId}
          >
            <FileDown className="h-4 w-4 mr-2" />
            {isExportingPDF ? "Exporting..." : "Export PDF"}
          </Button>

          {/* Save */}
          <Button
            size="sm"
            onClick={handleSave}
            disabled={isSaving || !isDirty}
          >
            <Save className="h-4 w-4 mr-2" />
            {isSaving ? "Saving..." : "Save"}
          </Button>
        </div>
      </div>

      {/* Main Content */}
      <div className="flex flex-1">
        {/* Editor Area */}
        <div className={`flex-1 overflow-y-auto ${showPreview ? 'border-r' : ''}`}>
          <Tabs value={activeTab} onValueChange={setActiveTab} className="h-full">
            <TabsList className="w-full justify-start border-b rounded-none bg-muted/50 px-6 overflow-x-auto flex-wrap h-auto">
              <TabsTrigger value="basics" className="gap-2">
                <User className="h-4 w-4" />
                Basics
              </TabsTrigger>
              <TabsTrigger value="work" className="gap-2">
                <Briefcase className="h-4 w-4" />
                Work
              </TabsTrigger>
              <TabsTrigger value="education" className="gap-2">
                <GraduationCap className="h-4 w-4" />
                Education
              </TabsTrigger>
              <TabsTrigger value="skills" className="gap-2">
                <Code className="h-4 w-4" />
                Skills
              </TabsTrigger>
              <TabsTrigger value="projects" className="gap-2">
                <FolderOpen className="h-4 w-4" />
                Projects
              </TabsTrigger>
              <TabsTrigger value="certifications" className="gap-2">
                <Award className="h-4 w-4" />
                Certifications
              </TabsTrigger>
              <TabsTrigger value="languages" className="gap-2">
                <Languages className="h-4 w-4" />
                Languages
              </TabsTrigger>
              <TabsTrigger value="volunteer" className="gap-2">
                <HandHeart className="h-4 w-4" />
                Volunteer
              </TabsTrigger>
              <TabsTrigger value="awards" className="gap-2">
                <Award className="h-4 w-4" />
                Awards
              </TabsTrigger>
              <TabsTrigger value="publications" className="gap-2">
                <BookOpen className="h-4 w-4" />
                Publications
              </TabsTrigger>
              <TabsTrigger value="interests" className="gap-2">
                <Heart className="h-4 w-4" />
                Interests
              </TabsTrigger>
              <TabsTrigger value="references" className="gap-2">
                <Users className="h-4 w-4" />
                References
              </TabsTrigger>
            </TabsList>

            {/* Basics Tab */}
            <TabsContent value="basics" className="p-6 space-y-6">
              <div>
                <h3 className="text-lg font-semibold mb-1">Personal Information</h3>
                <p className="text-sm text-muted-foreground mb-4">
                  Your contact details and professional links
                </p>
                <PersonalInfoForm
                  initialData={resume.basics}
                  onSave={handlePersonalInfoSave}
                />
              </div>

              <div className="pt-6 border-t">
                <h3 className="text-lg font-semibold mb-1">Professional Summary</h3>
                <p className="text-sm text-muted-foreground mb-4">
                  A brief overview of your experience and career goals
                </p>
                <SummaryForm
                  summary={resume.basics?.summary || ""}
                  onChange={(summary) => updateField('basics', { ...resume.basics, summary })}
                />
              </div>
            </TabsContent>

            {/* Work Tab */}
            <TabsContent value="work" className="p-6">
              <div>
                <h3 className="text-lg font-semibold mb-1">Work Experience</h3>
                <p className="text-sm text-muted-foreground mb-4">
                  Your professional work history and achievements
                </p>
                <ExperienceForm
                  experiences={resume.work || []}
                  onChange={(work) => updateField('work', work)}
                />
              </div>
            </TabsContent>

            {/* Education Tab */}
            <TabsContent value="education" className="p-6">
              <div>
                <h3 className="text-lg font-semibold mb-1">Education</h3>
                <p className="text-sm text-muted-foreground mb-4">
                  Your academic background and qualifications
                </p>
                <EducationForm
                  education={resume.education || []}
                  onChange={(education) => updateField('education', education)}
                />
              </div>
            </TabsContent>

            {/* Skills Tab */}
            <TabsContent value="skills" className="p-6">
              <div>
                <h3 className="text-lg font-semibold mb-1">Skills</h3>
                <p className="text-sm text-muted-foreground mb-4">
                  Your technical abilities and expertise
                </p>
                <SkillsForm
                  skills={resume.skills || []}
                  onChange={handleSkillsChange}
                />
              </div>
            </TabsContent>

            {/* Projects Tab */}
            <TabsContent value="projects" className="p-6">
              <div>
                <h3 className="text-lg font-semibold mb-1">Projects</h3>
                <p className="text-sm text-muted-foreground mb-4">
                  Showcase your personal or professional projects
                </p>
                <ProjectsForm
                  projects={resume.projects || []}
                  onChange={(projects) => updateField('projects', projects)}
                />
              </div>
            </TabsContent>

            {/* Certifications Tab */}
            <TabsContent value="certifications" className="p-6">
              <div>
                <h3 className="text-lg font-semibold mb-1">Certifications</h3>
                <p className="text-sm text-muted-foreground mb-4">
                  Professional certifications and credentials
                </p>
                <CertificationsForm
                  certifications={resume.certificates || []}
                  onChange={handleCertificationsChange}
                />
              </div>
            </TabsContent>

            {/* Languages Tab */}
            <TabsContent value="languages" className="p-6">
              <div>
                <h3 className="text-lg font-semibold mb-1">Languages</h3>
                <p className="text-sm text-muted-foreground mb-4">
                  Languages you speak and your fluency level
                </p>
                <LanguagesForm
                  languages={resume.languages || []}
                  onChange={handleLanguagesChange}
                />
              </div>
            </TabsContent>

            {/* Volunteer Tab */}
            <TabsContent value="volunteer" className="p-6">
              <div>
                <h3 className="text-lg font-semibold mb-1">Volunteer Work</h3>
                <p className="text-sm text-muted-foreground mb-4">
                  Community service and volunteer activities
                </p>
                <VolunteerForm
                  volunteer={resume.volunteer || []}
                  onChange={(volunteer) => updateField('volunteer', volunteer)}
                />
              </div>
            </TabsContent>

            {/* Awards Tab */}
            <TabsContent value="awards" className="p-6">
              <div>
                <h3 className="text-lg font-semibold mb-1">Awards & Honors</h3>
                <p className="text-sm text-muted-foreground mb-4">
                  Recognition and achievements
                </p>
                <AwardsForm
                  awards={resume.awards || []}
                  onChange={(awards) => updateField('awards', awards)}
                />
              </div>
            </TabsContent>

            {/* Publications Tab */}
            <TabsContent value="publications" className="p-6">
              <div>
                <h3 className="text-lg font-semibold mb-1">Publications</h3>
                <p className="text-sm text-muted-foreground mb-4">
                  Published works and research papers
                </p>
                <PublicationsForm
                  publications={resume.publications || []}
                  onChange={(publications) => updateField('publications', publications)}
                />
              </div>
            </TabsContent>

            {/* Interests Tab */}
            <TabsContent value="interests" className="p-6">
              <div>
                <h3 className="text-lg font-semibold mb-1">Interests</h3>
                <p className="text-sm text-muted-foreground mb-4">
                  Personal interests and hobbies
                </p>
                <InterestsForm
                  interests={resume.interests || []}
                  onChange={(interests) => updateField('interests', interests)}
                />
              </div>
            </TabsContent>

            {/* References Tab */}
            <TabsContent value="references" className="p-6">
              <div>
                <h3 className="text-lg font-semibold mb-1">References</h3>
                <p className="text-sm text-muted-foreground mb-4">
                  Professional references
                </p>
                <ReferencesForm
                  references={resume.references || []}
                  onChange={(references) => updateField('references', references)}
                />
              </div>
            </TabsContent>
          </Tabs>
        </div>

        {/* Live Preview */}
        {showPreview && (
          <div className="w-1/2 bg-muted/20 aspect-[210:297] h-full">
                  <UnifiedResumePreview
              resumeData={resume}
              onTemplateChange={setSelectedTemplateId}
              showTemplateSelector
              showCard
            />
          </div>
        )}
      </div>

      

      {/* Share Dialog */}
      <Dialog open={showShareDialog} onOpenChange={setShowShareDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Share Your Resume</DialogTitle>
            <DialogDescription>
              Make your resume public and share it with a custom link
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4 py-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="font-medium">Public Access</p>
                <p className="text-sm text-muted-foreground">
                  {isPublic ? "Your resume is publicly accessible" : "Your resume is private"}
                </p>
              </div>
              <Button
                variant={isPublic ? "destructive" : "default"}
                onClick={handleTogglePublic}
                disabled={!onTogglePublic}
              >
                {isPublic ? "Make Private" : "Make Public"}
              </Button>
            </div>

            {isPublic && publicSlug && (
              <div className="space-y-2">
                <p className="text-sm font-medium">Public Link:</p>
                <div className="flex gap-2">
                  <Input
                    value={`${window.location.origin}/public/${publicSlug}`}
                    readOnly
                    className="flex-1"
                  />
                  <Button
                    variant="outline"
                    size="icon"
                    onClick={handleCopyPublicLink}
                  >
                    <Copy className="h-4 w-4" />
                  </Button>
                </div>
                <p className="text-xs text-muted-foreground">
                  Anyone with this link can view your resume
                </p>
              </div>
            )}
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
