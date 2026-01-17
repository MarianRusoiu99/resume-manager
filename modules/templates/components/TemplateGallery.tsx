'use client';

/**
 * Template Gallery Component
 * Displays grid of template cards with filtering and management actions
 */

import { useRouter } from 'next/navigation';
import type { ResumeTemplate } from '@/lib/templates/template';
import { TemplateCard } from './TemplateCard';
import { Gallery } from '@/components/core/data-display/Gallery';
import { Button } from '@/components/ui/button';
import { Plus, FileText, ImagePlus } from 'lucide-react';

interface TemplateGalleryProps {
  templates: ResumeTemplate[];
  showAdminActions?: boolean;
}

export function TemplateGallery({ templates, showAdminActions = false }: TemplateGalleryProps) {
  const router = useRouter();

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
      items={templates}
      getItemKey={(template) => template.id}
      emptyState={{
        icon: FileText,
        title: "No Templates Found",
        description: "No templates are currently available. Check back later or create one if you are an admin.",
        action: showAdminActions
          ? {
            label: "Create Template",
            onClick: () => router.push('/templates/new'),
            icon: <Plus className="h-4 w-4" />,
          }
          : undefined,
      }}
      header={{
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
