"use client";

import { useEffect } from "react";
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from "@/components/ui/card";
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
import { ProfileSection } from "@/components/editor/forms/ProfileSection";
import type { Basics, Skill, Certificate, Language } from "@/lib/validations/jsonresume";

export interface EditorUIProps {
    /** Show resume parser (only for profile editing) */
    showParser?: boolean;
    /** Custom parser component */
    parserComponent?: React.ReactNode;
    /** Show completion indicator */
    showCompletion?: boolean;
}

/**
 * Calculate profile completion percentage
 */
function calculateCompletionPercentage(resume: { basics?: any; work?: any[]; education?: any[]; skills?: any[]; projects?: any[]; certificates?: any[]; languages?: any[]; volunteer?: any[] }): number {
    let completed = 0;
    let total = 0;

    // Personal info (weight: 30%)
    total += 30;
    const hasBasicInfo = !!(resume.basics?.name && resume.basics?.email);
    const hasContact = !!(resume.basics?.phone || resume.basics?.location?.city);
    const hasProfiles = !!(resume.basics?.profiles && resume.basics.profiles.length > 0);
    if (hasBasicInfo) completed += 15;
    if (hasContact) completed += 10;
    if (hasProfiles) completed += 5;

    // Summary (weight: 10%)
    total += 10;
    if (resume.basics?.summary && resume.basics.summary.length > 50) {
        completed += 10;
    }

    // Work experience (weight: 25%)
    total += 25;
    if (resume.work && resume.work.length > 0) {
        completed += Math.min(25, resume.work.length * 8);
    }

    // Education (weight: 15%)
    total += 15;
    if (resume.education && resume.education.length > 0) {
        completed += Math.min(15, resume.education.length * 7);
    }

    // Skills (weight: 10%)
    total += 10;
    if (resume.skills && resume.skills.length > 0) {
        completed += 10;
    }

    // Optional sections (weight: 10%)
    total += 10;
    let optionalCount = 0;
    if (resume.projects && resume.projects.length > 0) optionalCount++;
    if (resume.certificates && resume.certificates.length > 0) optionalCount++;
    if (resume.languages && resume.languages.length > 0) optionalCount++;
    if (resume.volunteer && resume.volunteer.length > 0) optionalCount++;
    completed += Math.min(10, optionalCount * 2.5);

    return Math.round((completed / total) * 100);
}

/**
 * Unified Editor UI Component
 * 
 * Renders all resume editing sections using the editor context.
 * Can be used for both profile and individual resume editing.
 */
export function EditorUI({ showParser, parserComponent, showCompletion = false }: EditorUIProps) {
    const { resume, updateField, save, isDirty } = useEditor();

    // Warn user about unsaved changes when navigating away
    useEffect(() => {
        const handleBeforeUnload = (e: BeforeUnloadEvent) => {
            if (isDirty) {
                e.preventDefault();
                e.returnValue = '';
            }
        };

        window.addEventListener('beforeunload', handleBeforeUnload);
        return () => window.removeEventListener('beforeunload', handleBeforeUnload);
    }, [isDirty]);

    // Single handler for sections that just need to save
    const handleSectionSave = async () => {
        await save();
    };

    // Handler for personal info (needs to update field before saving)
    const handlePersonalInfoSave = async (data?: Basics) => {
        if (!data) return;
        updateField('basics', data);
    };

    // Direct handlers for JSON Resume types
    const handleSkillsChange = (skills: Skill[]) => {
        updateField('skills', skills);
    };

    const handleCertificationsChange = (certificates: Certificate[]) => {
        updateField('certificates', certificates);
    };

    const handleLanguagesChange = (languages: Language[]) => {
        updateField('languages', languages);
    };

    const completionPercentage = showCompletion ? calculateCompletionPercentage(resume) : 0;

    return (
        <div className="space-y-6">
            {/* Completion Indicator */}
            {showCompletion && (
                <Card>
                    <CardContent className="pt-6">
                        <div className="space-y-2">
                            <div className="flex items-center justify-between text-sm">
                                <span className="font-medium">Profile Completion</span>
                                <span className="font-bold text-blue-600">{completionPercentage}%</span>
                            </div>
                            <div className="h-2 w-full bg-gray-200 rounded-full overflow-hidden">
                                <div
                                    className="h-full bg-blue-600 transition-all duration-300"
                                    style={{ width: `${completionPercentage}%` }}
                                />
                            </div>
                        </div>
                    </CardContent>
                </Card>
            )}

            {/* Resume Parser */}
            {showParser && parserComponent && (
                <Card>
                    <CardHeader>
                        <CardTitle>Quick Start</CardTitle>
                        <CardDescription>Upload your existing resume to auto-fill your profile</CardDescription>
                    </CardHeader>
                    <CardContent>
                        {parserComponent}
                    </CardContent>
                </Card>
            )}

            {/* Personal Information */}
            <Card>
                <CardHeader>
                    <CardTitle>Personal Information</CardTitle>
                    <CardDescription>Your contact details and links</CardDescription>
                </CardHeader>
                <CardContent>
                    <PersonalInfoForm
                        initialData={resume.basics}
                        onSave={handlePersonalInfoSave}
                    />
                </CardContent>
            </Card>

            {/* Professional Summary */}
            <ProfileSection
                title="Professional Summary"
                description="A brief overview of your experience and goals"
                onSave={handleSectionSave}
            >
                <SummaryForm
                    summary={resume.basics?.summary || ""}
                    onChange={(summary) => updateField('basics', { ...resume.basics, summary })}
                />
            </ProfileSection>

            {/* Work Experience */}
            <ProfileSection
                title="Work Experience"
                description="Your professional work history"
                onSave={handleSectionSave}
            >
                <ExperienceForm
                    experiences={resume.work || []}
                    onChange={(work) => updateField('work', work)}
                />
            </ProfileSection>

            {/* Education */}
            <ProfileSection
                title="Education"
                description="Your academic background"
                onSave={handleSectionSave}
            >
                <EducationForm
                    education={resume.education || []}
                    onChange={(education) => updateField('education', education)}
                />
            </ProfileSection>

            {/* Skills */}
            <ProfileSection
                title="Skills"
                description="Your technical and soft skills"
                onSave={handleSectionSave}
            >
                <SkillsForm
                    skills={resume.skills || []}
                    onChange={handleSkillsChange}
                />
            </ProfileSection>

            {/* Projects */}
            <ProfileSection
                title="Projects"
                description="Notable projects you've worked on"
                onSave={handleSectionSave}
            >
                <ProjectsForm
                    projects={resume.projects || []}
                    onChange={(projects) => updateField('projects', projects)}
                />
            </ProfileSection>

            {/* Certifications */}
            <ProfileSection
                title="Certifications"
                description="Professional certifications and credentials"
                onSave={handleSectionSave}
            >
                <CertificationsForm
                    certifications={resume.certificates || []}
                    onChange={handleCertificationsChange}
                />
            </ProfileSection>

            {/* Languages */}
            <ProfileSection
                title="Languages"
                description="Languages you speak and your fluency level"
                onSave={handleSectionSave}
            >
                <LanguagesForm
                    languages={resume.languages || []}
                    onChange={handleLanguagesChange}
                />
            </ProfileSection>

            {/* Volunteer Work */}
            <ProfileSection
                title="Volunteer Work"
                description="Community service and volunteer activities"
                onSave={handleSectionSave}
            >
                <VolunteerForm
                    volunteer={resume.volunteer || []}
                    onChange={(volunteer) => updateField('volunteer', volunteer)}
                />
            </ProfileSection>

            {/* Awards */}
            <ProfileSection
                title="Awards & Honors"
                description="Recognition and achievements"
                onSave={handleSectionSave}
            >
                <AwardsForm
                    awards={resume.awards || []}
                    onChange={(awards) => updateField('awards', awards)}
                />
            </ProfileSection>

            {/* Publications */}
            <ProfileSection
                title="Publications"
                description="Published works and research papers"
                onSave={handleSectionSave}
            >
                <PublicationsForm
                    publications={resume.publications || []}
                    onChange={(publications) => updateField('publications', publications)}
                />
            </ProfileSection>

            {/* Interests */}
            <ProfileSection
                title="Interests"
                description="Personal interests and hobbies"
                onSave={handleSectionSave}
            >
                <InterestsForm
                    interests={resume.interests || []}
                    onChange={(interests) => updateField('interests', interests)}
                />
            </ProfileSection>

            {/* References */}
            <ProfileSection
                title="References"
                description="Professional references"
                onSave={handleSectionSave}
            >
                <ReferencesForm
                    references={resume.references || []}
                    onChange={(references) => updateField('references', references)}
                />
            </ProfileSection>
        </div>
    );
}
