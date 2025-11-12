/**
 * New Template Page
 * Create a new resume template
 */

import { PageHeader } from '@/components/layout/PageHeader';
import { PageContainer } from '@/components/layout/PageContainer';
import { TemplateEditor } from '@/components/templates/TemplateEditor';

export default function NewTemplatePage() {
  return (
    <>
      <PageHeader
        title="Create Template"
        description="Design a new resume template with HTML and Handlebars"
        breadcrumbs={[
          { label: "Templates", href: "/templates" },
          { label: "New" },
        ]}
      />
      <PageContainer className="h-[calc(100vh-200px)]">
        <TemplateEditor isNew />
      </PageContainer>
    </>
  );
}
