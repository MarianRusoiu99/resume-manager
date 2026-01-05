import { ReactNode, memo } from "react";
import { Card } from "@/components/ui/card";
import { cn } from "@/lib/utils";

interface GlassCardProps {
    children: ReactNode;
    className?: string;
}

export const GlassCard = memo(function GlassCard({ children, className }: GlassCardProps) {
    return (
        <Card className={cn(
            "rounded-xl border-none shadow-sm bg-card/50 backdrop-blur-sm overflow-hidden",
            className
        )}>
            {children}
        </Card>
    );
});
