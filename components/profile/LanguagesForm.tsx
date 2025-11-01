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

export interface Language {
  id: string;
  language: string;
  proficiency: string;
}

interface LanguagesFormProps {
  languages: Language[];
  onChange: (languages: Language[]) => void;
  errors?: Record<string, string>;
}

const PROFICIENCY_LEVELS = [
  { value: 'native', label: 'Native / Bilingual' },
  { value: 'fluent', label: 'Fluent' },
  { value: 'advanced', label: 'Advanced' },
  { value: 'intermediate', label: 'Intermediate' },
  { value: 'basic', label: 'Basic' },
];

const languageFormSchema = z.object({
  language: z.string().min(1, 'Language is required'),
  proficiency: z.string().min(1, 'Proficiency level is required'),
});

type LanguageFormData = z.infer<typeof languageFormSchema>;

export default function LanguagesForm({
  languages,
  onChange,
  errors,
}: LanguagesFormProps) {
  const [isAdding, setIsAdding] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);

  const form = useForm<LanguageFormData>({
    resolver: zodResolver(languageFormSchema),
    defaultValues: {
      language: '',
      proficiency: 'intermediate',
    },
  });

  const handleAdd = (data: LanguageFormData) => {
    const language: Language = {
      id: crypto.randomUUID(),
      ...data,
    };

    onChange([...languages, language]);
    form.reset();
    setIsAdding(false);
  };

  const handleUpdate = (id: string, data: LanguageFormData) => {
    const updated = languages.map((lang) =>
      lang.id === id ? { ...lang, ...data } : lang
    );
    onChange(updated);
    form.reset();
    setEditingId(null);
  };

  const handleDelete = (id: string) => {
    onChange(languages.filter((lang) => lang.id !== id));
  };

  const startEdit = (lang: Language) => {
    form.reset({
      language: lang.language,
      proficiency: lang.proficiency,
    });
    setEditingId(lang.id);
    setIsAdding(false);
  };

  const cancelEdit = () => {
    form.reset();
    setEditingId(null);
    setIsAdding(false);
  };

  const getProficiencyLabel = (value: string) => {
    return PROFICIENCY_LEVELS.find((level) => level.value === value)?.label || value;
  };

  const getProficiencyColor = (value: string) => {
    switch (value) {
      case 'native':
        return 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-300';
      case 'fluent':
        return 'bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-300';
      case 'advanced':
        return 'bg-purple-100 text-purple-800 dark:bg-purple-900 dark:text-purple-300';
      case 'intermediate':
        return 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-300';
      case 'basic':
        return 'bg-gray-100 text-gray-800 dark:bg-gray-800 dark:text-gray-300';
      default:
        return 'bg-gray-100 text-gray-800 dark:bg-gray-800 dark:text-gray-300';
    }
  };

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h3 className="text-lg font-medium text-gray-900">Languages</h3>
        {!isAdding && !editingId && (
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
        {languages.map((lang) => (
          <Card key={lang.id}>
            {editingId === lang.id ? (
              <CardContent className="pt-6">
                <Form {...form}>
                  <form
                    onSubmit={form.handleSubmit((data) =>
                      handleUpdate(lang.id, data)
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
                      name="proficiency"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Proficiency Level</FormLabel>
                          <Select
                            onValueChange={field.onChange}
                            defaultValue={field.value}
                          >
                            <FormControl>
                              <SelectTrigger>
                                <SelectValue placeholder="Select proficiency level" />
                              </SelectTrigger>
                            </FormControl>
                            <SelectContent>
                              {PROFICIENCY_LEVELS.map((level) => (
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
                      <h4 className="font-medium">{lang.language}</h4>
                      <span
                        className={`px-2 py-1 rounded text-xs font-medium ${getProficiencyColor(
                          lang.proficiency
                        )}`}
                      >
                        {getProficiencyLabel(lang.proficiency)}
                      </span>
                    </div>
                  </div>
                  <div className="flex space-x-2 ml-4">
                    <Button
                      type="button"
                      onClick={() => startEdit(lang)}
                      variant="secondary"
                      size="sm"
                    >
                      Edit
                    </Button>
                    <Button
                      type="button"
                      onClick={() => handleDelete(lang.id)}
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
                  name="proficiency"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Proficiency Level</FormLabel>
                      <Select
                        onValueChange={field.onChange}
                        defaultValue={field.value}
                      >
                        <FormControl>
                          <SelectTrigger>
                            <SelectValue placeholder="Select proficiency level" />
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent>
                          {PROFICIENCY_LEVELS.map((level) => (
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
