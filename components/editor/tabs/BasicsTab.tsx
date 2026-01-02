import { TabsContent } from "@/components/ui/tabs";
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from "@/components/ui/card";
import { PersonalInfoForm } from "@/components/editor/forms/PersonalInfoForm";
import { SummaryForm } from "@/components/editor/forms/SummaryForm";
import { ProfileSection } from "@/components/editor/forms/ProfileSection";
import { ImportFromJSON } from "@/components/editor/ImportFromJSON";
import { useEditor } from "@/lib/contexts";
import type { Basics } from "@/lib/validations/jsonresume";

interface BasicsTabProps {
    readonly showParser?: boolean;
    readonly parserComponent?: React.ReactNode;
}

export function BasicsTab({ showParser, parserComponent }: BasicsTabProps) {
    const { resume, updateField, save } = useEditor();

    const handlePersonalInfoSave = async (data?: Basics) => {
        if (!data) return;
        updateField('basics', data);
    };

    const handleSectionSave = async () => {
        await save();
    };

    return (
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
    );
}
