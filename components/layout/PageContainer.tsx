import { ReactNode } from "react";
import { cn } from "@/lib/utils";

interface PageContainerProps {
  children: ReactNode;
  className?: string;
  maxWidth?: "sm" | "md" | "lg" | "xl" | "2xl" | "3xl" | "4xl" | "5xl" | "full";
}

const maxWidthClasses = {
  sm: "max-w-screen-sm",
  md: "max-w-screen-md",
  lg: "max-w-screen-lg",
  xl: "max-w-screen-xl",
  "2xl": "max-w-screen-2xl",
  "3xl": "max-w-5xl",
  "4xl": "max-w-6xl",
  "5xl": "max-w-7xl",
  full: "max-w-full",
};

export function PageContainer({
  children,
  className,
  maxWidth = "5xl",
}: PageContainerProps) {
  return (
    <div
      className={cn(
        "mx-auto w-full px-4 sm:px-8 py-6",
        maxWidthClasses[maxWidth],
        className
      )}
    >
      {children}
    </div>
  );
}
