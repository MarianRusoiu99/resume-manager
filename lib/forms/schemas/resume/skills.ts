/**
 * Resume Form Schemas - Skills
 * 
 * This schema defines form fields that correspond directly to JSONResume Skill schema.
 * All fields from the Skill schema in JSONResume are included.
 */

import { createFormSchema } from '@/lib/forms/form-schema';
import type { Skill } from '@/lib/validations/jsonresume';

/**
 * Skills Form Schema
 * 
 * JSONResume Skill fields:
 * - name: string (skill category, e.g. "Web Development")
 * - level: string (proficiency, e.g. "Master")
 * - keywords: string[] (specific skills, e.g. ["HTML", "CSS", "JavaScript"])
 */
export const skillsFormSchema = createFormSchema<Skill>({
  fields: [
    { key: 'name', label: 'Skill Category', type: 'text', required: true, placeholder: 'e.g. Web Development' },
    { key: 'level', label: 'Level', type: 'select', placeholder: 'Select level...', options: [
      { value: 'None', label: 'None' },
      { value: 'Beginner', label: 'Beginner' },
      { value: 'Intermediate', label: 'Intermediate' },
      { value: 'Advanced', label: 'Advanced' },
      { value: 'Expert', label: 'Expert' },
      { value: 'Master', label: 'Master' },
    ]},
    { key: 'keywords', label: 'Skills', type: 'tags', colSpan: 2, description: 'Specific skills (e.g. HTML, CSS, JavaScript)' },
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
