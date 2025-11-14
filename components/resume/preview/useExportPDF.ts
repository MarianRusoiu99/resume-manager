/**
 * Custom hook for PDF export functionality
 * Single Responsibility: Handle PDF export logic
 */

import { useState } from 'react';
import { toast } from 'sonner';

export function useExportPDF() {
  const [isExportingPDF, setIsExportingPDF] = useState(false);

  const handleExportPDF = async (resumeId?: string) => {
    if (!resumeId) {
      toast.error('Resume ID is required to export PDF');
      return;
    }

    try {
      setIsExportingPDF(true);

      const response = await fetch(`/api/resumes/${resumeId}/export`, {
        method: 'POST',
      });

      if (!response.ok) {
        throw new Error('Failed to export PDF');
      }

      const blob = await response.blob();
      const url = globalThis.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `resume-${resumeId}.pdf`;
      document.body.appendChild(a);
      a.click();
      globalThis.URL.revokeObjectURL(url);
      a.remove();
      
      toast.success('PDF exported successfully');
    } catch (err) {
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
