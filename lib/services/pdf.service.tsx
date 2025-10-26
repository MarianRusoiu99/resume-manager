import { renderToBuffer } from '@react-pdf/renderer';
import { ResumePDF } from '../pdf/resume-pdf';
import { writeFile, mkdir } from 'fs/promises';
import { join } from 'path';
import { existsSync } from 'fs';
import React from 'react';

interface ResumeContent {
  personalInfo: {
    name: string;
    email: string;
    phone?: string;
    location?: string;
    links?: string[];
  };
  summary: string;
  experience: Array<{
    company: string;
    position: string;
    startDate: string;
    endDate: string | null;
    description: string;
    bulletPoints: string[];
  }>;
  education: Array<{
    institution: string;
    degree: string;
    field: string;
    startDate: string;
    endDate: string | null;
    gpa?: string;
  }>;
  skills: {
    technical: string[];
    soft: string[];
  };
}

/**
 * PDF Service for generating resume PDFs
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
   * Generate PDF from resume content
   * @param resumeId - The ID of the resume
   * @param content - The resume content
   * @returns The URL path to the generated PDF
   */
  async generatePDF(resumeId: string, content: ResumeContent): Promise<string> {
    try {
      // Ensure directory exists
      await this.ensureDirectoryExists();

      // Generate PDF buffer
      const pdfBuffer = await renderToBuffer(<ResumePDF content={content} />);

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
   * @param content - The resume content
   * @returns PDF buffer
   */
  async generatePDFBuffer(content: ResumeContent): Promise<Buffer> {
    try {
      const pdfBuffer = await renderToBuffer(<ResumePDF content={content} />);
      return pdfBuffer;
    } catch (error) {
      console.error('Error generating PDF buffer:', error);
      throw new Error('Failed to generate PDF');
    }
  }
}

// Export singleton instance
export const pdfService = new PDFService();
