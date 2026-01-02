import { User, Briefcase, GraduationCap, Code, FolderOpen, Award, Languages, Heart, BookOpen, Quote, ShieldCheck, Star } from "lucide-react";
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
import type { Resume } from "@/lib/validations/jsonresume";

export interface EditorSection {
  id: string;
  label: string;
  icon: React.ReactNode;
  description?: string;
  isPrimary: boolean;
  render: (props: {
    resume: Resume;
    updateField: (field: keyof Resume, value: any) => void;
  }) => React.ReactNode;
}

export const EDITOR_SECTIONS: EditorSection[] = [
  {
    id: "basics",
    label: "Basics",
    icon: <User className="h-4 w-4" />,
    isPrimary: true,
    render: ({ resume, updateField }) => (
      <div className="space-y-6">
        <div>
          <h3 className="text-lg font-semibold mb-1">Personal Information</h3>
          <p className="text-sm text-muted-foreground mb-4">Your contact details and professional links</p>
          <PersonalInfoForm initialData={resume.basics} onChange={(data) => updateField('basics', data)} />
        </div>
        <div className="pt-6 border-t">
          <h3 className="text-lg font-semibold mb-1">Professional Summary</h3>
          <p className="text-sm text-muted-foreground mb-4">Overview of your experience</p>
          <SummaryForm summary={resume.basics?.summary || ""} onChange={(summary) => updateField('basics', { ...resume.basics, summary })} />
        </div>
      </div>
    ),
  },
  {
    id: "experience",
    label: "Experience",
    icon: <Briefcase className="h-4 w-4" />,
    isPrimary: true,
    render: ({ resume, updateField }) => (
      <ExperienceForm experiences={resume.work || []} onChange={(work) => updateField('work', work)} />
    ),
  },
  {
    id: "education",
    label: "Education",
    icon: <GraduationCap className="h-4 w-4" />,
    isPrimary: true,
    render: ({ resume, updateField }) => (
      <EducationForm education={resume.education || []} onChange={(edu) => updateField('education', edu)} />
    ),
  },
  {
    id: "skills",
    label: "Skills",
    icon: <Code className="h-4 w-4" />,
    isPrimary: true,
    render: ({ resume, updateField }) => (
      <SkillsForm skills={resume.skills || []} onChange={(s) => updateField('skills', s)} />
    ),
  },
  {
    id: "projects",
    label: "Projects",
    icon: <FolderOpen className="h-4 w-4" />,
    isPrimary: true,
    render: ({ resume, updateField }) => (
      <ProjectsForm projects={resume.projects || []} onChange={(p) => updateField('projects', p)} />
    ),
  },
  {
    id: "certificates",
    label: "Certifications",
    icon: <ShieldCheck className="h-4 w-4" />,
    isPrimary: false,
    render: ({ resume, updateField }) => (
      <CertificationsForm certifications={resume.certificates || []} onChange={(c) => updateField('certificates', c)} />
    ),
  },
  {
    id: "languages",
    label: "Languages",
    icon: <Languages className="h-4 w-4" />,
    isPrimary: false,
    render: ({ resume, updateField }) => (
      <LanguagesForm languages={resume.languages || []} onChange={(l) => updateField('languages', l)} />
    ),
  },
  {
    id: "volunteer",
    label: "Volunteer",
    icon: <Heart className="h-4 w-4" />,
    isPrimary: false,
    render: ({ resume, updateField }) => (
      <VolunteerForm volunteer={resume.volunteer || []} onChange={(v) => updateField('volunteer', v)} />
    ),
  },
  {
    id: "awards",
    label: "Awards",
    icon: <Award className="h-4 w-4" />,
    isPrimary: false,
    render: ({ resume, updateField }) => (
      <AwardsForm awards={resume.awards || []} onChange={(a) => updateField('awards', a)} />
    ),
  },
  {
    id: "publications",
    label: "Publications",
    icon: <BookOpen className="h-4 w-4" />,
    isPrimary: false,
    render: ({ resume, updateField }) => (
      <PublicationsForm publications={resume.publications || []} onChange={(p) => updateField('publications', p)} />
    ),
  },
  {
    id: "interests",
    label: "Interests",
    icon: <Star className="h-4 w-4" />,
    isPrimary: false,
    render: ({ resume, updateField }) => (
      <InterestsForm interests={resume.interests || []} onChange={(i) => updateField('interests', i)} />
    ),
  },
  {
    id: "references",
    label: "References",
    icon: <Quote className="h-4 w-4" />,
    isPrimary: false,
    render: ({ resume, updateField }) => (
      <ReferencesForm references={resume.references || []} onChange={(r) => updateField('references', r)} />
    ),
  },
];
