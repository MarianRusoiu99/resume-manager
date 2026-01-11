/**
 * Resume Form Schemas - Experience (Work & Volunteer)
 * 
 * These schemas define form fields that correspond directly to JSONResume schema fields.
 * All fields from the Work and Volunteer schemas in JSONResume are included.
 */

import { createFormSchema } from '../../form-schema';
import type { Work, Volunteer } from '@/lib/validations/jsonresume';

/**
 * Work Experience Form Schema
 * 
 * JSONResume Work fields:
 * - name: string (company name)
 * - location: string (e.g. "Menlo Park, CA")
 * - description: string (company description, e.g. "Social Media Company")
 * - position: string (job title)
 * - url: string (company URL)
 * - startDate: string (ISO 8601 date)
 * - endDate: string (ISO 8601 date)
 * - summary: string (role overview)
 * - highlights: string[] (accomplishments)
 */
export const experienceFormSchema = createFormSchema<Work>({
  fields: [
    { key: 'name', label: 'Company', type: 'text', required: true },
    { key: 'position', label: 'Job Title', type: 'text', required: true },
    { key: 'location', label: 'Location', type: 'text', placeholder: 'e.g. San Francisco, CA' },
    { key: 'url', label: 'Company URL', type: 'url' },
    { key: 'startDate', label: 'Start Date', type: 'month', required: true },
    { key: 'endDate', label: 'End Date', type: 'month', placeholder: 'Leave empty if current' },
    { key: 'description', label: 'Company Description', type: 'text', colSpan: 2, placeholder: 'e.g. Social Media Company' },
    { key: 'summary', label: 'Role Summary', type: 'richtext', colSpan: 2, description: 'Describe your key responsibilities. Use formatting for emphasis.' },
    { key: 'highlights', label: 'Key Achievements', type: 'richtext', colSpan: 2, description: 'List your accomplishments. Use bullet points for clarity.' },
  ],
  newItemTemplate: {
    name: '',
    position: '',
    location: '',
    url: '',
    startDate: '',
    endDate: '',
    description: '',
    summary: '',
    highlights: [],
  },
  labels: {
    addButton: 'Add Experience',
    emptyMessage: "No experience entries yet. Click 'Add Experience' to get started.",
    itemTitle: (item) => item.position || item.name || 'New Experience',
  },
});

/**
 * Volunteer Experience Form Schema
 * 
 * JSONResume Volunteer fields:
 * - organization: string
 * - position: string
 * - url: string
 * - startDate: string (ISO 8601 date)
 * - endDate: string (ISO 8601 date)
 * - summary: string
 * - highlights: string[]
 */
export const volunteerFormSchema = createFormSchema<Volunteer>({
  fields: [
    { key: 'organization', label: 'Organization', type: 'text', required: true },
    { key: 'position', label: 'Position', type: 'text', required: true },
    { key: 'url', label: 'Organization URL', type: 'url' },
    { key: 'startDate', label: 'Start Date', type: 'month' },
    { key: 'endDate', label: 'End Date', type: 'month' },
    { key: 'summary', label: 'Summary', type: 'richtext', colSpan: 2, description: 'Describe your role and contributions.' },
    { key: 'highlights', label: 'Highlights', type: 'richtext', colSpan: 2, description: 'List your key accomplishments.' },
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
