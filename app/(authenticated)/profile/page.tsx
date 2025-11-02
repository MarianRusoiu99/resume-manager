"use client";

import { useState, useEffect, useCallback } from "react";
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

interface ProfileData {
  userId: string;
  resume: Resume;
}

export default function ProfilePage() {
  const [profile, setProfile] = useState<ProfileData | null>(null);
  const [loading, setLoading] = useState(true);
  const [message, setMessage] = useState<{ type: "success" | "error"; text: string } | null>(null);

  const fetchProfile = useCallback(async () => {
    try {
      const response = await fetch("/api/profile");
      
      if (response.status === 200) {
        const data = await response.json();
        setProfile(data);
      } else if (response.status === 404 || response.status === 400) {
        // Profile doesn't exist yet
        setProfile(null);
      }
    } catch (error) {
      console.error("Error fetching profile:", error);
      showMessage("error", "Failed to load profile");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchProfile();
  }, [fetchProfile]);

  const showMessage = (type: "success" | "error", text: string) => {
    setMessage({ type, text });
    setTimeout(() => setMessage(null), 5000);
  };

  const handleSavePersonalInfo = async (data?: Basics) => {
    if (!data) return;
    
    try {
      const payload = profile
        ? { resume: { ...profile.resume, basics: data } }
        : {
            resume: {
              basics: data,
              work: [],
              education: [],
              skills: [],
            }
          };

      const response = await fetch("/api/profile", {
        method: profile ? "PATCH" : "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });

      if (!response.ok) {
        throw new Error("Failed to save profile");
      }

      const updatedProfile = await response.json();
      setProfile(updatedProfile);
      showMessage("success", "Personal information saved successfully!");
      toast.success("Personal information saved successfully!");
    } catch (error) {
      console.error("Error saving profile:", error);
      showMessage("error", "Failed to save personal information");
      toast.error("Failed to save personal information");
    }
  };

  const handleSaveSummary = async (summary: string) => {
    if (!profile) return;
    
    try {
      const response = await fetch("/api/profile", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ 
          resume: { 
            ...profile.resume, 
            basics: { ...profile.resume.basics, summary } 
          } 
        }),
      });

      if (!response.ok) {
        throw new Error("Failed to save summary");
      }

      const updatedProfile = await response.json();
      setProfile(updatedProfile);
      showMessage("success", "Summary saved successfully!");
      toast.success("Summary saved successfully!");
    } catch (error) {
      console.error("Error saving summary:", error);
      showMessage("error", "Failed to save summary");
      toast.error("Failed to save summary");
    }
  };

  const handleSaveWork = async (work: Work[]) => {
    if (!profile) return;
    
    try {
      const response = await fetch("/api/profile", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ 
          resume: { ...profile.resume, work } 
        }),
      });

      if (!response.ok) {
        throw new Error("Failed to save work experience");
      }

      const updatedProfile = await response.json();
      setProfile(updatedProfile);
      showMessage("success", "Work experience saved successfully!");
      toast.success("Work experience saved successfully!");
    } catch (error) {
      console.error("Error saving work experience:", error);
      showMessage("error", "Failed to save work experience");
      toast.error("Failed to save work experience");
    }
  };

  const handleSaveEducation = async (education: JSONEducation[]) => {
    if (!profile) return;
    
    try {
      const response = await fetch("/api/profile", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ 
          resume: { ...profile.resume, education } 
        }),
      });

      if (!response.ok) {
        throw new Error("Failed to save education");
      }

      const updatedProfile = await response.json();
      setProfile(updatedProfile);
      showMessage("success", "Education saved successfully!");
      toast.success("Education saved successfully!");
    } catch (error) {
      console.error("Error saving education:", error);
      showMessage("error", "Failed to save education");
      toast.error("Failed to save education");
    }
  };

  const handleSaveSkills = async (oldSkills: { technical: string[]; soft: string[]; languages: string[] }) => {
    if (!profile) return;
    
    try {
      const skills = oldFormatToSkills(oldSkills);
      
      const response = await fetch("/api/profile", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ 
          resume: { ...profile.resume, skills } 
        }),
      });

      if (!response.ok) {
        throw new Error("Failed to save skills");
      }

      const updatedProfile = await response.json();
      setProfile(updatedProfile);
      showMessage("success", "Skills saved successfully!");
      toast.success("Skills saved successfully!");
    } catch (error) {
      console.error("Error saving skills:", error);
      showMessage("error", "Failed to save skills");
      toast.error("Failed to save skills");
    }
  };

  const handleSaveCertifications = async (oldCerts: Certification[]) => {
    if (!profile) return;
    
    try {
      const certificates = oldFormatToCertificates(oldCerts);
      
      const response = await fetch("/api/profile", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ 
          resume: { ...profile.resume, certificates } 
        }),
      });

      if (!response.ok) {
        throw new Error("Failed to save certifications");
      }

      const updatedProfile = await response.json();
      setProfile(updatedProfile);
      showMessage("success", "Certifications saved successfully!");
      toast.success("Certifications saved successfully!");
    } catch (error) {
      console.error("Error saving certifications:", error);
      showMessage("error", "Failed to save certifications");
      toast.error("Failed to save certifications");
    }
  };

  const handleSaveLanguages = async (oldLangs: Language[]) => {
    if (!profile) return;
    
    try {
      const languages = oldFormatToLanguages(oldLangs);
      
      const response = await fetch("/api/profile", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ 
          resume: { ...profile.resume, languages } 
        }),
      });

      if (!response.ok) {
        throw new Error("Failed to save languages");
      }

      const updatedProfile = await response.json();
      setProfile(updatedProfile);
      showMessage("success", "Languages saved successfully!");
      toast.success("Languages saved successfully!");
    } catch (error) {
      console.error("Error saving languages:", error);
      showMessage("error", "Failed to save languages");
      toast.error("Failed to save languages");
    }
  };

  const handleSaveProjects = async (projects: Project[]) => {
    if (!profile) return;
    
    try {
      const response = await fetch("/api/profile", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ 
          resume: { ...profile.resume, projects } 
        }),
      });

      if (!response.ok) {
        throw new Error("Failed to save projects");
      }

      const updatedProfile = await response.json();
      setProfile(updatedProfile);
      showMessage("success", "Projects saved successfully!");
      toast.success("Projects saved successfully!");
    } catch (error) {
      console.error("Error saving projects:", error);
      showMessage("error", "Failed to save projects");
      toast.error("Failed to save projects");
    }
  };

  const handleSaveVolunteer = async (volunteer: Volunteer[]) => {
    if (!profile) return;
    
    try {
      const response = await fetch("/api/profile", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ 
          resume: { ...profile.resume, volunteer } 
        }),
      });

      if (!response.ok) {
        throw new Error("Failed to save volunteer experience");
      }

      const updatedProfile = await response.json();
      setProfile(updatedProfile);
      showMessage("success", "Volunteer experience saved successfully!");
      toast.success("Volunteer experience saved successfully!");
    } catch (error) {
      console.error("Error saving volunteer experience:", error);
      showMessage("error", "Failed to save volunteer experience");
      toast.error("Failed to save volunteer experience");
    }
  };

  const handleSaveAwards = async (awards: Award[]) => {
    if (!profile) return;
    
    try {
      const response = await fetch("/api/profile", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ 
          resume: { ...profile.resume, awards } 
        }),
      });

      if (!response.ok) {
        throw new Error("Failed to save awards");
      }

      const updatedProfile = await response.json();
      setProfile(updatedProfile);
      showMessage("success", "Awards saved successfully!");
      toast.success("Awards saved successfully!");
    } catch (error) {
      console.error("Error saving awards:", error);
      showMessage("error", "Failed to save awards");
      toast.error("Failed to save awards");
    }
  };

  const handleSavePublications = async (publications: Publication[]) => {
    if (!profile) return;
    
    try {
      const response = await fetch("/api/profile", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ 
          resume: { ...profile.resume, publications } 
        }),
      });

      if (!response.ok) {
        throw new Error("Failed to save publications");
      }

      const updatedProfile = await response.json();
      setProfile(updatedProfile);
      showMessage("success", "Publications saved successfully!");
      toast.success("Publications saved successfully!");
    } catch (error) {
      console.error("Error saving publications:", error);
      showMessage("error", "Failed to save publications");
      toast.error("Failed to save publications");
    }
  };

  const handleSaveInterests = async (interests: Interest[]) => {
    if (!profile) return;
    
    try {
      const response = await fetch("/api/profile", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ 
          resume: { ...profile.resume, interests } 
        }),
      });

      if (!response.ok) {
        throw new Error("Failed to save interests");
      }

      const updatedProfile = await response.json();
      setProfile(updatedProfile);
      showMessage("success", "Interests saved successfully!");
      toast.success("Interests saved successfully!");
    } catch (error) {
      console.error("Error saving interests:", error);
      showMessage("error", "Failed to save interests");
      toast.error("Failed to save interests");
    }
  };

  const handleSaveReferences = async (references: Reference[]) => {
    if (!profile) return;
    
    try {
      const response = await fetch("/api/profile", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ 
          resume: { ...profile.resume, references } 
        }),
      });

      if (!response.ok) {
        throw new Error("Failed to save references");
      }

      const updatedProfile = await response.json();
      setProfile(updatedProfile);
      showMessage("success", "References saved successfully!");
      toast.success("References saved successfully!");
    } catch (error) {
      console.error("Error saving references:", error);
      showMessage("error", "Failed to save references");
      toast.error("Failed to save references");
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          <div className="animate-pulse">
            <div className="h-8 bg-gray-200 rounded w-1/4 mb-4"></div>
            <div className="h-64 bg-gray-200 rounded"></div>
          </div>
        </div>
      </div>
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
          <ResumeParser
            existingResume={profile?.resume}
            onParsed={(parsedResume, tokensUsed) => {
                if (profile) {
                  setProfile({
                    ...profile,
                    resume: parsedResume
                  });
                  toast.success(`Resume imported successfully! ${tokensUsed ? `Used ${tokensUsed.toLocaleString()} tokens.` : ""}`);
                } else {
                  // Create new profile with parsed resume
                  setProfile({
                    userId: "", // Will be set by the backend
                    resume: parsedResume
                  });
                  toast.success("Resume imported! Don't forget to save your changes.");
                }
              }}
            />
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
                  setProfile({
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
                    setProfile({
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
                    setProfile({
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
                    setProfile({
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
                    setProfile({
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
                    setProfile({
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
                    setProfile({
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
                    setProfile({
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
                    setProfile({
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
                    setProfile({
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
                    setProfile({
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
                    setProfile({
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
