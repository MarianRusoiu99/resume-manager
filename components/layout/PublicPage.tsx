import { ReactNode } from "react";
import { ThemeToggle } from "@/components/shared/ThemeToggle";
import { PageContainer } from "./PageContainer";
import { cn } from "@/lib/utils";

interface PublicPageProps {
  children: ReactNode;
  className?: string;
  maxWidth?: "sm" | "md" | "lg" | "xl" | "2xl" | "3xl" | "4xl" | "5xl" | "full";
  showThemeToggle?: boolean;
}

export function PublicPage({
  children,
  className,
  maxWidth = "5xl",
  showThemeToggle = true,
}: PublicPageProps) {
  return (
    <div className="min-h-screen bg-background relative">
      {showThemeToggle && (
        <div className="absolute top-4 right-4 z-10">
          <ThemeToggle />
        </div>
      )}
      <PageContainer 
        maxWidth={maxWidth} 
        className={cn("min-h-screen flex flex-col", className)}
      >
        {children}
      </PageContainer>
    </div>
  );
}
