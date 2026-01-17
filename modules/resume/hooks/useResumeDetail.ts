import { useState, useEffect, useCallback } from 'react';
import { ExternalServiceError } from "@/lib/errors";
import { useRouter } from 'next/navigation';
import { toast } from 'sonner';
import { getResume, deleteResume, duplicateResume, updateResumeMetadata } from '@/app/actions/resume';
import { createComponentLogger } from '@/lib/utils/client-logger';
import type { Resume } from '@/lib/validations/jsonresume';

const logger = createComponentLogger('useResumeDetail');

export interface ResumeData {
  id: string;
  jobTitle?: string;
  companyName?: string;
  jobDescription?: string;
  content: Resume;
  coverLetter?: string;
}

export function useResumeDetail(resumeId: string) {
  const router = useRouter();
  
  const [resume, setResume] = useState<ResumeData | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);
  const [isDuplicating, setIsDuplicating] = useState(false);

  const fetchResume = useCallback(async () => {
    try {
      setIsLoading(true);
      setError(null);

      const result = await getResume(resumeId);

      if (!result.success || !result.data) {
        const errorResult = result as { error?: string };
        throw new ExternalServiceError('Resume API', errorResult.error || 'Failed to fetch resume');
      }

      setResume(result.data as ResumeData);
    } catch (err) {
      logger.error('Failed to fetch resume', err);
      setError(err instanceof Error ? err.message : 'Failed to load resume');
    } finally {
      setIsLoading(false);
    }
  }, [resumeId]);

  useEffect(() => {
    if (resumeId) {
      fetchResume();
    }
  }, [resumeId, fetchResume]);

  const handleDelete = useCallback(async () => {
    try {
      setIsDeleting(true);

      const result = await deleteResume(resumeId);

      if (!result.success) {
        const errorResult = result as { error?: string };
        throw new ExternalServiceError('Resume API', errorResult.error || 'Failed to delete resume');
      }

      toast.success('Resume deleted successfully');
      router.push('/resumes');
    } catch (err) {
      toast.error(err instanceof Error ? err.message : 'Failed to delete resume');
      setIsDeleting(false);
      throw err;
    }
  }, [resumeId, router]);

  const handleDuplicate = useCallback(async () => {
    try {
      setIsDuplicating(true);

      const result = await duplicateResume(resumeId);

      if (!result.success || !result.data) {
        const errorResult = result as { error?: string };
        throw new ExternalServiceError('Resume API', errorResult.error || 'Failed to duplicate resume');
      }

      toast.success('Resume duplicated successfully');
      const duplicatedResume = result.data as { id: string };
      router.push(`/resumes/${duplicatedResume.id}`);
    } catch (err) {
      toast.error(err instanceof Error ? err.message : 'Failed to duplicate resume');
    } finally {
      setIsDuplicating(false);
    }
  }, [resumeId, router]);

  const updateMetadata = useCallback(async (metadata: { jobTitle?: string }) => {
    try {
      const result = await updateResumeMetadata(resumeId, metadata);
      if (!result.success) throw new ExternalServiceError('Resume API', result.error);
      
      setResume(prev => prev ? { ...prev, ...metadata } : null);
      toast.success('Resume updated');
      return true;
    } catch (error) {
      toast.error('Failed to update resume');
      return false;
    }
  }, [resumeId]);

  return {
    resume,
    isLoading,
    error,
    isDeleting,
    isDuplicating,
    handleDelete,
    handleDuplicate,
    updateMetadata,
    setResume,
  };
}
