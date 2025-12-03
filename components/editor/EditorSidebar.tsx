import { TabsList, TabsTrigger } from "@/components/ui/tabs";
import { User, Briefcase, GraduationCap, Code, FolderOpen, MoreHorizontal } from "lucide-react";

export function EditorSidebar() {
    return (
        <TabsList className="w-full justify-start border-b rounded-none bg-muted/50 px-6 overflow-x-auto flex-wrap h-auto">
            <TabsTrigger value="basics" className="gap-2">
                <User className="h-4 w-4" />
                Basics
            </TabsTrigger>
            <TabsTrigger value="experience" className="gap-2">
                <Briefcase className="h-4 w-4" />
                Experience
            </TabsTrigger>
            <TabsTrigger value="education" className="gap-2">
                <GraduationCap className="h-4 w-4" />
                Education
            </TabsTrigger>
            <TabsTrigger value="skills" className="gap-2">
                <Code className="h-4 w-4" />
                Skills
            </TabsTrigger>
            <TabsTrigger value="projects" className="gap-2">
                <FolderOpen className="h-4 w-4" />
                Projects
            </TabsTrigger>
            <TabsTrigger value="more" className="gap-2">
                <MoreHorizontal className="h-4 w-4" />
                More
            </TabsTrigger>
        </TabsList>
    );
}
