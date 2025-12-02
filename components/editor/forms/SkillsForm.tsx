'use client';

import React, { useState } from 'react';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import type { Skill } from '@/lib/validations/jsonresume';
import { useListForm } from '@/hooks/use-list-form';
import { FormList } from '@/components/ui/form-list';

interface SkillsFormProps {
  skills: Skill[];
  onChange: (skills: Skill[]) => void;
  errors?: Record<string, string>;
}

export default function SkillsForm({ skills = [], onChange, errors }: SkillsFormProps) {
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
    <div className="space-y-6">
      <FormList
        items={items}
        onAdd={addItem}
        onRemove={removeItem}
        addButtonText="Add Skill Category"
        emptyMessage="No skills added yet. Click 'Add Skill Category' to get started."
        renderItem={(skill, index) => (
          <div className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Category Name
                </label>
                <Input
                  value={skill.name || ""}
                  onChange={(e) => updateItem(index, "name", e.target.value)}
                  placeholder="e.g., Web Development"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Level (Optional)
                </label>
                <Input
                  value={skill.level || ""}
                  onChange={(e) => updateItem(index, "level", e.target.value)}
                  placeholder="e.g., Master, Intermediate"
                />
              </div>
            </div>

            {/* Keywords Management */}
            <div>
              <label className="block text-sm font-medium text-gray-600 mb-2">
                Keywords / Technologies
              </label>
              <div className="flex space-x-2 mb-2">
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
                    className="inline-flex items-center px-3 py-1 rounded-full text-sm bg-blue-100 text-blue-800"
                  >
                    {keyword}
                    <button
                      type="button"
                      onClick={() => handleRemoveKeyword(index, keywordIndex)}
                      className="ml-2 text-blue-600 hover:text-blue-800 focus:outline-none"
                      aria-label={`Remove ${keyword}`}
                    >
                      ×
                    </button>
                  </span>
                ))}
              </div>
            </div>
          </div>
        )}
      />

      {errors?.skills && (
        <p className="text-sm text-red-600">{errors.skills}</p>
      )}

      <p className="text-sm text-gray-600">
        <strong>JSON Resume Format:</strong> Each skill category can have a name, optional level, and keywords.
        Example: &quot;Web Development&quot; with keywords &quot;HTML&quot;, &quot;CSS&quot;, &quot;JavaScript&quot;.
      </p>
    </div>
  );
}
