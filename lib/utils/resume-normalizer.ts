/**
 * Resume Data Normalizer
 *
 * Ensures that resume objects have proper structure with all required fields initialized
 * even when AI parsing or import returns partial data.
 */

import type { Resume } from '@/lib/validations/jsonresume';
import { resumeSchema } from '@/lib/validations/jsonresume';

/**
 * Create an empty/resume with all fields properly initialized
 */
function createEmptyResume(): Resume {
  return {
    basics: {
      name: '',
      label: '',
      email: '',
      phone: '',
      summary: '',
      url: '',
      image: '',
      location: {
        address: '',
        postalCode: '',
        city: '',
        region: '',
        countryCode: '',
      },
      profiles: [],
    },
    work: [],
    volunteer: [],
    education: [],
    awards: [],
    certificates: [],
    publications: [],
    skills: [],
    languages: [],
    interests: [],
    references: [],
    projects: [],
    meta: {
      canonical: '',
      lastModified: '',
    },
  };
}

/**
 * Normalize a resume object to ensure it has all required fields
 * Merges provided data with empty template to fill in missing fields
 */
export function normalizeResume(data: unknown | null | undefined): Resume {
  if (!data || typeof data !== 'object') {
    return createEmptyResume();
  }

  const empty = createEmptyResume();
  const resumeData = data as Partial<Resume>;

  // Helper to merge objects
  const mergeObject = (target: Record<string, unknown>, source: unknown): Record<string, unknown> => {
    if (!source || typeof source !== 'object') {
      return target;
    }

    const sourceObj = source as Record<string, unknown>;
    const result = { ...target };

    for (const key in target) {
      const targetValue = result[key];
      const sourceValue = sourceObj[key];

      if (sourceValue !== undefined && sourceValue !== null) {
        // If both are objects, recursively merge
        if (
          typeof targetValue === 'object' &&
          targetValue !== null &&
          !Array.isArray(targetValue) &&
          typeof sourceValue === 'object' &&
          sourceValue !== null &&
          !Array.isArray(sourceValue)
        ) {
          result[key] = mergeObject(targetValue as Record<string, unknown>, sourceValue);
        } else {
          // Otherwise use source value
          result[key] = sourceValue;
        }
      }
    }
    return result;
  };

  // Merge resume data using spread and fallback
  const normalized: Resume = {
    $schema: resumeData.$schema ?? empty.$schema,
    basics: resumeData.basics ? (mergeObject((empty.basics || {}) as Record<string, unknown>, resumeData.basics) as Resume['basics']) : empty.basics,
    work: resumeData.work && resumeData.work.length > 0 ? resumeData.work : empty.work,
    volunteer: resumeData.volunteer && resumeData.volunteer.length > 0 ? resumeData.volunteer : empty.volunteer,
    education: resumeData.education && resumeData.education.length > 0 ? resumeData.education : empty.education,
    awards: resumeData.awards && resumeData.awards.length > 0 ? resumeData.awards : empty.awards,
    certificates: resumeData.certificates && resumeData.certificates.length > 0 ? resumeData.certificates : empty.certificates,
    publications: resumeData.publications && resumeData.publications.length > 0 ? resumeData.publications : empty.publications,
    skills: resumeData.skills && resumeData.skills.length > 0 ? resumeData.skills : empty.skills,
    languages: resumeData.languages && resumeData.languages.length > 0 ? resumeData.languages : empty.languages,
    interests: resumeData.interests && resumeData.interests.length > 0 ? resumeData.interests : empty.interests,
    references: resumeData.references && resumeData.references.length > 0 ? resumeData.references : empty.references,
    projects: resumeData.projects && resumeData.projects.length > 0 ? resumeData.projects : empty.projects,
    meta: resumeData.meta ? (mergeObject((empty.meta || {}) as Record<string, unknown>, resumeData.meta) as Resume['meta']) : empty.meta,
  };

  // Validate that the normalized data conforms to schema
  const validated = resumeSchema.parse(normalized);
  return validated;
}

/**
 * Safely extract resume data from a profile or document object
 * Handles cases where resume might be nested or missing
 */
export function extractResumeFromData(data: unknown): Resume | null {
  if (!data || typeof data !== 'object') {
    return null;
  }

  // Try to find resume data at common paths
  const resume = (data as Record<string, unknown>).resume;
  if (resume && typeof resume === 'object') {
    return normalizeResume(resume);
  }

  // Try document path
  const document = (data as Record<string, unknown>).document;
  if (document && typeof document === 'object') {
    const docData = (document as Record<string, unknown>).document;
    if (docData && typeof docData === 'object') {
      return normalizeResume(docData);
    }
  }

  // Try direct object
  if ((data as Resume).basics || (data as Resume).work) {
    return normalizeResume(data);
  }

  return null;
}
