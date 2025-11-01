/**
 * Templates Gallery Page
 * Browse and preview available resume templates
 */

import { templateRepository } from '@/lib/repositories/template.repository';
import { PageHeader } from '@/components/layout/PageHeader';
import { PageContainer } from '@/components/layout/PageContainer';
import { TemplateGallery } from '@/components/templates/TemplateGallery';

export default async function TemplatesPage() {
  const templates = await templateRepository.findAllPublic();

  return (
    <>
      <PageHeader
        title="Resume Templates"
        description="Choose from professionally designed templates optimized for ATS systems"
        breadcrumbs={[
          { label: "Dashboard", href: "/dashboard" },
          { label: "Templates" },
        ]}
      />
      <PageContainer>
        <TemplateGallery templates={templates} />
      </PageContainer>
    </>
  );
}
