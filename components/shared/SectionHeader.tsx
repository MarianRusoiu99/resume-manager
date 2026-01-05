import { LucideIcon } from "lucide-react";
import { memo } from "react";

interface SectionHeaderProps {
    icon: LucideIcon;
    title: string;
    description?: string;
    className?: string;
}

export const SectionHeader = memo(function SectionHeader({ icon: Icon, title, description, className = "" }: SectionHeaderProps) {
    return (
        <div className={`flex items-center gap-3 ${className}`}>
            <div className="p-2 bg-primary/10 rounded-lg">
                <Icon className="h-5 w-5 text-primary" />
            </div>
            <div>
                <h2 className="font-black text-[11px] uppercase tracking-[0.2em] text-primary">{title}</h2>
                {description && (
                    <p className="text-[10px] uppercase tracking-wider text-muted-foreground mt-0.5">{description}</p>
                )}
            </div>
        </div>
    );
});
