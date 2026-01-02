import { TabsContent } from "@/components/ui/tabs";
import { useEditor } from "@/lib/contexts";
import { Button } from "@/components/ui/button";
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from "@/components/ui/collapsible";
import { EDITOR_SECTIONS } from "./config/sections";
import type { Resume } from "@/lib/validations/jsonresume";

export function EditorContent() {
    const { resume, updateField } = useEditor();

    // Helper to get count for additional sections
    const getCount = (id: string, resumeData: Resume) => {
        const key = id === 'certificates' ? 'certificates' : id;
        const val = resumeData[key as keyof Resume];
        return Array.isArray(val) ? val.length : 0;
    };

    return (
        <>
            {EDITOR_SECTIONS.filter(s => s.isPrimary).map(section => (
                <TabsContent key={section.id} value={section.id} className="p-6 focus-visible:outline-none">
                    {section.render({ resume, updateField })}
                </TabsContent>
            ))}

            <TabsContent value="more" className="p-6 space-y-4 focus-visible:outline-none">
                <h3 className="text-lg font-semibold mb-4">Additional Sections</h3>
                {EDITOR_SECTIONS.filter(s => !s.isPrimary).map(section => (
                    <Collapsible key={section.id}>
                        <CollapsibleTrigger asChild>
                            <Button variant="outline" className="w-full justify-between">
                                <span className="font-medium flex items-center gap-2">
                                    {section.icon}
                                    {section.label}
                                </span>
                                <span className="text-sm text-muted-foreground">
                                    {getCount(section.id, resume)} items
                                </span>
                            </Button>
                        </CollapsibleTrigger>
                        <CollapsibleContent className="mt-4 rounded-lg p-4 bg-muted/30">
                            {section.render({ resume, updateField })}
                        </CollapsibleContent>
                    </Collapsible>
                ))}
            </TabsContent>
        </>
    );
}
