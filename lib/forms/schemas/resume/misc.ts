/**
 * Resume Form Schemas - Certifications, Languages, Awards, Publications, Interests, References
 */

import { createFormSchema } from '../../form-schema';
import type { Certificate, Language, Award, Publication, Interest, Reference } from '@/lib/validations/jsonresume';

// Certifications
export const certificatesFormSchema = createFormSchema<Certificate>({
  fields: [
    { key: 'name', label: 'Certificate Name', type: 'text', required: true },
    { key: 'issuer', label: 'Issuer', type: 'text' },
    { key: 'date', label: 'Date', type: 'month' },
    { key: 'url', label: 'URL', type: 'url' },
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

// Languages
export const languagesFormSchema = createFormSchema<Language>({
  fields: [
    { key: 'language', label: 'Language', type: 'text', required: true },
    { key: 'fluency', label: 'Fluency', type: 'text', placeholder: 'e.g. Native, Fluent, Professional' },
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

// Awards
export const awardsFormSchema = createFormSchema<Award>({
  fields: [
    { key: 'title', label: 'Award Title', type: 'text', required: true },
    { key: 'awarder', label: 'Awarder', type: 'text' },
    { key: 'date', label: 'Date', type: 'month' },
    { key: 'summary', label: 'Summary', type: 'textarea', rows: 2, colSpan: 2 },
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

// Publications
export const publicationsFormSchema = createFormSchema<Publication>({
  fields: [
    { key: 'name', label: 'Title', type: 'text', required: true },
    { key: 'publisher', label: 'Publisher', type: 'text' },
    { key: 'releaseDate', label: 'Date', type: 'month' },
    { key: 'url', label: 'URL', type: 'url' },
    { key: 'summary', label: 'Summary', type: 'textarea', rows: 2, colSpan: 2 },
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

// Interests
export const interestsFormSchema = createFormSchema<Interest>({
  fields: [
    { key: 'name', label: 'Interest', type: 'text', required: true },
    { key: 'keywords', label: 'Keywords', type: 'list', separator: 'comma', description: 'Related activities or topics' },
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

// References
export const referencesFormSchema = createFormSchema<Reference>({
  fields: [
    { key: 'name', label: 'Name', type: 'text', required: true },
    { key: 'reference', label: 'Reference', type: 'textarea', rows: 3, colSpan: 2, description: 'Testimonial or contact info' },
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
