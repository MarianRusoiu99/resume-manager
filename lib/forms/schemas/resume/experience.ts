/**
 * Resume Form Schemas - Experience (Work & Volunteer)
 */

import { createFormSchema } from '../../form-schema';
import type { Work, Volunteer } from '@/lib/validations/jsonresume';

export const experienceFormSchema = createFormSchema<Work>({
  fields: [
    { key: 'name', label: 'Company', type: 'text', required: true },
    { key: 'position', label: 'Job Title', type: 'text', required: true },
    { key: 'url', label: 'Company URL', type: 'url' },
    { key: 'startDate', label: 'Start Date', type: 'month', required: true },
    { key: 'endDate', label: 'End Date', type: 'month', placeholder: 'Leave empty if current' },
    { key: 'summary', label: 'Summary', type: 'textarea', rows: 3, colSpan: 2, description: 'Describe your key responsibilities' },
    { key: 'highlights', label: 'Key Achievements', type: 'list', separator: 'newline', rows: 4, colSpan: 2, description: 'One achievement per line' },
  ],
  newItemTemplate: {
    name: '',
    position: '',
    url: '',
    startDate: '',
    endDate: '',
    summary: '',
    highlights: [],
  },
  labels: {
    addButton: 'Add Experience',
    emptyMessage: "No experience entries yet. Click 'Add Experience' to get started.",
    itemTitle: (item) => item.position || item.name || 'New Experience',
  },
});

export const volunteerFormSchema = createFormSchema<Volunteer>({
  fields: [
    { key: 'organization', label: 'Organization', type: 'text', required: true },
    { key: 'position', label: 'Position', type: 'text', required: true },
    { key: 'url', label: 'Organization URL', type: 'url' },
    { key: 'startDate', label: 'Start Date', type: 'month' },
    { key: 'endDate', label: 'End Date', type: 'month' },
    { key: 'summary', label: 'Summary', type: 'textarea', rows: 3, colSpan: 2 },
    { key: 'highlights', label: 'Highlights', type: 'list', separator: 'newline', rows: 3, colSpan: 2 },
  ],
  newItemTemplate: {
    organization: '',
    position: '',
    url: '',
    startDate: '',
    endDate: '',
    summary: '',
    highlights: [],
  },
  labels: {
    addButton: 'Add Volunteer Experience',
    emptyMessage: "No volunteer experience yet. Click 'Add Volunteer Experience' to get started.",
    itemTitle: (item) => item.position || item.organization || 'New Volunteer',
  },
});
