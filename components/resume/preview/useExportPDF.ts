/**
 * PDF Export Hook
 * Handles PDF generation and download
 * Single Responsibility: PDF export functionality
 */

'use client';

import { useState } from 'react';
import { toast } from 'sonner';
import type { Resume } from '@/lib/validations/jsonresume';

interface UseExportPDFOptions {
  resume: Resume;
  selectedTemplateId: string | null;
  resumeId?: string;
}

export function useExportPDF({
  resume,
  selectedTemplateId,
  resumeId,
}: UseExportPDFOptions) {
  const [isExporting, setIsExporting] = useState(false);

  const exportPDF = async () => {
    try {
      setIsExporting(true);

      const response = await fetch('/api/export-resume', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          resumeData: resume,
          templateId: selectedTemplateId,
          filename: resumeId
            ? `resume-${resumeId}.pdf`
            : `resume-${resume.basics?.name || 'download'}.pdf`,
        }),
      });

      if (!response.ok) {
        throw new Error('Failed to export PDF');
      }

      const blob = await response.blob();
      const url = globalThis.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = resumeId
        ? `resume-${resumeId}.pdf`
        : `resume-${resume.basics?.name || 'download'}.pdf`;
      document.body.appendChild(a);
      a.click();
      globalThis.URL.revokeObjectURL(url);
      a.remove();

      toast.success('PDF exported successfully');
    } catch (err) {
      toast.error(
        err instanceof Error ? err.message : 'Failed to export PDF'
      );
    } finally {
      setIsExporting(false);
    }
  };

  return {
    exportPDF,
    isExporting,
  };
}
