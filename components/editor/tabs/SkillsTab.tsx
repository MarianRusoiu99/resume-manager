import { TabsContent } from "@/components/ui/tabs";
import { ProfileSection } from "@/components/editor/forms/ProfileSection";
import SkillsForm from "@/components/editor/forms/SkillsForm";
import LanguagesForm from "@/components/editor/forms/LanguagesForm";
import { useEditor } from "@/lib/contexts";
import type { Skill, Language } from "@/lib/validations/jsonresume";

export function SkillsTab() {
    const { resume, updateField, save } = useEditor();

    const handleSectionSave = async () => {
        await save();
    };

    const handleSkillsChange = (skills: Skill[]) => {
        updateField('skills', skills);
    };

    const handleLanguagesChange = (languages: Language[]) => {
        updateField('languages', languages);
    };

    return (
        <TabsContent value="skills" className="space-y-6">
            < ProfileSection
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
    );
}
