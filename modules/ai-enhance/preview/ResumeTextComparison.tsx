'use client';

/**
 * Resume Text Comparison Component
 * 
 * Displays side-by-side text views of original and enhanced resumes.
 */

import { ScrollArea } from '@/components/ui/scroll-area';
import { Loader2 } from 'lucide-react';
import { SideBySideComparison } from './SideBySideComparison';
import type { Resume } from '@/lib/validations/jsonresume';

export interface ResumeTextComparisonProps {
  originalResume: Resume;
  enhancedResume: Resume | null;
  /** AI enhancement is in progress */
  isEnhancing?: boolean;
  className?: string;
}

/**
 * Convert resume to readable text format for display
 */
export function resumeToText(resume: Resume): string {
  const sections: string[] = [];

  // Basics
  if (resume.basics) {
    sections.push(`=== PERSONAL INFO ===
Name: ${resume.basics.name || ''}
Label/Title: ${resume.basics.label || ''}
Email: ${resume.basics.email || ''}
Phone: ${resume.basics.phone || ''}
Location: ${resume.basics.location?.city || ''}, ${resume.basics.location?.region || ''}, ${resume.basics.location?.countryCode || ''}
Summary: ${resume.basics.summary || ''}`);
  }

  // Work Experience
  if (resume.work && resume.work.length > 0) {
    const workEntries = resume.work.map(w =>
      `- ${w.position || ''} at ${w.name || ''} (${w.startDate || ''} - ${w.endDate || 'Present'})
  ${w.summary || ''}
  Highlights: ${(w.highlights || []).join('; ')}`
    ).join('\n\n');
    sections.push(`=== WORK EXPERIENCE ===\n${workEntries}`);
  }

  // Education
  if (resume.education && resume.education.length > 0) {
    const eduEntries = resume.education.map(e =>
      `- ${e.studyType || ''} in ${e.area || ''} from ${e.institution || ''} (${e.startDate || ''} - ${e.endDate || ''})`
    ).join('\n');
    sections.push(`=== EDUCATION ===\n${eduEntries}`);
  }

  // Skills
  if (resume.skills && resume.skills.length > 0) {
    const skillEntries = resume.skills.map(s =>
      `- ${s.name || ''}: ${(s.keywords || []).join(', ')}`
    ).join('\n');
    sections.push(`=== SKILLS ===\n${skillEntries}`);
  }

  // Projects
  if (resume.projects && resume.projects.length > 0) {
    const projEntries = resume.projects.map(p =>
      `- ${p.name || ''}: ${p.description || ''}`
    ).join('\n');
    sections.push(`=== PROJECTS ===\n${projEntries}`);
  }

  // Certificates
  if (resume.certificates && resume.certificates.length > 0) {
    const certEntries = resume.certificates.map(c =>
      `- ${c.name || ''} from ${c.issuer || ''} (${c.date || ''})`
    ).join('\n');
    sections.push(`=== CERTIFICATES ===\n${certEntries}`);
  }

  // Languages
  if (resume.languages && resume.languages.length > 0) {
    const langEntries = resume.languages.map(l =>
      `- ${l.language || ''}: ${l.fluency || ''}`
    ).join('\n');
    sections.push(`=== LANGUAGES ===\n${langEntries}`);
  }

  return sections.join('\n\n');
}

/**
 * Text content renderer for scrollable text
 */
function TextContent({
  text,
  isLoading = false,
  emptyMessage = 'No content',
}: Readonly<{
  text: string;
  isLoading?: boolean;
  emptyMessage?: string;
}>) {
  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-full">
        <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
      </div>
    );
  }

  if (!text) {
    return (
      <div className="flex items-center justify-center h-full text-muted-foreground italic">
        {emptyMessage}
      </div>
    );
  }

  return (
    <ScrollArea className="h-full">
      <pre className="p-3 text-xs whitespace-pre-wrap break-words font-sans">
        {text}
      </pre>
    </ScrollArea>
  );
}

/**
 * Side-by-side text comparison of original and enhanced resumes
 */
export function ResumeTextComparison({
  originalResume,
  enhancedResume,
  isEnhancing = false,
  className,
}: Readonly<ResumeTextComparisonProps>) {
  const originalText = resumeToText(originalResume);
  const enhancedText = enhancedResume ? resumeToText(enhancedResume) : '';

  return (
    <SideBySideComparison
      originalLabel="Original Resume"
      enhancedLabel="Enhanced Resume"
      originalContent={
        <TextContent text={originalText} />
      }
      enhancedContent={
        <TextContent
          text={enhancedText}
          isLoading={isEnhancing}
          emptyMessage="Enter instructions and click Enhance to generate"
        />
      }
      isLoading={isEnhancing}
      className={className}
    />
  );
}
