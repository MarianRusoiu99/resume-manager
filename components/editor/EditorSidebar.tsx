import { TabsList, TabsTrigger } from "@/components/ui/tabs";
import { MoreHorizontal } from "lucide-react";
import { EDITOR_SECTIONS } from "./config/sections";

export function EditorSidebar() {
    return (
        <TabsList className="w-full justify-start rounded-none bg-muted/40 px-4 py-1.5 overflow-x-auto flex-nowrap h-auto shrink-0 gap-1 border-none">
            {EDITOR_SECTIONS.filter(s => s.isPrimary).map(section => (
                <TabsTrigger key={section.id} value={section.id} className="gap-2 rounded-lg data-[state=active]:bg-background data-[state=active]:shadow-sm px-4 py-2 text-xs font-bold uppercase tracking-widest transition-all">
                    {section.icon}
                    {section.label}
                </TabsTrigger>
            ))}
            <TabsTrigger value="more" className="gap-2 rounded-lg data-[state=active]:bg-background data-[state=active]:shadow-sm px-4 py-2 text-xs font-bold uppercase tracking-widest transition-all">
                <MoreHorizontal className="h-4 w-4" />
                More
            </TabsTrigger>
        </TabsList>
    );
}
