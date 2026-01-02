'use client';

import { useRouter } from 'next/navigation';
import { useToastAction } from '@/hooks/useToastAction';
import { deleteCoverLetter } from '@/app/actions/cover-letter';

export function useCoverLetterOperations() {
  const router = useRouter();
  const { runWithToast } = useToastAction();

  const handleView = (id: string) => {
    router.push(`/cover-letters/${id}`);
  };

  const handleEdit = (id: string) => {
    router.push(`/cover-letters/${id}/edit`);
  };

  const handleDelete = async (id: string, onSuccess?: (id: string) => void) => {
    const result = await runWithToast(
      () => deleteCoverLetter(id),
      {
        successMessage: 'Cover letter deleted successfully',
        errorMessage: 'Failed to delete cover letter',
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
