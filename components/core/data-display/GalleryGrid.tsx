
import { cn } from "@/lib/utils";

interface GalleryGridProps extends React.HTMLAttributes<HTMLDivElement> {
  cols?: number;
  children: React.ReactNode;
}

export function GalleryGrid({
  children,
  className,
  cols = 3,
  ...props
}: GalleryGridProps) {
  return (
    <div
      className={cn(
        "grid gap-6",
        "grid-cols-1 md:grid-cols-2",
        {
          "lg:grid-cols-1": cols === 1,
          "lg:grid-cols-2": cols === 2,
          "lg:grid-cols-3": cols === 3,
          "lg:grid-cols-4": cols === 4,
        },
        className
      )}
      {...props}
    >
      {children}
    </div>
  );
}
