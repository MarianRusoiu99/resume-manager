import { TabsContent } from "@/components/ui/tabs";
import { ProfileSection } from "@/components/editor/forms/ProfileSection";
import { EducationForm } from "@/components/editor/forms/EducationForm";
import CertificationsForm from "@/components/editor/forms/CertificationsForm";
import { useEditor } from "@/lib/contexts";
import type { Certificate } from "@/lib/validations/jsonresume";

export function EducationTab() {
    const { resume, updateField, save } = useEditor();

    const handleSectionSave = async () => {
        await save();
    };

    const handleCertificationsChange = (certificates: Certificate[]) => {
        updateField('certificates', certificates);
    };

    return (
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
    );
}
