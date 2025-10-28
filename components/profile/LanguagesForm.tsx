'use client';

import React, { useState } from 'react';
import { Input } from '@/components/ui/Input';
import { Button } from '@/components/ui/Button';
import { Card } from '@/components/ui/Card';

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

export default function LanguagesForm({
  languages,
  onChange,
  errors,
}: LanguagesFormProps) {
  const [isAdding, setIsAdding] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);

  const emptyEntry: Omit<Language, 'id'> = {
    language: '',
    proficiency: 'intermediate',
  };

  const [newEntry, setNewEntry] = useState(emptyEntry);

  const handleAdd = () => {
    if (!newEntry.language.trim()) {
      return;
    }

    const language: Language = {
      id: Date.now().toString(),
      ...newEntry,
    };

    onChange([...languages, language]);
    setNewEntry(emptyEntry);
    setIsAdding(false);
  };

  const handleUpdate = (id: string) => {
    const updated = languages.map((lang) =>
      lang.id === id ? { ...lang, ...newEntry } : lang
    );
    onChange(updated);
    setNewEntry(emptyEntry);
    setEditingId(null);
  };

  const handleDelete = (id: string) => {
    onChange(languages.filter((lang) => lang.id !== id));
  };

  const startEdit = (lang: Language) => {
    setNewEntry({
      language: lang.language,
      proficiency: lang.proficiency,
    });
    setEditingId(lang.id);
    setIsAdding(false);
  };

  const cancelEdit = () => {
    setNewEntry(emptyEntry);
    setEditingId(null);
    setIsAdding(false);
  };

  const getProficiencyLabel = (value: string) => {
    return PROFICIENCY_LEVELS.find((level) => level.value === value)?.label || value;
  };

  const getProficiencyColor = (value: string) => {
    switch (value) {
      case 'native':
        return 'bg-green-100 text-green-800';
      case 'fluent':
        return 'bg-blue-100 text-blue-800';
      case 'advanced':
        return 'bg-purple-100 text-purple-800';
      case 'intermediate':
        return 'bg-yellow-100 text-yellow-800';
      case 'basic':
        return 'bg-gray-100 text-gray-800';
      default:
        return 'bg-gray-100 text-gray-800';
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
          <Card key={lang.id} className="p-4">
            {editingId === lang.id ? (
              <div className="space-y-3">
                <Input
                  label="Language"
                  value={newEntry.language}
                  onChange={(e: React.ChangeEvent<HTMLInputElement>) =>
                    setNewEntry({ ...newEntry, language: e.target.value })
                  }
                  placeholder="e.g., Spanish, Mandarin, French"
                  required
                />
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Proficiency Level
                  </label>
                  <select
                    value={newEntry.proficiency}
                    onChange={(e) =>
                      setNewEntry({ ...newEntry, proficiency: e.target.value })
                    }
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                  >
                    {PROFICIENCY_LEVELS.map((level) => (
                      <option key={level.value} value={level.value}>
                        {level.label}
                      </option>
                    ))}
                  </select>
                </div>
                <div className="flex space-x-2">
                  <Button
                    type="button"
                    onClick={() => handleUpdate(lang.id)}
                    disabled={!newEntry.language.trim()}
                  >
                    Save
                  </Button>
                  <Button
                    type="button"
                    onClick={cancelEdit}
                    variant="secondary"
                  >
                    Cancel
                  </Button>
                </div>
              </div>
            ) : (
              <div>
                <div className="flex items-center justify-between">
                  <div className="flex-1">
                    <div className="flex items-center space-x-3">
                      <h4 className="font-medium text-gray-900">{lang.language}</h4>
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
                      variant="danger"
                      size="sm"
                    >
                      Delete
                    </Button>
                  </div>
                </div>
              </div>
            )}
          </Card>
        ))}
      </div>

      {/* Add new language form */}
      {isAdding && (
        <Card className="p-4">
          <h4 className="font-medium text-gray-900 mb-4">New Language</h4>
          <div className="space-y-3">
            <Input
              label="Language"
              value={newEntry.language}
              onChange={(e: React.ChangeEvent<HTMLInputElement>) =>
                setNewEntry({ ...newEntry, language: e.target.value })
              }
              placeholder="e.g., Spanish, Mandarin, French"
              required
            />
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Proficiency Level
              </label>
              <select
                value={newEntry.proficiency}
                onChange={(e) =>
                  setNewEntry({ ...newEntry, proficiency: e.target.value })
                }
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              >
                {PROFICIENCY_LEVELS.map((level) => (
                  <option key={level.value} value={level.value}>
                    {level.label}
                  </option>
                ))}
              </select>
            </div>
            <div className="flex space-x-2">
              <Button
                type="button"
                onClick={handleAdd}
                disabled={!newEntry.language.trim()}
              >
                Add Language
              </Button>
              <Button
                type="button"
                onClick={cancelEdit}
                variant="secondary"
              >
                Cancel
              </Button>
            </div>
          </div>
        </Card>
      )}

      {languages.length === 0 && !isAdding && (
        <Card className="p-6 text-center">
          <p className="text-gray-500 mb-3">No languages added yet</p>
          <Button
            type="button"
            onClick={() => setIsAdding(true)}
            variant="secondary"
            size="sm"
          >
            Add Your First Language
          </Button>
        </Card>
      )}
    </div>
  );
}
