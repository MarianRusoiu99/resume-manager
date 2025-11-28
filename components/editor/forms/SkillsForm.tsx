'use client';

import React, { useState } from 'react';
import { Input, Button } from '@/components/ui';
import type { Skill } from '@/lib/validations/jsonresume';

interface SkillsFormProps {
  skills: Skill[];
  onChange: (skills: Skill[]) => void;
  errors?: Record<string, string>;
}

export default function SkillsForm({ skills = [], onChange, errors }: SkillsFormProps) {
  const [newSkillName, setNewSkillName] = useState('');
  const [newSkillLevel, setNewSkillLevel] = useState('');
  const [newKeyword, setNewKeyword] = useState<Record<number, string>>({});

  const handleAddSkill = () => {
    const trimmedName = newSkillName.trim();
    if (!trimmedName) return;

    const newSkill: Skill = {
      name: trimmedName,
      level: newSkillLevel.trim() || undefined,
      keywords: [],
    };

    onChange([...skills.filter((s): s is NonNullable<Skill> => !!s), newSkill]);
    setNewSkillName('');
    setNewSkillLevel('');
  };

  const handleRemoveSkill = (index: number) => {
    onChange(skills.filter((_, i) => i !== index).filter((s): s is NonNullable<Skill> => !!s));
  };

  const handleUpdateSkill = (index: number, updates: Partial<Skill>) => {
    const updated = skills.map((skill, i) =>
      i === index ? { ...skill, ...updates } : skill
    );
    onChange(updated.filter((s): s is NonNullable<Skill> => !!s));
  };

  const handleAddKeyword = (skillIndex: number, keyword: string) => {
    const trimmedKeyword = keyword.trim();
    if (!trimmedKeyword) return;

    const skill = skills[skillIndex];
    const keywords = skill!.keywords || [];

    if (!keywords.includes(trimmedKeyword)) {
      handleUpdateSkill(skillIndex, {
        keywords: [...keywords, trimmedKeyword]
      });
    }

    setNewKeyword(prev => ({ ...prev, [skillIndex]: '' }));
  };

  const handleRemoveKeyword = (skillIndex: number, keywordIndex: number) => {
    const skill = skills[skillIndex];
    const keywords = skill!.keywords || [];

    handleUpdateSkill(skillIndex, {
      keywords: keywords.filter((_, i) => i !== keywordIndex)
    });
  };

  return (
    <div className="space-y-6">
      {/* Add New Skill */}
      <div className="border-2 border-dashed border-gray-300 rounded-lg p-4">
        <h3 className="text-sm font-medium  mb-3">Add New Skill Category</h3>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
          <Input
            type="text"
            value={newSkillName}
            onChange={(e) => setNewSkillName(e.target.value)}
            placeholder="Skill category (e.g., Web Development)"
            onKeyPress={(e) => {
              if (e.key === 'Enter') {
                e.preventDefault();
                handleAddSkill();
              }
            }}
          />
          <Input
            type="text"
            value={newSkillLevel}
            onChange={(e) => setNewSkillLevel(e.target.value)}
            placeholder="Level (e.g., Master, Intermediate)"
            onKeyPress={(e) => {
              if (e.key === 'Enter') {
                e.preventDefault();
                handleAddSkill();
              }
            }}
          />
          <Button
            type="button"
            onClick={handleAddSkill}
            variant="secondary"
            className="w-full"
          >
            Add Skill
          </Button>
        </div>
      </div>

      {/* Existing Skills */}
      {skills.length === 0 ? (
        <p className="text-sm text-gray-500 text-center py-4">
          No skills added yet. Add your first skill category above.
        </p>
      ) : (
        <div className="space-y-4">
          {skills.map((skill, skillIndex) => (
            <div key={skillIndex} className="border border-gray-200 rounded-lg p-4">
              <div className="flex justify-between items-start mb-3">
                <div className="flex-1">
                  <h4 className="font-medium text-gray-900">
                    {skill!.name}
                    {skill!.level && (
                      <span className="ml-2 text-sm text-gray-500">({skill!.level})</span>
                    )}
                  </h4>
                </div>
                <Button
                  type="button"
                  onClick={() => handleRemoveSkill(skillIndex)}
                  variant="ghost"
                  className="text-red-600 hover:text-red-800 h-auto p-1"
                >
                  Remove
                </Button>
              </div>

              {/* Keywords */}
              <div>
                <label className="block text-sm font-medium text-gray-600 mb-2">
                  Keywords / Technologies
                </label>
                <div className="flex space-x-2 mb-2">
                  <Input
                    type="text"
                    value={newKeyword[skillIndex] || ''}
                    onChange={(e) => setNewKeyword(prev => ({
                      ...prev,
                      [skillIndex]: e.target.value
                    }))}
                    placeholder="e.g., JavaScript, React, Node.js"
                    className="flex-1"
                    onKeyPress={(e) => {
                      if (e.key === 'Enter') {
                        e.preventDefault();
                        handleAddKeyword(skillIndex, newKeyword[skillIndex] || '');
                      }
                    }}
                  />
                  <Button
                    type="button"
                    onClick={() => handleAddKeyword(skillIndex, newKeyword[skillIndex] || '')}
                    variant="secondary"
                  >
                    Add
                  </Button>
                </div>
                <div className="flex flex-wrap gap-2">
                  {(skill!.keywords || []).map((keyword, keywordIndex) => (
                    <span
                      key={keywordIndex}
                      className="inline-flex items-center px-3 py-1 rounded-full text-sm bg-blue-100 text-blue-800"
                    >
                      {keyword}
                      <button
                        type="button"
                        onClick={() => handleRemoveKeyword(skillIndex, keywordIndex)}
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
          ))}
        </div>
      )}

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
