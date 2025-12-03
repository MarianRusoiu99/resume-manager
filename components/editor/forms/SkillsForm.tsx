'use client';

import React, { useState } from 'react';
import { SimpleFormField } from '@/components/ui/simple-form-field';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import type { Skill } from '@/lib/validations/jsonresume';
import { useListForm } from '@/hooks/use-list-form';
import { FormList } from '@/components/ui/form-list';

interface SkillsFormProps {
  skills: Skill[];
  onChange: (skills: Skill[]) => void;
}

export default function SkillsForm({ skills = [], onChange }: SkillsFormProps) {
  const { items, addItem, removeItem, updateItem } = useListForm<Skill>({
    initialItems: skills,
    onChange,
    newItemTemplate: {
      name: "",
      level: "",
      keywords: [],
    },
  });

  const [newKeyword, setNewKeyword] = useState<Record<number, string>>({});

  const handleAddKeyword = (skillIndex: number, keyword: string) => {
    const trimmedKeyword = keyword.trim();
    if (!trimmedKeyword) return;

    const skill = items[skillIndex];
    const keywords = skill.keywords || [];

    if (!keywords.includes(trimmedKeyword)) {
      updateItem(skillIndex, "keywords", [...keywords, trimmedKeyword]);
    }

    setNewKeyword(prev => ({ ...prev, [skillIndex]: '' }));
  };

  const handleRemoveKeyword = (skillIndex: number, keywordIndex: number) => {
    const skill = items[skillIndex];
    const keywords = skill.keywords || [];

    updateItem(skillIndex, "keywords", keywords.filter((_, i) => i !== keywordIndex));
  };

  return (
    <FormList
      items={items}
      onAdd={addItem}
      onRemove={removeItem}
      addButtonText="Add Skill Category"
      emptyMessage="No skills added yet. Click 'Add Skill Category' to get started."
      renderItem={(skill, index) => (
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
          <SimpleFormField
            id={`skill-name-${index}`}
            label="Category Name"
            value={skill.name || ""}
            onChange={(value) => updateItem(index, "name", value)}
            placeholder="e.g., Web Development"
            required
          />

          <SimpleFormField
            id={`skill-level-${index}`}
            label="Level"
            value={skill.level || ""}
            onChange={(value) => updateItem(index, "level", value)}
            placeholder="e.g., Master, Intermediate"
          />

          {/* Keywords Management */}
          <div className="sm:col-span-2 space-y-2">
            <label className="text-sm font-medium">
              Keywords / Technologies
            </label>
            <div className="flex gap-2">
              <Input
                type="text"
                value={newKeyword[index] || ''}
                onChange={(e) => setNewKeyword(prev => ({
                  ...prev,
                  [index]: e.target.value
                }))}
                placeholder="e.g., JavaScript, React, Node.js"
                className="flex-1"
                onKeyPress={(e) => {
                  if (e.key === 'Enter') {
                    e.preventDefault();
                    handleAddKeyword(index, newKeyword[index] || '');
                  }
                }}
              />
              <Button
                type="button"
                onClick={() => handleAddKeyword(index, newKeyword[index] || '')}
                variant="secondary"
              >
                Add
              </Button>
            </div>
            <div className="flex flex-wrap gap-2">
              {(skill.keywords || []).map((keyword, keywordIndex) => (
                <span
                  key={keywordIndex}
                  className="inline-flex items-center px-3 py-1 rounded-full text-sm bg-secondary text-secondary-foreground"
                >
                  {keyword}
                  <button
                    type="button"
                    onClick={() => handleRemoveKeyword(index, keywordIndex)}
                    className="ml-2 hover:text-destructive focus:outline-none"
                    aria-label={`Remove ${keyword}`}
                  >
                    ×
                  </button>
                </span>
              ))}
            </div>
            <p className="text-sm text-muted-foreground">
              Press Enter or click Add to add keywords
            </p>
          </div>
        </div>
      )}
    />
  );
}
