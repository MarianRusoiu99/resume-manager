"use client";

import { useState } from "react";
import { toast } from "sonner";
import { PageHeader } from "@/components/layout/PageHeader";
import { PageContainer } from "@/components/layout/PageContainer";
import { PersonalInfoForm } from "@/components/profile/PersonalInfoForm";
import { SummaryForm } from "@/components/profile/SummaryForm";
import { ExperienceForm } from "@/components/profile/ExperienceForm";
import { EducationForm } from "@/components/profile/EducationForm";
import SkillsForm from "@/components/profile/SkillsForm";
import CertificationsForm, { Certification } from "@/components/profile/CertificationsForm";
import LanguagesForm, { Language } from "@/components/profile/LanguagesForm";
import { ProjectsForm } from "@/components/profile/ProjectsForm";
import { VolunteerForm } from "@/components/profile/VolunteerForm";
import { AwardsForm } from "@/components/profile/AwardsForm";
import { PublicationsForm } from "@/components/profile/PublicationsForm";
import { InterestsForm } from "@/components/profile/InterestsForm";
import { ReferencesForm } from "@/components/profile/ReferencesForm";
import { ResumeParser } from "@/components/profile/ResumeParser";
import { ProfileSection } from "@/components/profile/ProfileSection";
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from "@/components/ui/card";
import { ProfileProvider } from "@/lib/contexts/ProfileContext";
import { useProfile } from "@/lib/contexts/ProfileContext";
import type { 
  Resume, 
  Basics, 
  Work, 
  Education as JSONEducation,
  Project,
  Volunteer,
  Award,
  Publication,
  Interest,
  Reference
} from "@/lib/validations/jsonresume";

// Helper to convert JSON Resume skills to old format for SkillsForm
function skillsToOldFormat(skills?: Resume['skills']) {
  if (!skills || skills.length === 0) {
    return { technical: [], soft: [], languages: [] };
  }
  
  const result = { technical: [] as string[], soft: [] as string[], languages: [] as string[] };
  
  skills.forEach(skill => {
    const name = skill.name?.toLowerCase() || '';
    const keywords = skill.keywords || [];
    
    // Categorize based on skill name
    if (name.includes('language') || name === 'languages') {
      result.languages.push(...keywords);
    } else if (name.includes('soft') || name.includes('leadership') || name.includes('communication')) {
      result.soft.push(...keywords);
    } else {
      result.technical.push(...keywords);
    }
  });
  
  return result;
}

// Helper to convert old format skills back to JSON Resume
function oldFormatToSkills(oldSkills: { technical: string[]; soft: string[]; languages: string[] }): Resume['skills'] {
  const skills: NonNullable<Resume['skills']> = [];
  
  if (oldSkills.technical.length > 0) {
    skills.push({ name: 'Technical', keywords: oldSkills.technical });
  }
  if (oldSkills.soft.length > 0) {
    skills.push({ name: 'Soft Skills', keywords: oldSkills.soft });
  }
  if (oldSkills.languages.length > 0) {
    skills.push({ name: 'Languages', keywords: oldSkills.languages });
  }
  
  return skills;
}

// Helper to convert JSON Resume certificates to Certification format
function certificatesToOldFormat(certificates?: Resume['certificates']): Certification[] {
  if (!certificates || certificates.length === 0) {
    return [];
  }
  
  return certificates.map(cert => ({
    id: cert.name || '',
    name: cert.name || '',
    issuer: cert.issuer || '',
    date: cert.date || '',
    url: cert.url || '',
  }));
}

// Helper to convert Certification format back to JSON Resume certificates
function oldFormatToCertificates(oldCerts: Certification[]): Resume['certificates'] {
  return oldCerts.map(cert => ({
    name: cert.name,
    issuer: cert.issuer,
    date: cert.date,
    url: cert.url || undefined,
  }));
}

// Helper to convert JSON Resume languages to Language format
function languagesToOldFormat(languages?: Resume['languages']): Language[] {
  if (!languages || languages.length === 0) {
    return [];
  }
  
  return languages.map(lang => ({
    id: lang.language || '',
    language: lang.language || '',
    proficiency: lang.fluency || '',
  }));
}

// Helper to convert Language format back to JSON Resume languages
function oldFormatToLanguages(oldLangs: Language[]): Resume['languages'] {
  return oldLangs.map(lang => ({
    language: lang.language,
    fluency: lang.proficiency,
  }));
}

// Main export wraps ProfilePageContent with ProfileProvider
export default function ProfilePage() {
  return (
    <ProfileProvider>
      <ProfilePageContent />
    </ProfileProvider>
  );
}

// Rename the main component to ProfilePageContent
function ProfilePageContent() {
  // Use context instead of local state
  const { profile, loading, updateProfile } = useProfile();
  const [message, setMessage] = useState<{ type: "success" | "error"; text: string } | null>(null);

  const showMessage = (type: "success" | "error", text: string) => {
    setMessage({ type, text });
    setTimeout(() => setMessage(null), 5000);
  };

  // Helper function to save profile data
  const saveProfileData = async (
    resumeData: Partial<Resume>,
    successMessage: string
  ): Promise<boolean> => {
    try {
      const payload = {
        resume: profile ? { ...profile.resume, ...resumeData } : resumeData
      };

      const response = await fetch("/api/profile", {
        method: "PUT", // Use PUT for upsert (create or update)
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });

      if (!response.ok) {
        const errorData = await response.json();
        console.error("Profile save error:", {
          status: response.status,
          error: errorData,
          payload
        });
        throw new Error(errorData.error || "Failed to save profile");
      }

      const updatedProfile = await response.json();
      updateProfile(updatedProfile);
      showMessage("success", successMessage);
      toast.success(successMessage);
      return true;
    } catch (error) {
      console.error("Error saving profile:", error);
      const errorMessage = error instanceof Error ? error.message : "Failed to save profile";
      showMessage("error", errorMessage);
      toast.error(errorMessage);
      return false;
    }
  };

  const handleSavePersonalInfo = async (data?: Basics) => {
    if (!data) return;
    
    const resumeData = profile
      ? { basics: data }
      : {
          basics: data,
          work: [],
          education: [],
          skills: [],
        };
    
    await saveProfileData(resumeData, "Personal information saved successfully!");
  };

  const handleSaveSummary = async (summary: string) => {
    if (!profile) return;
    
    await saveProfileData(
      {
        basics: { ...profile.resume.basics, summary }
      },
      "Summary saved successfully!"
    );
  };

  const handleSaveWork = async (work: Work[]) => {
    if (!profile) return;
    await saveProfileData({ work }, "Work experience saved successfully!");
  };

  const handleSaveEducation = async (education: JSONEducation[]) => {
    if (!profile) return;
    await saveProfileData({ education }, "Education saved successfully!");
  };

  const handleSaveSkills = async (oldSkills: { technical: string[]; soft: string[]; languages: string[] }) => {
    if (!profile) return;
    const skills = oldFormatToSkills(oldSkills);
    await saveProfileData({ skills }, "Skills saved successfully!");
  };

  const handleSaveCertifications = async (oldCerts: Certification[]) => {
    if (!profile) return;
    const certificates = oldFormatToCertificates(oldCerts);
    await saveProfileData({ certificates }, "Certifications saved successfully!");
  };

  const handleSaveLanguages = async (oldLangs: Language[]) => {
    if (!profile) return;
    const languages = oldFormatToLanguages(oldLangs);
    await saveProfileData({ languages }, "Languages saved successfully!");
  };

  const handleSaveProjects = async (projects: Project[]) => {
    if (!profile) return;
    await saveProfileData({ projects }, "Projects saved successfully!");
  };

  const handleSaveVolunteer = async (volunteer: Volunteer[]) => {
    if (!profile) return;
    await saveProfileData({ volunteer }, "Volunteer experience saved successfully!");
  };

  const handleSaveAwards = async (awards: Award[]) => {
    if (!profile) return;
    await saveProfileData({ awards }, "Awards saved successfully!");
  };

  const handleSavePublications = async (publications: Publication[]) => {
    if (!profile) return;
    await saveProfileData({ publications }, "Publications saved successfully!");
  };

  const handleSaveInterests = async (interests: Interest[]) => {
    if (!profile) return;
    await saveProfileData({ interests }, "Interests saved successfully!");
  };

  const handleSaveReferences = async (references: Reference[]) => {
    if (!profile) return;
    await saveProfileData({ references }, "References saved successfully!");
  };

  if (loading) {
    return (
      <PageContainer>
        <div className="flex items-center justify-center h-64">
          <p>Loading...</p>
        </div>
      </PageContainer>
    );
  }

  return (
    <>
      <PageHeader
        title="Professional Profile"
        description="Build your professional profile to generate optimized resumes"
        breadcrumbs={[
          { label: "Dashboard", href: "/dashboard" },
          { label: "Profile" },
        ]}
      />
      <PageContainer>
        {/* Success/Error Message */}
        {message && (
          <div
            className={`mb-6 p-4 rounded-md ${
              message.type === "success"
                ? "bg-green-50 text-green-800 dark:bg-green-900/20 dark:text-green-400"
                : "bg-red-50 text-red-800 dark:bg-red-900/20 dark:text-red-400"
            }`}
          >
            {message.text}
          </div>
        )}

        {/* Resume Parser - Always visible */}
        <div className="mb-6">
          <ResumeParser />
          </div>

        {/* Profile Sections */}
        <div className="space-y-6">{/* Personal Information */}
          <Card>
            <CardHeader>
              <CardTitle>Personal Information</CardTitle>
              <CardDescription>Your contact details and links</CardDescription>
            </CardHeader>
            <CardContent>
              <PersonalInfoForm
                initialData={profile?.resume.basics}
                onSave={handleSavePersonalInfo}
              />
            </CardContent>
          </Card>

          {/* Summary Section */}
          <ProfileSection
            title="Professional Summary"
            description="A brief overview of your experience and goals"
            onSave={() => handleSaveSummary(profile?.resume.basics?.summary || "")}
          >
            <SummaryForm
              summary={profile?.resume.basics?.summary || ""}
              onChange={(summary) => {
                if (profile) {
                  updateProfile({
                    ...profile,
                    resume: {
                      ...profile.resume,
                      basics: { ...profile.resume.basics, summary }
                    }
                  });
                }
              }}
            />
          </ProfileSection>

          {/* Experience Section */}
          <ProfileSection
            title="Work Experience"
            description="Your professional work history"
            onSave={() => handleSaveWork(profile?.resume.work || [])}
          >
            <ExperienceForm
                experiences={profile?.resume.work || []}
                onChange={(work) => {
                  if (profile) {
                    updateProfile({
                      ...profile,
                      resume: { ...profile.resume, work }
                    });
                  }
                }}
              />
          </ProfileSection>

          {/* Education Section */}
          <ProfileSection
            title="Education"
            description="Your educational background"
            onSave={() => handleSaveEducation(profile?.resume.education || [])}
          >
            <EducationForm
                education={profile?.resume.education || []}
                onChange={(education) => {
                  if (profile) {
                    updateProfile({
                      ...profile,
                      resume: { ...profile.resume, education }
                    });
                  }
                }}
              />
          </ProfileSection>

          {/* Skills Section */}
          <ProfileSection
            title="Skills"
            description="Your technical and soft skills"
            onSave={() => handleSaveSkills(skillsToOldFormat(profile?.resume.skills))}
          >
            <SkillsForm
                skills={skillsToOldFormat(profile?.resume.skills)}
                onChange={(oldSkills) => {
                  if (profile) {
                    const skills = oldFormatToSkills(oldSkills);
                    updateProfile({
                      ...profile,
                      resume: { ...profile.resume, skills }
                    });
                  }
                }}
              />
          </ProfileSection>

          {/* Certifications Section */}
          <ProfileSection
            title="Certifications"
            description="Your professional certifications and licenses"
            onSave={() => handleSaveCertifications(certificatesToOldFormat(profile?.resume.certificates))}
          >
            <CertificationsForm
                certifications={certificatesToOldFormat(profile?.resume.certificates)}
                onChange={(oldCerts) => {
                  if (profile) {
                    const certificates = oldFormatToCertificates(oldCerts);
                    updateProfile({
                      ...profile,
                      resume: { ...profile.resume, certificates }
                    });
                  }
                }}
              />
          </ProfileSection>

          {/* Languages Section */}
          <ProfileSection
            title="Languages"
            description="Languages you speak and your proficiency levels"
            onSave={() => handleSaveLanguages(languagesToOldFormat(profile?.resume.languages))}
          >
            <LanguagesForm
                languages={languagesToOldFormat(profile?.resume.languages)}
                onChange={(oldLangs) => {
                  if (profile) {
                    const languages = oldFormatToLanguages(oldLangs);
                    updateProfile({
                      ...profile,
                      resume: { ...profile.resume, languages }
                    });
                  }
                }}
              />
          </ProfileSection>

          {/* Projects Section */}
          <ProfileSection
            title="Projects"
            description="Your personal and professional projects"
            onSave={() => handleSaveProjects(profile?.resume.projects || [])}
          >
            <ProjectsForm
                projects={profile?.resume.projects || []}
                onChange={(projects) => {
                  if (profile) {
                    updateProfile({
                      ...profile,
                      resume: { ...profile.resume, projects }
                    });
                  }
                }}
              />
          </ProfileSection>

          {/* Volunteer Section */}
          <ProfileSection
            title="Volunteer Experience"
            description="Your volunteer work and community involvement"
            onSave={() => handleSaveVolunteer(profile?.resume.volunteer || [])}
          >
            <VolunteerForm
                volunteer={profile?.resume.volunteer || []}
                onChange={(volunteer) => {
                  if (profile) {
                    updateProfile({
                      ...profile,
                      resume: { ...profile.resume, volunteer }
                    });
                  }
                }}
              />
          </ProfileSection>

          {/* Awards Section */}
          <ProfileSection
            title="Awards & Honors"
            description="Awards, honors, and recognitions you have received"
            onSave={() => handleSaveAwards(profile?.resume.awards || [])}
          >
            <AwardsForm
                awards={profile?.resume.awards || []}
                onChange={(awards) => {
                  if (profile) {
                    updateProfile({
                      ...profile,
                      resume: { ...profile.resume, awards }
                    });
                  }
                }}
              />
          </ProfileSection>

          {/* Publications Section */}
          <ProfileSection
            title="Publications"
            description="Published works, papers, articles, and books"
            onSave={() => handleSavePublications(profile?.resume.publications || [])}
          >
            <PublicationsForm
                publications={profile?.resume.publications || []}
                onChange={(publications) => {
                  if (profile) {
                    updateProfile({
                      ...profile,
                      resume: { ...profile.resume, publications }
                    });
                  }
                }}
              />
          </ProfileSection>

          {/* Interests Section */}
          <ProfileSection
            title="Interests"
            description="Your personal and professional interests"
            onSave={() => handleSaveInterests(profile?.resume.interests || [])}
          >
            <InterestsForm
                interests={profile?.resume.interests || []}
                onChange={(interests) => {
                  if (profile) {
                    updateProfile({
                      ...profile,
                      resume: { ...profile.resume, interests }
                    });
                  }
                }}
              />
          </ProfileSection>

          {/* References Section */}
          <ProfileSection
            title="References"
            description="Professional references who can vouch for your work"
            onSave={() => handleSaveReferences(profile?.resume.references || [])}
          >
            <ReferencesForm
                references={profile?.resume.references || []}
                onChange={(references) => {
                  if (profile) {
                    updateProfile({
                      ...profile,
                      resume: { ...profile.resume, references }
                    });
                  }
                }}
              />
          </ProfileSection>
        </div>

        {/* Profile Completion Indicator */}
        <div className="mt-8 p-6 bg-blue-50 dark:bg-blue-950/30 rounded-lg">
          <h3 className="text-lg font-semibold text-blue-900 dark:text-blue-100 mb-2">
            Profile Completion
          </h3>
          <div className="flex items-center space-x-4">
            <div className="flex-1 bg-blue-200 dark:bg-blue-800 rounded-full h-2">
              <div
                className="bg-blue-600 dark:bg-blue-400 h-2 rounded-full"
                style={{ 
                  width: `${Math.min(100,
                    (profile?.resume.basics ? 20 : 0) +
                    (profile?.resume.basics?.summary ? 10 : 0) +
                    ((profile?.resume.work && profile.resume.work.length > 0) ? 25 : 0) +
                    ((profile?.resume.education && profile.resume.education.length > 0) ? 15 : 0) +
                    ((profile?.resume.skills && profile.resume.skills.length > 0) ? 10 : 0) +
                    ((profile?.resume.certificates && profile.resume.certificates.length > 0) ? 5 : 0) +
                    ((profile?.resume.languages && profile.resume.languages.length > 0) ? 3 : 0) +
                    ((profile?.resume.projects && profile.resume.projects.length > 0) ? 5 : 0) +
                    ((profile?.resume.volunteer && profile.resume.volunteer.length > 0) ? 2 : 0) +
                    ((profile?.resume.awards && profile.resume.awards.length > 0) ? 2 : 0) +
                    ((profile?.resume.publications && profile.resume.publications.length > 0) ? 1 : 0) +
                    ((profile?.resume.interests && profile.resume.interests.length > 0) ? 1 : 0) +
                    ((profile?.resume.references && profile.resume.references.length > 0) ? 1 : 0)
                  )}%`
                }}
              ></div>
            </div>
            <span className="text-sm font-medium text-blue-900 dark:text-blue-100">
              {Math.min(100,
                (profile?.resume.basics ? 20 : 0) +
                (profile?.resume.basics?.summary ? 10 : 0) +
                ((profile?.resume.work && profile.resume.work.length > 0) ? 25 : 0) +
                ((profile?.resume.education && profile.resume.education.length > 0) ? 15 : 0) +
                ((profile?.resume.skills && profile.resume.skills.length > 0) ? 10 : 0) +
                ((profile?.resume.certificates && profile.resume.certificates.length > 0) ? 5 : 0) +
                ((profile?.resume.languages && profile.resume.languages.length > 0) ? 3 : 0) +
                ((profile?.resume.projects && profile.resume.projects.length > 0) ? 5 : 0) +
                ((profile?.resume.volunteer && profile.resume.volunteer.length > 0) ? 2 : 0) +
                ((profile?.resume.awards && profile.resume.awards.length > 0) ? 2 : 0) +
                ((profile?.resume.publications && profile.resume.publications.length > 0) ? 1 : 0) +
                ((profile?.resume.interests && profile.resume.interests.length > 0) ? 1 : 0) +
                ((profile?.resume.references && profile.resume.references.length > 0) ? 1 : 0)
              )}%
            </span>
          </div>
          <p className="mt-2 text-sm text-blue-800 dark:text-blue-200">
            Complete sections to generate optimized resumes. Core sections (70%): Basics, Work, Education, Skills. Additional sections (30%): Projects, Volunteer, Awards, Publications, and more.
          </p>
        </div>
      </PageContainer>
    </>
  );
}
