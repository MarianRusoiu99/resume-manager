/**
 * Templates Gallery Page
 * Browse and preview available resume templates
 */

import { templateRepository } from '@/lib/repositories/template.repository';
import { PageHeader } from '@/components/layout/PageHeader';
import { PageContainer } from '@/components/layout/PageContainer';
import { TemplateGallery } from '@/components/templates/TemplateGallery';
import { auth } from '@/lib/auth/config';

export default async function TemplatesPage() {
  const templates = await templateRepository.findAllPublic();
  const session = await auth();

  // For now, enable admin actions for all logged-in users
  // In production, you might want to check for admin role
  const showAdminActions = !!session?.user?.id;

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
        <TemplateGallery templates={templates} showAdminActions={showAdminActions} />
      </PageContainer>
    </>
  );
}
