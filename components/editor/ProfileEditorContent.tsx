import { TabsContent } from "@/components/ui/tabs";
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from "@/components/ui/card";
import { useEditor } from "@/contexts/EditorContext";
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
import { ImportFromJSON } from "@/components/editor/ImportFromJSON";
import type { Basics, Skill, Certificate, Language } from "@/lib/validations/jsonresume";

interface ProfileEditorContentProps {
    showParser?: boolean;
    parserComponent?: React.ReactNode;
}

export function ProfileEditorContent({ showParser, parserComponent }: ProfileEditorContentProps) {
    const { resume, updateField, save } = useEditor();

    const handleSectionSave = async () => {
        await save();
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

    return (
        <>
            {/* Basics Tab */}
            <TabsContent value="basics" className="space-y-6">
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

                {/* Import from JSON */}
                {showParser && (
                    <Card>
                        <CardHeader>
                            <CardTitle>Import from JSON</CardTitle>
                            <CardDescription>Import resume data from JSON in your clipboard</CardDescription>
                        </CardHeader>
                        <CardContent>
                            <ImportFromJSON />
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
                            onChange={handlePersonalInfoSave}
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
            </TabsContent>

            {/* Experience Tab */}
            <TabsContent value="experience" className="space-y-6">
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
            </TabsContent>

            {/* Education Tab */}
            <TabsContent value="education" className="space-y-6">
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
            </TabsContent>

            {/* Skills Tab */}
            <TabsContent value="skills" className="space-y-6">
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
            </TabsContent>

            {/* Projects Tab */}
            <TabsContent value="projects" className="space-y-6">
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
            </TabsContent>

            {/* Additional Tab */}
            <TabsContent value="more" className="space-y-6">
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
            </TabsContent>
        </>
    );
}
