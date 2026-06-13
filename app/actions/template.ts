'use server'

import { templateService } from '@/lib/services';
import { withServerAction } from '@/lib/actions/with-server-action';
import type { CreateTemplateServiceInput, UpdateTemplateServiceInput } from '@/lib/services/types';
import type { Resume } from '@/lib/validations/jsonresume';

/**
 * Get all public templates
 */
export const getTemplates = withServerAction(
    'getTemplates',
    async () => {
        return templateService.getAllPublicTemplates();
    },
    { resourceType: 'template' }
);

/**
 * Get a specific template by ID
 */
export const getTemplate = withServerAction(
    'getTemplate',
    async (_session, templateId: string) => templateService.getTemplateById(templateId),
    { resourceType: 'template' }
);

/**
 * Create a new template
 */
export const createTemplate = withServerAction(
    'createTemplate',
    async (session, data: CreateTemplateServiceInput) => {
        return templateService.createTemplate({
            ...data,
            isPublic: data.isPublic ?? false,
        });
    },
    {
        auditAction: 'TEMPLATE_CREATE',
        resourceType: 'template',
        revalidatePaths: ['/templates'],
        requireAdmin: true,
    }
);

/**
 * Update an existing template
 */
export const updateTemplate = withServerAction(
    'updateTemplate',
    async (session, templateId: string, data: UpdateTemplateServiceInput) => {
        return templateService.updateTemplate(templateId, data);
    },
    {
        auditAction: 'TEMPLATE_UPDATE',
        resourceType: 'template',
        revalidatePaths: ['/templates', '/templates/[id]'],
        requireAdmin: true,
    }
);

/**
 * Delete a template
 */
export const deleteTemplate = withServerAction(
    'deleteTemplate',
    async (session, templateId: string) => templateService.deleteTemplate(templateId),
    {
        auditAction: 'TEMPLATE_DELETE',
        resourceType: 'template',
        revalidatePaths: ['/templates'],
        requireAdmin: true,
    }
);

/**
 * Duplicate a template
 */
export const duplicateTemplate = withServerAction(
    'duplicateTemplate',
    async (session, templateId: string) => templateService.duplicateTemplate(templateId),
    {
        auditAction: 'TEMPLATE_CREATE',
        resourceType: 'template',
        revalidatePaths: ['/templates'],
        requireAdmin: true,
    }
);

/**
 * Render a template with resume data server-side
 * This avoids CSP issues with Handlebars.compile() requiring eval
 */
export const renderTemplate = withServerAction(
    'renderTemplate',
    async (_session, htmlTemplate: string, resumeData: Resume) => {
        return templateService.renderTemplate(htmlTemplate, resumeData);
    },
    { resourceType: 'template' }
);
