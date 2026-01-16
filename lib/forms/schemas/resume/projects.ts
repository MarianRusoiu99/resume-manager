/**
 * Resume Form Schemas - Projects
 * 
 * This schema defines form fields that correspond directly to JSONResume Project schema.
 * All fields from the Project schema in JSONResume are included.
 */

import { createFormSchema } from '@/lib/forms/form-schema';
import type { Project } from '@/lib/validations/jsonresume';

/**
 * Projects Form Schema
 * 
 * JSONResume Project fields:
 * - name: string (project name)
 * - description: string (short summary)
 * - highlights: string[] (features/accomplishments)
 * - keywords: string[] (technologies)
 * - startDate: string (ISO 8601 date)
 * - endDate: string (ISO 8601 date)
 * - url: string (project URL)
 * - roles: string[] (your roles on the project)
 * - entity: string (company/organization affiliation)
 * - type: string (e.g. "application", "presentation", "volunteering")
 */
export const projectsFormSchema = createFormSchema<Project>({
  fields: [
    { key: 'name', label: 'Project Name', type: 'text', required: true },
    { key: 'type', label: 'Project Type', type: 'text', placeholder: 'e.g. application, presentation, volunteering' },
    { key: 'entity', label: 'Organization/Company', type: 'text', placeholder: 'e.g. Company XYZ, Open Source' },
    { key: 'url', label: 'Project URL', type: 'url' },
    { key: 'startDate', label: 'Start Date', type: 'month' },
    { key: 'endDate', label: 'End Date', type: 'month' },
    { key: 'description', label: 'Description', type: 'richtext', colSpan: 2, description: 'Describe the project and your contributions.' },
    { key: 'roles', label: 'Your Roles', type: 'tags', colSpan: 2, description: 'Your roles (e.g. Team Lead, Developer)' },
    { key: 'highlights', label: 'Highlights', type: 'richtext', colSpan: 2, description: 'Key features or accomplishments. Use bullet points for clarity.' },
    { key: 'keywords', label: 'Technologies', type: 'tags', colSpan: 2, description: 'Technologies used in this project' },
  ],
  newItemTemplate: {
    name: '',
    type: '',
    entity: '',
    url: '',
    startDate: '',
    endDate: '',
    description: '',
    roles: [],
    highlights: [],
    keywords: [],
  },
  labels: {
    addButton: 'Add Project',
    emptyMessage: "No projects yet. Click 'Add Project' to get started.",
    itemTitle: (item) => item.name || 'New Project',
  },
});
