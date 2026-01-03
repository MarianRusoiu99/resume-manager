"use client";

import { z } from "zod";
import { ManagedForm } from "@/components/forms/ManagedForm";
import { FieldConfig } from "@/lib/forms/form-schema";

const summarySchema = z.object({
  summary: z.string().max(1000, "Summary must be 1000 characters or less"),
});

type SummaryFormData = z.infer<typeof summarySchema>;

interface SummaryFormProps {
  summary: string;
  onChange: (summary: string) => void;
}

const SUMMARY_FIELDS: FieldConfig<SummaryFormData>[] = [
  { 
    key: 'summary', 
    label: 'Professional Summary', 
    type: 'textarea', 
    rows: 6, 
    placeholder: 'Write a brief overview of your professional experience, skills, and career goals...',
    description: '2-4 sentences highlighting your key qualifications',
    colSpan: 2
  },
];

export function SummaryForm({ summary, onChange }: SummaryFormProps) {
  return (
    <div className="space-y-2">
      <ManagedForm
        schema={summarySchema}
        defaultValues={{ summary: summary || "" }}
        fields={SUMMARY_FIELDS}
        onSubmit={() => {}}
        onUpdate={(data) => onChange(data.summary)}
        autoSave={true}
        debounceMs={300}
      >
        {(form) => (
          <p className="text-xs text-muted-foreground">
            {(form.watch("summary") || "").length} / 1000 characters
          </p>
        )}
      </ManagedForm>
    </div>
  );
}
