/**
 * Resume Form Schemas - Miscellaneous Sections
 * 
 * These schemas define form fields that correspond directly to JSONResume schemas.
 * Each section includes all fields from its respective JSONResume schema.
 */

import { createFormSchema } from '../../form-schema';
import type { Certificate, Language, Award, Publication, Interest, Reference } from '@/lib/validations/jsonresume';

/**
 * Certificates Form Schema
 * 
 * JSONResume Certificate fields:
 * - name: string (certificate name)
 * - date: string (ISO 8601 date)
 * - issuer: string (issuing organization)
 * - url: string (certificate/verification URL)
 */
export const certificatesFormSchema = createFormSchema<Certificate>({
  fields: [
    { key: 'name', label: 'Certificate Name', type: 'text', required: true },
    { key: 'issuer', label: 'Issuer', type: 'text', placeholder: 'e.g. AWS, Google, Coursera' },
    { key: 'date', label: 'Date', type: 'month' },
    { key: 'url', label: 'Certificate URL', type: 'url', placeholder: 'Verification or credential URL' },
  ],
  newItemTemplate: {
    name: '',
    issuer: '',
    date: '',
    url: '',
  },
  labels: {
    addButton: 'Add Certificate',
    emptyMessage: "No certificates yet. Click 'Add Certificate' to get started.",
    itemTitle: (item) => item.name || 'New Certificate',
  },
});

/**
 * Languages Form Schema
 * 
 * JSONResume Language fields:
 * - language: string (language name)
 * - fluency: string (proficiency level)
 */
export const languagesFormSchema = createFormSchema<Language>({
  fields: [
    { key: 'language', label: 'Language', type: 'text', required: true },
    { key: 'fluency', label: 'Fluency', type: 'text', placeholder: 'e.g. Native, Fluent, Professional, Beginner' },
  ],
  newItemTemplate: {
    language: '',
    fluency: '',
  },
  labels: {
    addButton: 'Add Language',
    emptyMessage: "No languages yet. Click 'Add Language' to get started.",
    itemTitle: (item) => item.language || 'New Language',
  },
});

/**
 * Awards Form Schema
 * 
 * JSONResume Award fields:
 * - title: string (award title)
 * - date: string (ISO 8601 date)
 * - awarder: string (awarding organization)
 * - summary: string (description)
 */
export const awardsFormSchema = createFormSchema<Award>({
  fields: [
    { key: 'title', label: 'Award Title', type: 'text', required: true },
    { key: 'awarder', label: 'Awarder', type: 'text', placeholder: 'e.g. Company, Organization' },
    { key: 'date', label: 'Date', type: 'month' },
    { key: 'summary', label: 'Summary', type: 'textarea', rows: 2, colSpan: 2, description: 'Brief description of the award' },
  ],
  newItemTemplate: {
    title: '',
    awarder: '',
    date: '',
    summary: '',
  },
  labels: {
    addButton: 'Add Award',
    emptyMessage: "No awards yet. Click 'Add Award' to get started.",
    itemTitle: (item) => item.title || 'New Award',
  },
});

/**
 * Publications Form Schema
 * 
 * JSONResume Publication fields:
 * - name: string (publication title)
 * - publisher: string (publisher name)
 * - releaseDate: string (ISO 8601 date)
 * - url: string (publication URL)
 * - summary: string (description)
 */
export const publicationsFormSchema = createFormSchema<Publication>({
  fields: [
    { key: 'name', label: 'Title', type: 'text', required: true },
    { key: 'publisher', label: 'Publisher', type: 'text', placeholder: 'e.g. IEEE, ACM, Medium' },
    { key: 'releaseDate', label: 'Date', type: 'month' },
    { key: 'url', label: 'URL', type: 'url' },
    { key: 'summary', label: 'Summary', type: 'textarea', rows: 2, colSpan: 2, description: 'Brief description of the publication' },
  ],
  newItemTemplate: {
    name: '',
    publisher: '',
    releaseDate: '',
    url: '',
    summary: '',
  },
  labels: {
    addButton: 'Add Publication',
    emptyMessage: "No publications yet. Click 'Add Publication' to get started.",
    itemTitle: (item) => item.name || 'New Publication',
  },
});

/**
 * Interests Form Schema
 * 
 * JSONResume Interest fields:
 * - name: string (interest name)
 * - keywords: string[] (related activities/topics)
 */
export const interestsFormSchema = createFormSchema<Interest>({
  fields: [
    { key: 'name', label: 'Interest', type: 'text', required: true, placeholder: 'e.g. Photography, Gaming' },
    { key: 'keywords', label: 'Related Topics', type: 'tags', colSpan: 2, description: 'Related activities or topics' },
  ],
  newItemTemplate: {
    name: '',
    keywords: [],
  },
  labels: {
    addButton: 'Add Interest',
    emptyMessage: "No interests yet. Click 'Add Interest' to get started.",
    itemTitle: (item) => item.name || 'New Interest',
  },
});

/**
 * References Form Schema
 * 
 * JSONResume Reference fields:
 * - name: string (reference name)
 * - reference: string (testimonial or contact info)
 */
export const referencesFormSchema = createFormSchema<Reference>({
  fields: [
    { key: 'name', label: 'Name', type: 'text', required: true },
    { key: 'reference', label: 'Reference', type: 'textarea', rows: 3, colSpan: 2, description: 'Testimonial or contact information' },
  ],
  newItemTemplate: {
    name: '',
    reference: '',
  },
  labels: {
    addButton: 'Add Reference',
    emptyMessage: "No references yet. Click 'Add Reference' to get started.",
    itemTitle: (item) => item.name || 'New Reference',
  },
});
