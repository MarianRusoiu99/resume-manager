"use client";

import { useEffect } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
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
  const form = useForm<SummaryFormData>({
    resolver: zodResolver(summarySchema),
    defaultValues: {
      summary: summary || "",
    },
  });

  const currentSummary = form.watch("summary");

  // Reset form when summary prop changes (only when externally updated)
  useEffect(() => {
    // Only reset if the prop is different from current form value
    if (summary !== currentSummary) {
      form.reset({ summary }, { keepDefaultValues: false });
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [summary]); // Only depend on summary prop, not form

  // Call onChange when form value changes (debounced to avoid rapid updates)
  useEffect(() => {
    // Only call onChange if value actually changed from prop
    if (currentSummary !== summary) {
      const timeoutId = setTimeout(() => {
        onChange(currentSummary);
      }, 300); // 300ms debounce
      
      return () => clearTimeout(timeoutId);
    }
  }, [currentSummary, onChange, summary]);

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
