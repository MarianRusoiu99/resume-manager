'use client';

import { useRouter } from 'next/navigation';
import { toast } from 'sonner';
import { deleteResume, duplicateResume } from '@/app/actions/resume';

export function useResumeOperations() {
  const router = useRouter();

  const handleDelete = async (id: string, title?: string) => {
    if (title && !confirm(`Are you sure you want to delete "${title}"?`)) {
      return false;
    }

    try {
      const result = await deleteResume(id);
      if (result.success) {
        toast.success('Resume deleted successfully');
        return true;
      } else {
        toast.error('Failed to delete resume');
        return false;
      }
    } catch (error) {
      toast.error('An unexpected error occurred');
      return false;
    }
  };

  const handleDuplicate = async (id: string) => {
    try {
      const result = await duplicateResume(id);
      if (result.success) {
        toast.success('Resume duplicated successfully');
        if (result.data?.id) {
          router.push(`/resumes/${result.data.id}`);
        }
      } else {
        toast.error('Failed to duplicate resume');
      }
    } catch (error) {
      toast.error('An unexpected error occurred');
    }
  };

  const handleView = (id: string) => {
    router.push(`/resumes/${id}`);
  };

  const handleEdit = (id: string) => {
    router.push(`/resumes/${id}/edit`);
  };

  return {
    handleDelete,
    handleDuplicate,
    handleView,
    handleEdit,
  };
}
