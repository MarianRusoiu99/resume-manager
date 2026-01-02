'use client';

import { useRouter } from 'next/navigation';
import { useToastAction } from '@/hooks/useToastAction';
import { deleteResume } from '@/app/actions/resume';

export function useResumeOperations() {
  const router = useRouter();
  const { runWithToast } = useToastAction();

  const handleView = (id: string) => {
    router.push(`/resumes/${id}`);
  };

  const handleEdit = (id: string) => {
    router.push(`/resumes/${id}/edit`);
  };

  const handleDelete = async (id: string, onSuccess?: (id: string) => void) => {
    const result = await runWithToast(
      () => deleteResume(id),
      {
        successMessage: 'Resume deleted successfully',
        errorMessage: 'Failed to delete resume',
      },
    );

    if (result?.success && onSuccess) {
      onSuccess(id);
    }
    
    return result?.success;
  };

  return {
    handleView,
    handleEdit,
    handleDelete,
  };
}
