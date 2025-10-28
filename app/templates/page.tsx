/**
 * Templates Gallery Page
 * Browse and preview available resume templates
 */

import { templateRepository } from '@/lib/repositories/template.repository';
import { TemplateGallery } from '@/components/templates/TemplateGallery';

export default async function TemplatesPage() {
  const templates = await templateRepository.findAllPublic();

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="mb-8">
        <h1 className="text-3xl font-bold mb-2">Resume Templates</h1>
        <p className="text-gray-600">
          Choose from professionally designed templates optimized for ATS systems
        </p>
      </div>

      <TemplateGallery templates={templates} />
    </div>
  );
}
