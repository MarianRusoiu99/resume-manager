/**
 * Edit Template Page
 * Edit an existing resume template
 */

import { notFound } from 'next/navigation';
import { templateRepository } from '@/lib/repositories/template.repository';
import { PageHeader } from '@/components/layout/PageHeader';
import { PageContainer } from '@/components/layout/PageContainer';
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

  return (
    <>
      <PageHeader
        title={`Edit: ${template.name}`}
        description="Modify the template design and configuration"
        breadcrumbs={[
          { label: "Templates", href: "/templates" },
          { label: template.name },
        ]}
      />
      <PageContainer className="h-[calc(100vh-200px)]">
        <TemplateEditor template={template} />
      </PageContainer>
    </>
  );
}
