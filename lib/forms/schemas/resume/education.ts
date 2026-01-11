/**
 * Resume Form Schemas - Education
 * 
 * This schema defines form fields that correspond directly to JSONResume Education schema.
 * All fields from the Education schema in JSONResume are included.
 */

import { createFormSchema } from '../../form-schema';
import type { Education } from '@/lib/validations/jsonresume';

/**
 * Education Form Schema
 * 
 * JSONResume Education fields:
 * - institution: string (school name)
 * - url: string (school URL)
 * - area: string (field of study)
 * - studyType: string (degree type, e.g. "Bachelor")
 * - startDate: string (ISO 8601 date)
 * - endDate: string (ISO 8601 date)
 * - score: string (GPA/grade)
 * - courses: string[] (notable courses)
 */
export const educationFormSchema = createFormSchema<Education>({
  fields: [
    { key: 'institution', label: 'Institution', type: 'text', required: true },
    { key: 'studyType', label: 'Degree', type: 'text', required: true, placeholder: 'e.g. Bachelor, Master, PhD' },
    { key: 'area', label: 'Field of Study', type: 'text', placeholder: 'e.g. Computer Science' },
    { key: 'url', label: 'Institution URL', type: 'url' },
    { key: 'score', label: 'GPA/Score', type: 'text', placeholder: 'e.g. 3.8/4.0' },
    { key: 'startDate', label: 'Start Date', type: 'month' },
    { key: 'endDate', label: 'End Date', type: 'month' },
    { key: 'courses', label: 'Courses', type: 'tags', colSpan: 2, description: 'Relevant courses taken' },
  ],
  newItemTemplate: {
    institution: '',
    studyType: '',
    area: '',
    url: '',
    score: '',
    startDate: '',
    endDate: '',
    courses: [],
  },
  labels: {
    addButton: 'Add Education',
    emptyMessage: "No education entries yet. Click 'Add Education' to get started.",
    itemTitle: (item) => item.studyType || item.institution || 'New Education',
  },
});
