"use client";

import { Textarea } from "@/components/ui";

interface SummaryFormProps {
  summary: string;
  onChange: (summary: string) => void;
}

export function SummaryForm({ summary, onChange }: SummaryFormProps) {
  return (
    <div>
      <Textarea
        label="Professional Summary"
        value={summary}
        onChange={(e) => onChange(e.target.value)}
        rows={6}
        placeholder="Write a brief overview of your professional experience, skills, and career goals..."
        helperText="2-4 sentences highlighting your key qualifications"
      />
      <p className="mt-2 text-xs text-gray-500">
        {summary.length} / 1000 characters
      </p>
    </div>
  );
}
