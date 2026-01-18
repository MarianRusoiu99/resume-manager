/**
 * Custom hook for PDF export functionality
 * Single Responsibility: Handle PDF export via universal server API
 */

import { useState } from 'react';
import { ExternalServiceError, NotFoundError, ValidationError } from "@/lib/errors";
import { toast } from 'sonner';
import type { Resume } from '@/lib/validations/jsonresume';
import { createComponentLogger } from '@/lib/utils/client-logger';
import { getTemplate } from '@/app/actions/template';

const logger = createComponentLogger('useExportPDF');

interface ExportPDFParams {
  resume: Resume;
  templateId?: string | null;
  templateHtml?: string;
  fileName?: string;
}

export function useExportPDF() {
  const [isExportingPDF, setIsExportingPDF] = useState(false);

  /**
   * Export PDF by calling universal server-side API
   * Server uses unified PDF renderer to ensure preview/export match
   * 
   * @param params - Export parameters including resume data and template
   */
  const handleExportPDF = async (params: ExportPDFParams) => {
    try {
      setIsExportingPDF(true);

      const { resume, templateId, templateHtml, fileName } = params;

      let html = templateHtml;

      if (!html) {
        if (!templateId) {
          throw new ValidationError('No template selected');
        }

        const templateResult = await getTemplate(templateId);
        if (!templateResult.success || !templateResult.data) {
          throw !templateResult.success 
            ? new ExternalServiceError('Template API', templateResult.error) 
            : new NotFoundError('Template');
        }

        html = templateResult.data.htmlTemplate;
      }

      const response = await fetch('/api/v1/export/pdf', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          resume,
          template: {
            htmlTemplate: html,
          },
          fileName,
        })
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new ExternalServiceError('PDF Export', errorData.error || 'Failed to export PDF');
      }

      await downloadPDF(response);
      toast.success('PDF exported successfully');
    } catch (err) {
      logger.error('PDF export error', err);
      toast.error(err instanceof Error ? err.message : 'Failed to export PDF');
    } finally {
      setIsExportingPDF(false);
    }
  };

  /**
   * Download PDF blob from response
   */
  const downloadPDF = async (response: Response, defaultFileName?: string) => {
    const blob = await response.blob();
    const url = globalThis.URL.createObjectURL(blob);
    
    const contentDisposition = response.headers.get('Content-Disposition');
    const fileNameMatch = contentDisposition?.match(/filename="(.+)"/);
    const fileName = fileNameMatch?.[1] || defaultFileName || 'resume.pdf';

    const link = document.createElement('a');
    link.href = url;
    link.download = fileName;
    document.body.appendChild(link);
    link.click();
    link.remove();
    
    globalThis.URL.revokeObjectURL(url);
  };

  const handleExportCoverLetter = async (id: string, fileName?: string) => {
    try {
      setIsExportingPDF(true);
      const response = await fetch(`/api/v1/cover-letter/${id}/export`, {
        method: 'POST'
      });

      if (!response.ok) {
        throw new ExternalServiceError('PDF Export', 'Failed to export cover letter');
      }

      await downloadPDF(response, fileName ? `${fileName}.pdf` : 'cover-letter.pdf');
      toast.success('Cover letter exported successfully');
    } catch (err) {
      logger.error('Cover letter export error', err);
      toast.error(err instanceof Error ? err.message : 'Failed to export cover letter');
    } finally {
      setIsExportingPDF(false);
    }
  };

  return {
    isExportingPDF,
    handleExportPDF,
    handleExportCoverLetter,
  };
}
