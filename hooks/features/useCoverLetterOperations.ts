'use client';

import { useRouter } from 'next/navigation';
import { toast } from 'sonner';
import { deleteCoverLetter } from '@/app/actions/cover-letter';

export function useCoverLetterOperations() {
  const router = useRouter();

  const handleDelete = async (id: string, title?: string) => {
    if (title && !confirm(`Are you sure you want to delete "${title}"?`)) {
      return false;
    }

    try {
      const result = await deleteCoverLetter(id);
      if (result.success) {
        toast.success('Cover letter deleted successfully');
        return true;
      } else {
        toast.error('Failed to delete cover letter');
        return false;
      }
    } catch (error) {
      toast.error('An unexpected error occurred');
      return false;
    }
  };

  const handleView = (id: string) => {
    router.push(`/cover-letters/${id}`);
  };

  const handleEdit = (id: string) => {
    router.push(`/cover-letters/${id}/edit`);
  };

  return {
    handleDelete,
    handleView,
    handleEdit,
  };
}
