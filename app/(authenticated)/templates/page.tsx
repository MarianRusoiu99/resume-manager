/**
 * Templates Gallery Page
 * Browse and preview available resume templates
 */

import { templateRepository } from '@/lib/repositories/templates.repository';
import { Page } from '@/components/layout/Page';
import { TemplateGallery } from '@/components/templates/TemplateGallery';
import { getSession } from '@/lib/auth/dal';

export default async function TemplatesPage() {
  const templates = await templateRepository.findAllPublic();
  const session = await getSession();

  // For now, enable admin actions for all logged-in users
  // In production, you might want to check for admin role
  const showAdminActions = !!session?.userId;

  return (
    <Page
      title="Resume Templates"
      description="Choose from professionally designed templates optimized for ATS systems"
      breadcrumbs={[{ label: "Templates" }]}
    >
      <div className="pb-8">
        <TemplateGallery templates={templates} showAdminActions={showAdminActions} />
      </div>
    </Page>
  );
}
