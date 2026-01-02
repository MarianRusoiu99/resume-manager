import { TabsContent } from "@/components/ui/tabs";
import { ProfileSection } from "@/components/editor/forms/ProfileSection";
import { ExperienceForm } from "@/components/editor/forms/ExperienceForm";
import { VolunteerForm } from "@/components/editor/forms/VolunteerForm";
import { useEditor } from "@/lib/contexts";

export function ExperienceTab() {
    const { resume, updateField, save } = useEditor();

    const handleSectionSave = async () => {
        await save();
    };

    return (
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
    );
}
