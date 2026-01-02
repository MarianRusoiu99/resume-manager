"use client";

import { useAutoSaveForm } from "@/hooks/useAutoSaveForm";
import * as z from "zod";
import { Textarea } from "@/components/ui/textarea";
import {
  Form,
  FormControl,
  FormDescription,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";

const summarySchema = z.object({
  summary: z.string().max(1000, "Summary must be 1000 characters or less"),
});

type SummaryFormData = z.infer<typeof summarySchema>;

interface SummaryFormProps {
  summary: string;
  onChange: (summary: string) => void;
}

export function SummaryForm({ summary, onChange }: SummaryFormProps) {
  const form = useAutoSaveForm<SummaryFormData>({
    schema: summarySchema,
    onSave: (data) => onChange(data.summary),
    defaultValues: {
      summary: summary || "",
    },
    debounceMs: 300,
  });

  const currentSummary = form.watch("summary") || "";

  return (
    <Form {...form}>
      <div className="space-y-2">
        <FormField
          control={form.control}
          name="summary"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Professional Summary</FormLabel>
              <FormControl>
                <Textarea
                  {...field}
                  rows={6}
                  placeholder="Write a brief overview of your professional experience, skills, and career goals..."
                />
              </FormControl>
              <FormDescription>
                2-4 sentences highlighting your key qualifications
              </FormDescription>
              <FormMessage />
            </FormItem>
          )}
        />
        <p className="text-xs text-muted-foreground">
          {currentSummary.length} / 1000 characters
        </p>
      </div>
    </Form>
  );
}
