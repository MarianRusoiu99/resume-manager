"use client"

import { useTheme } from "next-themes"
import { Toaster as Sonner } from "sonner"

type ToasterProps = React.ComponentProps<typeof Sonner>

const Toaster = ({ ...props }: ToasterProps) => {
  const { theme = "system" } = useTheme()

  return (
    <Sonner
      theme={theme as ToasterProps["theme"]}
      className="toaster group"
      style={{
        '--width': '500px',
      } as React.CSSProperties}
      toastOptions={{
        classNames: {
          toast:
            "group toast group-[.toaster]:bg-background group-[.toaster]:text-foreground group-[.toaster]:border-border group-[.toaster]:shadow-lg group-[.toaster]:w-[500px] group-[.toaster]:max-w-[calc(100vw-2rem)]",
          title: "group-[.toast]:truncate group-[.toast]:max-w-full group-[.toast]:font-medium",
          description: "group-[.toast]:text-muted-foreground group-[.toast]:line-clamp-2",
          actionButton:
            "group-[.toast]:bg-primary group-[.toast]:text-primary-foreground group-[.toast]:shrink-0",
          cancelButton:
            "group-[.toast]:bg-muted group-[.toast]:text-muted-foreground group-[.toast]:shrink-0",
        },
      }}
      {...props}
    />
  )
}

export { Toaster }
