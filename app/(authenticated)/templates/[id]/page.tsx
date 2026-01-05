/**
 * Edit Template Page
 * Edit an existing resume template with full-screen editor
 */

import { notFound } from 'next/navigation';
import { templateRepository } from '@/lib/repositories/templates.repository';
import { TemplateEditor } from '@/components/templates/TemplateEditor';

export default async function EditTemplatePage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const template = await templateRepository.findById(id);

  if (!template) {
    notFound();
  }

  return <TemplateEditor template={template} />;
}
