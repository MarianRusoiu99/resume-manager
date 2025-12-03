import { ReactNode } from "react";
import { cn } from "@/lib/utils";
import { Card, CardContent } from "@/components/ui/card";

interface SectionContainerProps {
    title?: string;
    description?: string;
    children: ReactNode;
    className?: string;
    contentClassName?: string;
    action?: ReactNode;
}

export function SectionContainer({
    title,
    description,
    children,
    className,
    contentClassName,
    action,
}: SectionContainerProps) {
    return (
        <div className={cn("space-y-4", className)}>
            {(title || description || action) && (
                <div className="flex items-center justify-between px-1">
                    <div className="space-y-1">
                        {title && <h3 className="text-lg font-medium tracking-tight">{title}</h3>}
                        {description && (
                            <p className="text-sm text-muted-foreground">{description}</p>
                        )}
                    </div>
                    {action && <div>{action}</div>}
                </div>
            )}
            <Card>
                <CardContent className={cn("p-6", contentClassName)}>
                    {children}
                </CardContent>
            </Card>
        </div>
    );
}
