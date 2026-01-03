import { TabsContent } from "@/components/ui/tabs";
import { useEditor } from "@/lib/contexts";
import { Button } from "@/components/ui/button";
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from "@/components/ui/collapsible";
import { EDITOR_CONFIG, EditorSection } from "@/lib/constants/editor-config";
import type { Resume } from "@/lib/validations/jsonresume";
import { ManagedForm } from "@/components/forms/ManagedForm";
import { GenericFormList } from "@/components/forms/GenericFormList";
import { ChevronDown } from "lucide-react";

export function EditorContent() {
    const { resume, updateField } = useEditor();

    const getCount = (section: EditorSection, resumeData: Resume) => {
        const val = resumeData[section.field as keyof Resume];
        return Array.isArray(val) ? val.length : 0;
    };

    const renderSection = (section: EditorSection) => {
        if (section.type === 'object') {
            if (!section.schema) {
                return <div className="text-muted-foreground">No schema defined for this section</div>;
            }
            
            const data = resume[section.field as keyof Resume];
            const formData = section.toForm ? section.toForm(data) : data;

            return (
                <ManagedForm
                    schema={section.schema}
                    defaultValues={formData}
                    fields={section.fields || []}
                    onSubmit={() => {}}
                    onUpdate={(updatedFormData) => {
                        const updatedData = section.fromForm 
                            ? section.fromForm(updatedFormData) 
                            : updatedFormData;
                        
                        // If it's a nested update (like summary in basics)
                        if (section.field === 'basics' && section.id === 'summary') {
                            updateField('basics', { ...resume.basics, ...updatedData });
                        } else {
                            updateField(section.field as keyof Resume, updatedData);
                        }
                    }}
                    autoSave
                />
            );
        }

        if (section.type === 'list') {
            if (!section.config) {
                return <div className="text-muted-foreground">No config defined for this section</div>;
            }
            
            const items = (resume[section.field as keyof Resume] || []) as Record<string, unknown>[];
            return (
                <GenericFormList
                    schema={section.config}
                    items={items}
                    onChange={(newItems) => updateField(section.field as keyof Resume, newItems)}
                />
            );
        }

        return null;
    };

    return (
        <div className="h-full overflow-y-auto">
            {EDITOR_CONFIG.filter(s => s.isPrimary).map(section => (
                <TabsContent key={section.id} value={section.id} className="p-6 focus-visible:outline-none mt-0">
                    <div className="mb-6">
                        <h2 className="text-2xl font-bold tracking-tight">{section.label}</h2>
                        {section.description && (
                            <p className="text-muted-foreground">{section.description}</p>
                        )}
                    </div>
                    {renderSection(section)}
                </TabsContent>
            ))}

            <TabsContent value="more" className="p-6 space-y-4 focus-visible:outline-none mt-0">
                <div className="mb-6">
                    <h2 className="text-2xl font-bold tracking-tight">Additional Sections</h2>
                    <p className="text-muted-foreground">Add more information to your resume</p>
                </div>
                {EDITOR_CONFIG.filter(s => !s.isPrimary).map(section => (
                    <Collapsible key={section.id} className="border rounded-lg overflow-hidden bg-card">
                        <CollapsibleTrigger asChild>
                            <Button variant="ghost" className="w-full justify-between p-4 h-auto hover:bg-muted/50 rounded-none">
                                <div className="flex items-center gap-3">
                                    <div className="p-2 rounded-md bg-primary/10 text-primary">
                                        <section.icon className="h-4 w-4" />
                                    </div>
                                    <div className="text-left">
                                        <div className="font-semibold">{section.label}</div>
                                        <div className="text-xs text-muted-foreground">
                                            {getCount(section, resume)} items added
                                        </div>
                                    </div>
                                </div>
                                <ChevronDown className="h-4 w-4 text-muted-foreground transition-transform duration-200" />
                            </Button>
                        </CollapsibleTrigger>
                        <CollapsibleContent className="p-4 border-t bg-muted/5">
                            {renderSection(section)}
                        </CollapsibleContent>
                    </Collapsible>
                ))}
            </TabsContent>
        </div>
    );
}
