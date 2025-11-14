/**
 * Custom hook for PDF export functionality
 * Single Responsibility: Handle PDF export via server API
 */

import { useState } from 'react';
import { toast } from 'sonner';

export function useExportPDF() {
  const [isExportingPDF, setIsExportingPDF] = useState(false);

  /**
   * Export PDF by calling server-side API
   * Server uses unified PDF renderer to ensure preview/export match
   */
  const handleExportPDF = async (resumeId: string) => {
    try {
      setIsExportingPDF(true);

      // Call server API for PDF generation
      const response = await fetch(`/api/resumes/${resumeId}/export`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || 'Failed to export PDF');
      }

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

      toast.success('PDF exported successfully');
    } catch (err) {
      console.error('PDF export error:', err);
      toast.error(err instanceof Error ? err.message : 'Failed to export PDF');
    } finally {
      setIsExportingPDF(false);
    }
  };

  return {
    isExportingPDF,
    handleExportPDF,
  };
}
