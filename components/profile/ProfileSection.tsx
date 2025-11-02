"use client";

import { ReactNode } from "react";
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";

interface ProfileSectionProps {
  title: string;
  description: string;
  children: ReactNode;
  onSave: () => void;
  saveButtonText?: string;
  isLoading?: boolean;
}

export function ProfileSection({
  title,
  description,
  children,
  onSave,
  saveButtonText = "Save",
  isLoading = false,
}: ProfileSectionProps) {
  return (
    <Card>
      <CardHeader>
        <CardTitle>{title}</CardTitle>
        <CardDescription>{description}</CardDescription>
      </CardHeader>
      <CardContent>
        {children}
        <div className="mt-4 flex justify-end">
          <Button onClick={onSave} disabled={isLoading}>
            {isLoading ? "Saving..." : saveButtonText}
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}
