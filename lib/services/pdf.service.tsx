import { renderToBuffer } from '@react-pdf/renderer';
import { ResumePDF } from '../pdf/resume-pdf';
import { CoverLetterPDF } from '../pdf/cover-letter-pdf';
import { writeFile, mkdir } from 'fs/promises';
import { join } from 'path';
import { existsSync } from 'fs';
import React from 'react';
import { templateRepository } from '../repositories/template.repository';
import type { ResumeTemplate } from '@/types/template';
import type { Resume } from '@/lib/validations/jsonresume';

/**
 * PDF Service for generating resume PDFs using JSON Resume v1.0.0 format
 */
class PDFService {
  private readonly pdfDir = join(process.cwd(), 'public', 'pdfs');

  /**
   * Ensure PDF directory exists
   */
  private async ensureDirectoryExists(): Promise<void> {
    if (!existsSync(this.pdfDir)) {
      await mkdir(this.pdfDir, { recursive: true });
    }
  }

  /**
   * Generate PDF from resume content (JSON Resume format)
   * @param resumeId - The ID of the resume
   * @param content - The resume content in JSON Resume v1.0.0 format
   * @param templateId - Optional template ID to apply styling
   * @param templateCustomization - Optional customization overrides
   * @returns The URL path to the generated PDF
   */
  async generatePDF(
    resumeId: string,
    content: Resume,
    templateId?: string,
    templateCustomization?: Record<string, unknown>
  ): Promise<string> {
    try {
      // Ensure directory exists
      await this.ensureDirectoryExists();

      // Fetch template if provided
      let template: ResumeTemplate | null = null;
      if (templateId) {
        const baseTemplate = await templateRepository.findById(templateId);
        if (baseTemplate && templateCustomization) {
          // Merge template with customization
          template = {
            ...baseTemplate,
            definition: {
              ...baseTemplate.definition,
              ...(templateCustomization as Partial<typeof baseTemplate.definition>),
            },
          };
        } else {
          template = baseTemplate;
        }
      }

      // Generate PDF buffer with template (sectionOrder removed - not needed)
      const pdfBuffer = await renderToBuffer(
        <ResumePDF 
          content={content} 
          template={template}
        />
      );

      // Create filename
      const filename = `resume-${resumeId}-${Date.now()}.pdf`;
      const filePath = join(this.pdfDir, filename);

      // Write PDF to file
      await writeFile(filePath, pdfBuffer);

      // Return public URL path
      return `/pdfs/${filename}`;
    } catch (error) {
      console.error('Error generating PDF:', error);
      throw new Error('Failed to generate PDF');
    }
  }

  /**
   * Generate PDF and return as buffer (for download)
   * @param content - The resume content in JSON Resume v1.0.0 format
   * @param templateId - Optional template ID to apply styling
   * @param templateCustomization - Optional customization overrides
   * @returns PDF buffer
   */
  async generatePDFBuffer(
    content: Resume,
    templateId?: string,
    templateCustomization?: Record<string, unknown>
  ): Promise<Buffer> {
    try {
      // Fetch template if provided
      let template: ResumeTemplate | null = null;
      if (templateId) {
        console.log('PDF Service: Fetching template with ID:', templateId);
        const baseTemplate = await templateRepository.findById(templateId);
        console.log('PDF Service: Found template:', baseTemplate?.name);
        if (baseTemplate && templateCustomization) {
          // Merge template with customization
          template = {
            ...baseTemplate,
            definition: {
              ...baseTemplate.definition,
              ...(templateCustomization as Partial<typeof baseTemplate.definition>),
            },
          };
        } else {
          template = baseTemplate;
        }
      } else {
        console.log('PDF Service: No templateId provided, using null template');
      }

      console.log('PDF Service: Using template:', template?.name || 'null');

      // Generate PDF buffer with template (sectionOrder removed - not needed)
      const pdfBuffer = await renderToBuffer(
        <ResumePDF 
          content={content} 
          template={template}
        />
      );
      return pdfBuffer;
    } catch (error) {
      console.error('Error generating PDF buffer:', error);
      throw new Error('Failed to generate PDF');
    }
  }

  /**
   * Generate Cover Letter PDF and return as buffer (for download)
   * @param coverLetter - The cover letter text
   * @param candidateName - Candidate's full name
   * @param candidateEmail - Candidate's email
   * @param candidatePhone - Candidate's phone (optional)
   * @param jobTitle - Job position title
   * @param companyName - Company name
   * @returns PDF buffer
   */
  async generateCoverLetterBuffer(
    coverLetter: string,
    candidateName: string,
    candidateEmail: string,
    candidatePhone: string | undefined,
    jobTitle: string,
    companyName: string
  ): Promise<Buffer> {
    try {
      // Generate PDF buffer
      const pdfBuffer = await renderToBuffer(
        <CoverLetterPDF
          coverLetter={coverLetter}
          candidateName={candidateName}
          candidateEmail={candidateEmail}
          candidatePhone={candidatePhone}
          jobTitle={jobTitle}
          companyName={companyName}
        />
      );
      return pdfBuffer;
    } catch (error) {
      console.error('Error generating cover letter PDF buffer:', error);
      throw new Error('Failed to generate cover letter PDF');
    }
  }
}

// Export singleton instance
export const pdfService = new PDFService();
