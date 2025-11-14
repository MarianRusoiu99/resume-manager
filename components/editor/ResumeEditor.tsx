"use client";

import { useState, useEffect } from "react";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Button, Input } from "@/components/ui";
import { 
  Save, 
  User, 
  Briefcase, 
  GraduationCap, 
  Code, 
  FolderOpen,
  MoreHorizontal,
  Edit2,
  Check,
  X,
  Copy,
  Share2
} from "lucide-react";
import { useEditor } from "@/lib/contexts/EditorContext";
import { PersonalInfoForm } from "@/components/editor/forms/PersonalInfoForm";
import { SummaryForm } from "@/components/editor/forms/SummaryForm";
import { ExperienceForm } from "@/components/editor/forms/ExperienceForm";
import { EducationForm } from "@/components/editor/forms/EducationForm";
import SkillsForm from "@/components/editor/forms/SkillsForm";
import { ProjectsForm } from "@/components/editor/forms/ProjectsForm";
import CertificationsForm from "@/components/editor/forms/CertificationsForm";
import LanguagesForm from "@/components/editor/forms/LanguagesForm";
import { VolunteerForm } from "@/components/editor/forms/VolunteerForm";
import { AwardsForm } from "@/components/editor/forms/AwardsForm";
import { PublicationsForm } from "@/components/editor/forms/PublicationsForm";
import { InterestsForm } from "@/components/editor/forms/InterestsForm";
import { ReferencesForm } from "@/components/editor/forms/ReferencesForm";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from "@/components/ui/collapsible";
import { toast } from "sonner";
import type { Basics, Skill, Certificate, Language } from "@/lib/validations/jsonresume";
import { ResumePreview } from "../resume/ResumePreview";

interface ResumeEditorProps {
  /** ID for the resume/profile being edited */
  readonly id?: string;
  /** Display name (profile name or job title) */
  readonly displayName?: string;
  /** Whether this is a public profile/resume */
  readonly isPublic?: boolean;
  /** Public slug for sharing */
  readonly publicSlug?: string;
  /** Callback when display name changes */
  readonly onDisplayNameChange?: (name: string) => Promise<void>;
  /** Callback when public status toggles */
  readonly onTogglePublic?: () => Promise<void>;
  /** Show preview panel */
  readonly showPreview?: boolean;
}

export function ResumeEditor({ 
  id, 
  displayName: initialDisplayName, 
  isPublic: initialIsPublic,
  publicSlug: initialPublicSlug,
  onDisplayNameChange,
  onTogglePublic,
}: ResumeEditorProps) {
  const { resume, updateField, save, isDirty } = useEditor();
  const [activeTab, setActiveTab] = useState("basics");
  const [isSaving, setIsSaving] = useState(false);
  const [isEditingName, setIsEditingName] = useState(false);
  const [displayName, setDisplayName] = useState(initialDisplayName || "");
  const [showShareDialog, setShowShareDialog] = useState(false);
  const [isPublic, setIsPublic] = useState(initialIsPublic || false);
  const [publicSlug, setPublicSlug] = useState(initialPublicSlug || "");

  useEffect(() => {
    if (initialDisplayName) setDisplayName(initialDisplayName);
  }, [initialDisplayName]);

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
        toast.success("Changes saved successfully");
      } else {
        toast.error("Failed to save changes");
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

  const handleSaveDisplayName = async () => {
    if (!displayName.trim()) {
      toast.error("Name cannot be empty");
      return;
    }
    
    if (onDisplayNameChange) {
      await onDisplayNameChange(displayName);
      setIsEditingName(false);
    }
  };

  const handleTogglePublic = async () => {
    if (onTogglePublic) {
      await onTogglePublic();
      setIsPublic(!isPublic);
    }
  };

  const handleCopyPublicLink = () => {
    const link = `${globalThis.location.origin}/public/${publicSlug}`;
    navigator.clipboard.writeText(link);
    toast.success("Link copied to clipboard");
  };

  return (
    <div className="flex flex-col h-full">
      {/* Top Bar */}
      <div className="flex items-center justify-between border-b bg-background px-6 py-3">
        <div className="flex items-center gap-3">
          {isEditingName ? (
            <div className="flex items-center gap-2">
              <Input
                value={displayName}
                onChange={(e) => setDisplayName(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === "Enter") handleSaveDisplayName();
                  if (e.key === "Escape") {
                    setDisplayName(initialDisplayName || "");
                    setIsEditingName(false);
                  }
                }}
                className="text-lg font-semibold h-8"
                autoFocus
              />
              <Button size="sm" variant="ghost" onClick={handleSaveDisplayName}>
                <Check className="h-4 w-4" />
              </Button>
              <Button 
                size="sm" 
                variant="ghost" 
                onClick={() => {
                  setDisplayName(initialDisplayName || "");
                  setIsEditingName(false);
                }}
              >
                <X className="h-4 w-4" />
              </Button>
            </div>
          ) : (
            <div className="flex items-center gap-2">
              <h2 className="text-lg font-semibold">
                {displayName || resume.basics?.name || "Untitled"}
              </h2>
              {onDisplayNameChange && (
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
          {/* Share Button */}
          {id && onTogglePublic && (
            <Button
              variant="outline"
              size="sm"
              onClick={() => setShowShareDialog(true)}
            >
              <Share2 className="h-4 w-4 mr-2" />
              Share
            </Button>
          )}

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
      <div className="flex flex-1 overflow-hidden">
        {/* Editor Area */}
        <div className={`w-1/2 overflow-y-auto`}>
          <Tabs value={activeTab} onValueChange={setActiveTab} className="h-full">
            <TabsList className="w-full justify-start border-b rounded-none bg-muted/50 px-6 overflow-x-auto flex-wrap h-auto">
              <TabsTrigger value="basics" className="gap-2">
                <User className="h-4 w-4" />
                Basics
              </TabsTrigger>
              <TabsTrigger value="experience" className="gap-2">
                <Briefcase className="h-4 w-4" />
                Experience
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
              <TabsTrigger value="more" className="gap-2">
                <MoreHorizontal className="h-4 w-4" />
                More
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

            {/* Experience Tab */}
            <TabsContent value="experience" className="p-6">
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

            {/* More Tab - Collapsible sections */}
            <TabsContent value="more" className="p-6 space-y-4">
              <h3 className="text-lg font-semibold mb-4">Additional Sections</h3>

              {/* Certifications */}
              <Collapsible>
                <CollapsibleTrigger asChild>
                  <Button variant="outline" className="w-full justify-between">
                    <span className="font-medium">Certifications</span>
                    <span className="text-sm text-muted-foreground">
                      {resume.certificates?.length || 0} items
                    </span>
                  </Button>
                </CollapsibleTrigger>
                <CollapsibleContent className="mt-4">
                  <CertificationsForm
                    certifications={resume.certificates || []}
                    onChange={handleCertificationsChange}
                  />
                </CollapsibleContent>
              </Collapsible>

              {/* Languages */}
              <Collapsible>
                <CollapsibleTrigger asChild>
                  <Button variant="outline" className="w-full justify-between">
                    <span className="font-medium">Languages</span>
                    <span className="text-sm text-muted-foreground">
                      {resume.languages?.length || 0} items
                    </span>
                  </Button>
                </CollapsibleTrigger>
                <CollapsibleContent className="mt-4">
                  <LanguagesForm
                    languages={resume.languages || []}
                    onChange={handleLanguagesChange}
                  />
                </CollapsibleContent>
              </Collapsible>

              {/* Volunteer */}
              <Collapsible>
                <CollapsibleTrigger asChild>
                  <Button variant="outline" className="w-full justify-between">
                    <span className="font-medium">Volunteer Work</span>
                    <span className="text-sm text-muted-foreground">
                      {resume.volunteer?.length || 0} items
                    </span>
                  </Button>
                </CollapsibleTrigger>
                <CollapsibleContent className="mt-4">
                  <VolunteerForm
                    volunteer={resume.volunteer || []}
                    onChange={(volunteer) => updateField('volunteer', volunteer)}
                  />
                </CollapsibleContent>
              </Collapsible>

              {/* Awards */}
              <Collapsible>
                <CollapsibleTrigger asChild>
                  <Button variant="outline" className="w-full justify-between">
                    <span className="font-medium">Awards & Honors</span>
                    <span className="text-sm text-muted-foreground">
                      {resume.awards?.length || 0} items
                    </span>
                  </Button>
                </CollapsibleTrigger>
                <CollapsibleContent className="mt-4">
                  <AwardsForm
                    awards={resume.awards || []}
                    onChange={(awards) => updateField('awards', awards)}
                  />
                </CollapsibleContent>
              </Collapsible>

              {/* Publications */}
              <Collapsible>
                <CollapsibleTrigger asChild>
                  <Button variant="outline" className="w-full justify-between">
                    <span className="font-medium">Publications</span>
                    <span className="text-sm text-muted-foreground">
                      {resume.publications?.length || 0} items
                    </span>
                  </Button>
                </CollapsibleTrigger>
                <CollapsibleContent className="mt-4">
                  <PublicationsForm
                    publications={resume.publications || []}
                    onChange={(publications) => updateField('publications', publications)}
                  />
                </CollapsibleContent>
              </Collapsible>

              {/* Interests */}
              <Collapsible>
                <CollapsibleTrigger asChild>
                  <Button variant="outline" className="w-full justify-between">
                    <span className="font-medium">Interests</span>
                    <span className="text-sm text-muted-foreground">
                      {resume.interests?.length || 0} items
                    </span>
                  </Button>
                </CollapsibleTrigger>
                <CollapsibleContent className="mt-4">
                  <InterestsForm
                    interests={resume.interests || []}
                    onChange={(interests) => updateField('interests', interests)}
                  />
                </CollapsibleContent>
              </Collapsible>

              {/* References */}
              <Collapsible>
                <CollapsibleTrigger asChild>
                  <Button variant="outline" className="w-full justify-between">
                    <span className="font-medium">References</span>
                    <span className="text-sm text-muted-foreground">
                      {resume.references?.length || 0} items
                    </span>
                  </Button>
                </CollapsibleTrigger>
                <CollapsibleContent className="mt-4">
                  <ReferencesForm
                    references={resume.references || []}
                    onChange={(references) => updateField('references', references)}
                  />
                </CollapsibleContent>
              </Collapsible>
            </TabsContent>
          </Tabs>
        </div>

        {/* Live Preview */}
          <div className="w-1/2 border-l bg-muted/20 overflow-hidden">
            <ResumePreview
              resumeData={resume}
              resumeId={id}
              showTemplateSelector
              showCard={false}
              className="h-full"
            />
          </div>
      </div>

      {/* Share Dialog */}
      <Dialog open={showShareDialog} onOpenChange={setShowShareDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Share Your {displayName || "Resume"}</DialogTitle>
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
                    value={`${globalThis.location.origin}/public/${publicSlug}`}
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
