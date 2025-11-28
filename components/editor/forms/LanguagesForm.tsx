'use client';

import React, { useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader } from '@/components/ui/card';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from '@/components/ui/form';
import type { Language } from '@/lib/validations/jsonresume';

interface LanguagesFormProps {
  languages: Language[];
  onChange: (languages: Language[]) => void;
  errors?: Record<string, string>;
}

const FLUENCY_LEVELS = [
  { value: 'Native speaker', label: 'Native / Bilingual' },
  { value: 'Fluent', label: 'Fluent' },
  { value: 'Professional working proficiency', label: 'Professional' },
  { value: 'Limited working proficiency', label: 'Intermediate' },
  { value: 'Elementary proficiency', label: 'Basic' },
];

const languageFormSchema = z.object({
  language: z.string().min(1, 'Language is required'),
  fluency: z.string().min(1, 'Fluency level is required'),
});

type LanguageFormData = z.infer<typeof languageFormSchema>;

export default function LanguagesForm({
  languages = [],
  onChange,
  errors,
}: LanguagesFormProps) {
  const [isAdding, setIsAdding] = useState(false);
  const [editingIndex, setEditingIndex] = useState<number | null>(null);

  const form = useForm<LanguageFormData>({
    resolver: zodResolver(languageFormSchema),
    defaultValues: {
      language: '',
      fluency: 'Limited working proficiency',
    },
  });

  const handleAdd = (data: LanguageFormData) => {
    const language: Language = {
      language: data.language,
      fluency: data.fluency,
    };

    onChange([...languages, language]);
    form.reset();
    setIsAdding(false);
  };

  const handleUpdate = (index: number, data: LanguageFormData) => {
    const updated = languages.map((lang, i) =>
      i === index ? { language: data.language, fluency: data.fluency } : lang
    );
    onChange(updated);
    form.reset();
    setEditingIndex(null);
  };

  const handleDelete = (index: number) => {
    onChange(languages.filter((_, i) => i !== index));
  };

  const startEdit = (lang: NonNullable<Language>, index: number) => {
    form.reset({
      language: lang.language || '',
      fluency: lang.fluency || '',
    });
    setEditingIndex(index);
    setIsAdding(false);
  };

  const cancelEdit = () => {
    form.reset();
    setEditingIndex(null);
    setIsAdding(false);
  };

  const getFluencyLabel = (value: string) => {
    return FLUENCY_LEVELS.find((level) => level.value === value)?.label || value;
  };

  const getFluencyColor = (value: string) => {
    if (value.includes('Native')) {
      return 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-300';
    } else if (value.includes('Fluent')) {
      return 'bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-300';
    } else if (value.includes('Professional')) {
      return 'bg-purple-100 text-purple-800 dark:bg-purple-900 dark:text-purple-300';
    } else if (value.includes('Limited')) {
      return 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-300';
    } else {
      return 'bg-gray-100 text-gray-800 dark:bg-gray-800 dark:text-gray-300';
    }
  };

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h3 className="text-lg font-medium text-gray-900">Languages</h3>
        {!isAdding && editingIndex === null && (
          <Button
            type="button"
            onClick={() => setIsAdding(true)}
            variant="secondary"
            size="sm"
          >
            + Add Language
          </Button>
        )}
      </div>

      {errors?.languages && (
        <p className="text-sm text-red-600">{errors.languages}</p>
      )}

      {/* List of existing languages */}
      <div className="space-y-3">
        {languages.filter(lang => lang).map((lang, index) => (
          <Card key={index}>
            {editingIndex === index ? (
              <CardContent className="pt-6">
                <Form {...form}>
                  <form
                    onSubmit={form.handleSubmit((data) =>
                      handleUpdate(index, data)
                    )}
                    className="space-y-4"
                  >
                    <FormField
                      control={form.control}
                      name="language"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Language</FormLabel>
                          <FormControl>
                            <Input
                              {...field}
                              placeholder="e.g., Spanish, Mandarin, French"
                            />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />

                    <FormField
                      control={form.control}
                      name="fluency"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Fluency Level</FormLabel>
                          <Select
                            onValueChange={field.onChange}
                            defaultValue={field.value}
                          >
                            <FormControl>
                              <SelectTrigger>
                                <SelectValue placeholder="Select fluency level" />
                              </SelectTrigger>
                            </FormControl>
                            <SelectContent>
                              {FLUENCY_LEVELS.map((level) => (
                                <SelectItem key={level.value} value={level.value}>
                                  {level.label}
                                </SelectItem>
                              ))}
                            </SelectContent>
                          </Select>
                          <FormMessage />
                        </FormItem>
                      )}
                    />

                    <div className="flex space-x-2">
                      <Button type="submit">Save</Button>
                      <Button
                        type="button"
                        onClick={cancelEdit}
                        variant="secondary"
                      >
                        Cancel
                      </Button>
                    </div>
                  </form>
                </Form>
              </CardContent>
            ) : (
              <CardContent className="pt-6">
                <div className="flex items-center justify-between">
                  <div className="flex-1">
                    <div className="flex items-center space-x-3">
                      <h4 className="font-medium">{lang!.language}</h4>
                      <span
                        className={`px-2 py-1 rounded text-xs font-medium ${getFluencyColor(
                          lang!.fluency || ''
                        )}`}
                      >
                        {getFluencyLabel(lang!.fluency || '')}
                      </span>
                    </div>
                  </div>
                  <div className="flex space-x-2 ml-4">
                    <Button
                      type="button"
                      onClick={() => startEdit(lang!, index)}
                      variant="secondary"
                      size="sm"
                    >
                      Edit
                    </Button>
                    <Button
                      type="button"
                      onClick={() => handleDelete(index)}
                      variant="destructive"
                      size="sm"
                    >
                      Delete
                    </Button>
                  </div>
                </div>
              </CardContent>
            )}
          </Card>
        ))}
      </div>

      {/* Add new language form */}
      {isAdding && (
        <Card>
          <CardHeader>
            <h4 className="font-medium">New Language</h4>
          </CardHeader>
          <CardContent>
            <Form {...form}>
              <form
                onSubmit={form.handleSubmit(handleAdd)}
                className="space-y-4"
              >
                <FormField
                  control={form.control}
                  name="language"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Language</FormLabel>
                      <FormControl>
                        <Input
                          {...field}
                          placeholder="e.g., Spanish, Mandarin, French"
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="fluency"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Fluency Level</FormLabel>
                      <Select
                        onValueChange={field.onChange}
                        defaultValue={field.value}
                      >
                        <FormControl>
                          <SelectTrigger>
                            <SelectValue placeholder="Select fluency level" />
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent>
                          {FLUENCY_LEVELS.map((level) => (
                            <SelectItem key={level.value} value={level.value}>
                              {level.label}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <div className="flex space-x-2">
                  <Button type="submit">Add Language</Button>
                  <Button
                    type="button"
                    onClick={cancelEdit}
                    variant="secondary"
                  >
                    Cancel
                  </Button>
                </div>
              </form>
            </Form>
          </CardContent>
        </Card>
      )}

      {languages.length === 0 && !isAdding && (
        <Card>
          <CardContent className="p-6 text-center">
            <p className="text-muted-foreground mb-3">No languages added yet</p>
            <Button
              type="button"
              onClick={() => setIsAdding(true)}
              variant="secondary"
              size="sm"
            >
              Add Your First Language
            </Button>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
