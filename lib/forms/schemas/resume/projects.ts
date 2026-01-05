/**
 * Resume Form Schemas - Projects
 */

import { createFormSchema } from '../../form-schema';
import type { Project } from '@/lib/validations/jsonresume';

export const projectsFormSchema = createFormSchema<Project>({
  fields: [
    { key: 'name', label: 'Project Name', type: 'text', required: true },
    { key: 'url', label: 'Project URL', type: 'url' },
    { key: 'startDate', label: 'Start Date', type: 'month' },
    { key: 'endDate', label: 'End Date', type: 'month' },
    { key: 'description', label: 'Description', type: 'textarea', rows: 3, colSpan: 2 },
    { key: 'highlights', label: 'Highlights', type: 'list', separator: 'newline', rows: 4, colSpan: 2 },
    { key: 'keywords', label: 'Keywords', type: 'list', separator: 'comma', colSpan: 2, description: 'Comma-separated list of technologies used' },
  ],
  newItemTemplate: {
    name: '',
    url: '',
    startDate: '',
    endDate: '',
    description: '',
    highlights: [],
    keywords: [],
  },
  labels: {
    addButton: 'Add Project',
    emptyMessage: "No projects yet. Click 'Add Project' to get started.",
    itemTitle: (item) => item.name || 'New Project',
  },
});
