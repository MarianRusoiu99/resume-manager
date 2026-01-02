import { TabsContent } from "@/components/ui/tabs";
import { ProfileSection } from "@/components/editor/forms/ProfileSection";
import { ProjectsForm } from "@/components/editor/forms/ProjectsForm";
import { PublicationsForm } from "@/components/editor/forms/PublicationsForm";
import { useEditor } from "@/lib/contexts";

export function ProjectsTab() {
    const { resume, updateField, save } = useEditor();

    const handleSectionSave = async () => {
        await save();
    };

    return (
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
    );
}
