'use client';

/**
 * Template Gallery Component
 * Displays grid of template cards with filtering
 */

import { useState } from 'react';
import type { ResumeTemplate } from '@/types/template';
import { TemplateCard } from './TemplateCard';

interface TemplateGalleryProps {
  templates: ResumeTemplate[];
}

const categories = [
  { value: 'all', label: 'All Templates' },
  { value: 'professional', label: 'Professional' },
  { value: 'modern', label: 'Modern' },
  { value: 'creative', label: 'Creative' },
  { value: 'ats-optimized', label: 'ATS-Optimized' },
  { value: 'minimal', label: 'Minimal' },
];

export function TemplateGallery({ templates }: TemplateGalleryProps) {
  const [selectedCategory, setSelectedCategory] = useState('all');

  const filteredTemplates =
    selectedCategory === 'all'
      ? templates
      : templates.filter((t) => t.category === selectedCategory);

  return (
    <div>
      {/* Category Filter */}
      <div className="mb-6 flex flex-wrap gap-2">
        {categories.map((category) => (
          <button
            key={category.value}
            onClick={() => setSelectedCategory(category.value)}
            className={`px-4 py-2 rounded-lg transition-colors ${
              selectedCategory === category.value
                ? 'bg-blue-600 text-white'
                : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
            }`}
          >
            {category.label}
          </button>
        ))}
      </div>

      {/* Template Grid */}
      {filteredTemplates.length === 0 ? (
        <div className="text-center py-12 text-gray-500">
          No templates found in this category
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {filteredTemplates.map((template) => (
            <TemplateCard key={template.id} template={template} />
          ))}
        </div>
      )}
    </div>
  );
}
