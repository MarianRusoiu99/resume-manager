import { TabsList, TabsTrigger } from "@/components/ui/tabs";
import { MoreHorizontal } from "lucide-react";
import { EDITOR_SECTIONS } from "./config/sections";

export function EditorSidebar() {
    return (
        <TabsList className="w-full justify-start rounded-none bg-muted/20 px-4 overflow-x-auto flex-wrap h-auto shrink-0">
            {EDITOR_SECTIONS.filter(s => s.isPrimary).map(section => (
                <TabsTrigger key={section.id} value={section.id} className="gap-2">
                    {section.icon}
                    {section.label}
                </TabsTrigger>
            ))}
            <TabsTrigger value="more" className="gap-2">
                <MoreHorizontal className="h-4 w-4" />
                More
            </TabsTrigger>
        </TabsList>
    );
}
