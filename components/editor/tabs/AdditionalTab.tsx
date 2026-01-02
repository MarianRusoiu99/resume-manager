import { TabsContent } from "@/components/ui/tabs";
import { ProfileSection } from "@/components/editor/forms/ProfileSection";
import { AwardsForm } from "@/components/editor/forms/AwardsForm";
import { InterestsForm } from "@/components/editor/forms/InterestsForm";
import { ReferencesForm } from "@/components/editor/forms/ReferencesForm";
import { useEditor } from "@/lib/contexts";

export function AdditionalTab() {
    const { resume, updateField, save } = useEditor();

    const handleSectionSave = async () => {
        await save();
    };

    return (
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
    );
}
