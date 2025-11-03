/**
 * Format Conversion Utilities
 * 
 * Helpers to convert between different data formats used in the editor.
 * These utilities enable backward compatibility with existing form components.
 */

import type { Resume } from "@/lib/validations/jsonresume";

/**
 * Old format for skills (used by SkillsForm)
 */
export interface OldSkillsFormat {
  technical: string[];
  soft: string[];
  languages: string[];
}

/**
 * Old format for certifications (used by CertificationsForm)
 */
export interface OldCertification {
  id: string;
  name: string;
  issuer: string;
  date: string;
  url?: string;
}

/**
 * Old format for languages (used by LanguagesForm)
 */
export interface OldLanguage {
  id: string;
  language: string;
  proficiency: string;
}

/**
 * Convert JSON Resume skills to old format
 */
export function skillsToOldFormat(skills?: Resume['skills']): OldSkillsFormat {
  if (!skills || skills.length === 0) {
    return { technical: [], soft: [], languages: [] };
  }
  
  const result: OldSkillsFormat = { technical: [], soft: [], languages: [] };
  
  skills.forEach(skill => {
    const name = skill.name?.toLowerCase() || '';
    const keywords = skill.keywords || [];
    
    // Categorize based on skill name
    if (name.includes('language') || name === 'languages') {
      result.languages.push(...keywords);
    } else if (
      name.includes('soft') || 
      name.includes('leadership') || 
      name.includes('communication') ||
      name.includes('interpersonal')
    ) {
      result.soft.push(...keywords);
    } else {
      result.technical.push(...keywords);
    }
  });
  
  return result;
}

/**
 * Convert old format skills to JSON Resume
 */
export function skillsFromOldFormat(oldSkills: OldSkillsFormat): Resume['skills'] {
  const skills: NonNullable<Resume['skills']> = [];
  
  if (oldSkills.technical.length > 0) {
    skills.push({ name: 'Technical Skills', keywords: oldSkills.technical });
  }
  if (oldSkills.soft.length > 0) {
    skills.push({ name: 'Soft Skills', keywords: oldSkills.soft });
  }
  if (oldSkills.languages.length > 0) {
    skills.push({ name: 'Languages', keywords: oldSkills.languages });
  }
  
  return skills;
}

/**
 * Convert JSON Resume certificates to old format
 */
export function certificatesToOldFormat(certificates?: Resume['certificates']): OldCertification[] {
  if (!certificates || certificates.length === 0) {
    return [];
  }
  
  return certificates.map(cert => ({
    id: cert.name || '',
    name: cert.name || '',
    issuer: cert.issuer || '',
    date: cert.date || '',
    url: cert.url || '',
  }));
}

/**
 * Convert old format certifications to JSON Resume
 */
export function certificatesFromOldFormat(oldCerts: OldCertification[]): Resume['certificates'] {
  return oldCerts.map(cert => ({
    name: cert.name,
    issuer: cert.issuer,
    date: cert.date,
    url: cert.url || undefined,
  }));
}

/**
 * Convert JSON Resume languages to old format
 */
export function languagesToOldFormat(languages?: Resume['languages']): OldLanguage[] {
  if (!languages || languages.length === 0) {
    return [];
  }
  
  return languages.map(lang => ({
    id: lang.language || '',
    language: lang.language || '',
    proficiency: lang.fluency || '',
  }));
}

/**
 * Convert old format languages to JSON Resume
 */
export function languagesFromOldFormat(oldLangs: OldLanguage[]): Resume['languages'] {
  return oldLangs.map(lang => ({
    language: lang.language,
    fluency: lang.proficiency,
  }));
}

/**
 * Calculate profile completion percentage
 */
export function calculateCompletionPercentage(resume: Resume): number {
  let completed = 0;
  let total = 0;

  // Personal info (weight: 30%)
  total += 30;
  const hasBasicInfo = !!(resume.basics?.name && resume.basics?.email);
  const hasContact = !!(resume.basics?.phone || resume.basics?.location?.city);
  const hasProfiles = !!(resume.basics?.profiles && resume.basics.profiles.length > 0);
  if (hasBasicInfo) completed += 15;
  if (hasContact) completed += 10;
  if (hasProfiles) completed += 5;

  // Summary (weight: 10%)
  total += 10;
  if (resume.basics?.summary && resume.basics.summary.length > 50) {
    completed += 10;
  }

  // Work experience (weight: 25%)
  total += 25;
  if (resume.work && resume.work.length > 0) {
    completed += Math.min(25, resume.work.length * 8);
  }

  // Education (weight: 15%)
  total += 15;
  if (resume.education && resume.education.length > 0) {
    completed += Math.min(15, resume.education.length * 7);
  }

  // Skills (weight: 10%)
  total += 10;
  if (resume.skills && resume.skills.length > 0) {
    completed += 10;
  }

  // Optional sections (weight: 10%)
  total += 10;
  let optionalCount = 0;
  if (resume.projects && resume.projects.length > 0) optionalCount++;
  if (resume.certificates && resume.certificates.length > 0) optionalCount++;
  if (resume.languages && resume.languages.length > 0) optionalCount++;
  if (resume.volunteer && resume.volunteer.length > 0) optionalCount++;
  completed += Math.min(10, optionalCount * 2.5);

  return Math.round((completed / total) * 100);
}
