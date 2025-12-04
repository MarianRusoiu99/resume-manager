import { TabsContent } from "@/components/ui/tabs";
import { useEditor } from "@/lib/contexts";
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
import { Button } from "@/components/ui/button";
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from "@/components/ui/collapsible";
import type { Basics, Skill, Certificate, Language } from "@/lib/validations/jsonresume";

export function EditorContent() {
    const { resume, updateField } = useEditor();

    const handlePersonalInfoChange = (data: Basics) => {
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
            <TabsContent value="basics" className="p-6 space-y-6">
                <div>
                    <h3 className="text-lg font-semibold mb-1">Personal Information</h3>
                    <p className="text-sm text-muted-foreground mb-4">
                        Your contact details and professional links
                    </p>
                    <PersonalInfoForm
                        initialData={resume.basics}
                        onChange={handlePersonalInfoChange}
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
        </>
    );
}
