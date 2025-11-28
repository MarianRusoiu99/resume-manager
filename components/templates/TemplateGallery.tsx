'use client';

/**
 * Template Gallery Component
 * Displays grid of template cards with filtering and management actions
 */

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import type { ResumeTemplate } from '@/lib/templates/template';
import { TemplateCard } from './TemplateCard';
import { Button } from '@/components/ui/button';
import { Plus } from 'lucide-react';

interface TemplateGalleryProps {
  templates: ResumeTemplate[];
  showAdminActions?: boolean;
}

const categories = [
  { value: 'all', label: 'All Templates' },
  { value: 'professional', label: 'Professional' },
  { value: 'modern', label: 'Modern' },
  { value: 'creative', label: 'Creative' },
  { value: 'ats-optimized', label: 'ATS-Optimized' },
  { value: 'minimal', label: 'Minimal' },
];

export function TemplateGallery({ templates, showAdminActions = false }: TemplateGalleryProps) {
  const [selectedCategory, setSelectedCategory] = useState('all');
  const router = useRouter();

  const filteredTemplates =
    selectedCategory === 'all'
      ? templates
      : templates.filter((t) => t.category === selectedCategory);

  return (
    <div>
      {/* Header with Create Button */}
      <div className="mb-6 flex items-center justify-between">
        <div className="flex flex-wrap gap-2">
          {categories.map((category) => (
            <button
              key={category.value}
              onClick={() => setSelectedCategory(category.value)}
              className={`px-4 py-2 rounded-lg transition-colors ${
                selectedCategory === category.value
                  ? 'bg-primary text-primary-foreground'
                  : 'bg-muted text-muted-foreground hover:bg-muted/80'
              }`}
            >
              {category.label}
            </button>
          ))}
        </div>

        {showAdminActions && (
          <Button onClick={() => router.push('/templates/new')}>
            <Plus className="mr-2 h-4 w-4" />
            Create Template
          </Button>
        )}
      </div>

      {/* Template Grid */}
      {filteredTemplates.length === 0 ? (
        <div className="text-center py-12 text-muted-foreground">
          No templates found in this category
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {filteredTemplates.map((template) => (
            <TemplateCard 
              key={template.id} 
              template={template}
              showAdminActions={showAdminActions}
            />
          ))}
        </div>
      )}
    </div>
  );
}
