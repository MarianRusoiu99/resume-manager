/**
 * Resume Form Schemas - Skills
 */

import { createFormSchema } from '../../form-schema';
import type { Skill } from '@/lib/validations/jsonresume';

export const skillsFormSchema = createFormSchema<Skill>({
  fields: [
    { key: 'name', label: 'Skill Category', type: 'text', required: true },
    { key: 'level', label: 'Level', type: 'select', options: [
      { value: 'Beginner', label: 'Beginner' },
      { value: 'Intermediate', label: 'Intermediate' },
      { value: 'Advanced', label: 'Advanced' },
      { value: 'Expert', label: 'Expert' },
    ]},
    { key: 'keywords', label: 'Keywords', type: 'list', separator: 'comma', colSpan: 2, description: 'Comma-separated list of skills' },
  ],
  newItemTemplate: {
    name: '',
    level: '',
    keywords: [],
  },
  labels: {
    addButton: 'Add Skill Category',
    emptyMessage: "No skills yet. Click 'Add Skill Category' to get started.",
    itemTitle: (item) => item.name || 'New Skill',
  },
});
