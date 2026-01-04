/**
 * Resume Form Schemas - Education
 */

import { createFormSchema } from '../../form-schema';
import type { Education } from '@/lib/validations/jsonresume';

export const educationFormSchema = createFormSchema<Education>({
  fields: [
    { key: 'institution', label: 'Institution', type: 'text', required: true },
    { key: 'studyType', label: 'Degree', type: 'text', required: true },
    { key: 'area', label: 'Field of Study', type: 'text' },
    { key: 'url', label: 'Institution URL', type: 'url' },
    { key: 'score', label: 'GPA/Score', type: 'text' },
    { key: 'startDate', label: 'Start Date', type: 'month' },
    { key: 'endDate', label: 'End Date', type: 'month' },
    { key: 'courses', label: 'Courses', type: 'list', separator: 'comma', colSpan: 2, description: 'Comma-separated list of relevant courses' },
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
