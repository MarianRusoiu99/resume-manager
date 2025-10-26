'use client';

import React, { useState, KeyboardEvent } from 'react';
import { Input } from '@/components/ui/Input';
import { Button } from '@/components/ui/Button';

export interface SkillsData {
  technical: string[];
  soft: string[];
  languages: string[];
}

interface SkillsFormProps {
  skills: SkillsData;
  onChange: (skills: SkillsData) => void;
  errors?: Record<string, string>;
}

export default function SkillsForm({ skills, onChange, errors }: SkillsFormProps) {
  const [technicalInput, setTechnicalInput] = useState('');
  const [softInput, setSoftInput] = useState('');
  const [languageInput, setLanguageInput] = useState('');

  const handleAddSkill = (type: 'technical' | 'soft' | 'languages', value: string) => {
    const trimmedValue = value.trim();
    if (!trimmedValue) return;
    
    if (!skills[type].includes(trimmedValue)) {
      onChange({
        ...skills,
        [type]: [...skills[type], trimmedValue]
      });
    }
    
    // Clear input after adding
    if (type === 'technical') setTechnicalInput('');
    if (type === 'soft') setSoftInput('');
    if (type === 'languages') setLanguageInput('');
  };

  const handleRemoveSkill = (type: 'technical' | 'soft' | 'languages', index: number) => {
    onChange({
      ...skills,
      [type]: skills[type].filter((_, i) => i !== index)
    });
  };

  const handleKeyPress = (
    e: KeyboardEvent<HTMLInputElement>,
    type: 'technical' | 'soft' | 'languages',
    value: string
  ) => {
    if (e.key === 'Enter') {
      e.preventDefault();
      handleAddSkill(type, value);
    }
  };

  return (
    <div className="space-y-6">
      {/* Technical Skills */}
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-2">
          Technical Skills
        </label>
        <div className="flex space-x-2 mb-3">
          <Input
            type="text"
            value={technicalInput}
            onChange={(e: React.ChangeEvent<HTMLInputElement>) => setTechnicalInput(e.target.value)}
            onKeyPress={(e: React.KeyboardEvent<HTMLInputElement>) => handleKeyPress(e, 'technical', technicalInput)}
            placeholder="e.g., JavaScript, Python, AWS"
            className="flex-1"
          />
          <Button
            type="button"
            onClick={() => handleAddSkill('technical', technicalInput)}
            variant="secondary"
          >
            Add
          </Button>
        </div>
        <div className="flex flex-wrap gap-2">
          {skills.technical.map((skill, index) => (
            <span
              key={index}
              className="inline-flex items-center px-3 py-1 rounded-full text-sm bg-blue-100 text-blue-800"
            >
              {skill}
              <button
                type="button"
                onClick={() => handleRemoveSkill('technical', index)}
                className="ml-2 text-blue-600 hover:text-blue-800 focus:outline-none"
                aria-label={`Remove ${skill}`}
              >
                ×
              </button>
            </span>
          ))}
        </div>
        {errors?.technical && (
          <p className="mt-1 text-sm text-red-600">{errors.technical}</p>
        )}
      </div>

      {/* Soft Skills */}
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-2">
          Soft Skills
        </label>
        <div className="flex space-x-2 mb-3">
          <Input
            type="text"
            value={softInput}
            onChange={(e: React.ChangeEvent<HTMLInputElement>) => setSoftInput(e.target.value)}
            onKeyPress={(e: React.KeyboardEvent<HTMLInputElement>) => handleKeyPress(e, 'soft', softInput)}
            placeholder="e.g., Leadership, Communication"
            className="flex-1"
          />
          <Button
            type="button"
            onClick={() => handleAddSkill('soft', softInput)}
            variant="secondary"
          >
            Add
          </Button>
        </div>
        <div className="flex flex-wrap gap-2">
          {skills.soft.map((skill, index) => (
            <span
              key={index}
              className="inline-flex items-center px-3 py-1 rounded-full text-sm bg-green-100 text-green-800"
            >
              {skill}
              <button
                type="button"
                onClick={() => handleRemoveSkill('soft', index)}
                className="ml-2 text-green-600 hover:text-green-800 focus:outline-none"
                aria-label={`Remove ${skill}`}
              >
                ×
              </button>
            </span>
          ))}
        </div>
        {errors?.soft && (
          <p className="mt-1 text-sm text-red-600">{errors.soft}</p>
        )}
      </div>

      {/* Languages */}
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-2">
          Languages
        </label>
        <div className="flex space-x-2 mb-3">
          <Input
            type="text"
            value={languageInput}
            onChange={(e: React.ChangeEvent<HTMLInputElement>) => setLanguageInput(e.target.value)}
            onKeyPress={(e: React.KeyboardEvent<HTMLInputElement>) => handleKeyPress(e, 'languages', languageInput)}
            placeholder="e.g., English (Native), Spanish (Fluent)"
            className="flex-1"
          />
          <Button
            type="button"
            onClick={() => handleAddSkill('languages', languageInput)}
            variant="secondary"
          >
            Add
          </Button>
        </div>
        <div className="flex flex-wrap gap-2">
          {skills.languages.map((lang, index) => (
            <span
              key={index}
              className="inline-flex items-center px-3 py-1 rounded-full text-sm bg-purple-100 text-purple-800"
            >
              {lang}
              <button
                type="button"
                onClick={() => handleRemoveSkill('languages', index)}
                className="ml-2 text-purple-600 hover:text-purple-800 focus:outline-none"
                aria-label={`Remove ${lang}`}
              >
                ×
              </button>
            </span>
          ))}
        </div>
        {errors?.languages && (
          <p className="mt-1 text-sm text-red-600">{errors.languages}</p>
        )}
      </div>

      <p className="text-sm text-gray-600">
        Press Enter or click Add to add skills. Click the × to remove.
      </p>
    </div>
  );
}
