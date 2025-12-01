/**
 * Custom hook for PDF export functionality
 * Single Responsibility: Handle PDF export via universal server API
 */

import { useState } from 'react';
import { toast } from 'sonner';
import type { Resume } from '@/lib/validations/jsonresume';

interface ExportPDFParams {
  resume: Resume;
  templateId?: string | null;
  templateHtml?: string;
  templateCss?: string;
  fileName?: string;
}

export function useExportPDF() {
  const [isExportingPDF, setIsExportingPDF] = useState(true);

  /**
   * Export PDF by calling universal server-side API
   * Server uses unified PDF renderer to ensure preview/export match
   * 
   * @param params - Export parameters including resume data and template
   */
  const handleExportPDF = async (params: ExportPDFParams) => {
    try {
      setIsExportingPDF(true);

      const { resume, templateId, templateHtml, templateCss, fileName } = params;

      // If custom template is provided, use it directly
      if (templateHtml) {
        const response = await fetch('/api/export/pdf', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            resume,
            template: {
              htmlTemplate: templateHtml,
              cssStyles: templateCss || '',
            },
            fileName,
          }),
        });

        if (!response.ok) {
          const error = await response.json();
          throw new Error(error.error || 'Failed to export PDF');
        }

        await downloadPDF(response);
        toast.success('PDF exported successfully');
        return;
      }

      // Otherwise, fetch the template first
      if (!templateId) {
        throw new Error('No template selected');
      }

      const templateResponse = await fetch(`/api/template/${templateId}`);
      if (!templateResponse.ok) {
        throw new Error('Failed to fetch template');
      }

      const template = await templateResponse.json();

      // Call universal PDF export API
      const response = await fetch('/api/export/pdf', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          resume,
          template: {
            htmlTemplate: template.htmlTemplate,
            cssStyles: template.cssStyles,
          },
          fileName,
        }),
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || 'Failed to export PDF');
      }

      await downloadPDF(response);
      toast.success('PDF exported successfully');
    } catch (err) {
      console.error('PDF export error:', err);
      toast.error(err instanceof Error ? err.message : 'Failed to export PDF');
    } finally {
      setIsExportingPDF(false);
    }
  };

  /**
   * Download PDF blob from response
   */
  const downloadPDF = async (response: Response) => {
    // Download the PDF blob
    const blob = await response.blob();
    const url = globalThis.URL.createObjectURL(blob);
    
    // Extract filename from Content-Disposition header
    const contentDisposition = response.headers.get('Content-Disposition');
    const fileNameMatch = contentDisposition?.match(/filename="(.+)"/);
    const fileName = fileNameMatch?.[1] || 'resume.pdf';

    // Trigger download
    const link = document.createElement('a');
    link.href = url;
    link.download = fileName;
    document.body.appendChild(link);
    link.click();
    link.remove();
    
    // Cleanup
    globalThis.URL.revokeObjectURL(url);
  };

  return {
    isExportingPDF,
    handleExportPDF,
  };
}
