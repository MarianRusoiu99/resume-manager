'use client';

/**
 * Template Gallery Component
 * Displays grid of template cards with filtering and management actions
 */

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import type { ResumeTemplate } from '@/lib/templates/template';
import { TemplateCard } from './TemplateCard';
import { Gallery, type GalleryFilterOption } from '@/components/shared/Gallery';
import { Button } from '@/components/ui/button';
import { Plus, FileText, ImagePlus } from 'lucide-react';

interface TemplateGalleryProps {
  templates: ResumeTemplate[];
  showAdminActions?: boolean;
}

const categoryFilters: GalleryFilterOption[] = [
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

  const headerActions = showAdminActions ? (
    <div className="flex gap-2">
      <Button variant="outline" onClick={() => router.push('/templates/new?import=true')}>
        <ImagePlus className="mr-2 h-4 w-4" />
        Import from Image
      </Button>
      <Button onClick={() => router.push('/templates/new')}>
        <Plus className="mr-2 h-4 w-4" />
        Create Template
      </Button>
    </div>
  ) : null;

  return (
    <Gallery
      items={filteredTemplates}
      getItemKey={(template) => template.id}
      emptyState={{
        icon: FileText,
        title: "No templates found",
        description: selectedCategory === 'all'
          ? "No templates are available"
          : `No templates found in the "${selectedCategory}" category`,
        action: showAdminActions
          ? {
            label: "Create Template",
            onClick: () => router.push('/templates/new'),
            icon: <Plus className="h-4 w-4" />,
          }
          : undefined,
      }}
      header={{
        filters: categoryFilters,
        selectedFilter: selectedCategory,
        onFilterChange: setSelectedCategory,
        actions: headerActions,
      }}
      renderItem={(template) => (
        <TemplateCard
          key={template.id}
          template={template}
          showAdminActions={showAdminActions}
        />
      )}
    />
  );
}
