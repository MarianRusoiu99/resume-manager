/**
 * Profile Card Component
 * Displays profile information with preview using EntityCard
 */

'use client';

import { useTransition } from 'react';
import { Star, Edit, Copy, Check, Download } from 'lucide-react';
import { EntityCard, createCardAction } from "@/components/shared/EntityCard";
import type { GalleryCardAction } from "@/components/shared/GalleryCard";
import { toast } from 'sonner';
import type { Resume } from '@/lib/validations/jsonresume';
import { useCardPreview, useExportPdf } from '@/hooks/useCardPreview';
import { deleteProfile, duplicateProfile, setDefaultProfile } from '@/app/actions/profile';
import { ROUTES } from '@/lib/constants';

interface ProfileCardProps {
  id: string;
  name: string;
  isDefault: boolean;
  resumeData: Resume | null;
  onEdit: (id: string) => void;
  onDelete: (id: string) => void;
  onDuplicate: (id: string) => void;
  onSetDefault: (id: string) => void;
}

export function ProfileCard({
  id,
  name,
  isDefault,
  resumeData,
  onEdit,
  onDelete,
  onDuplicate,
  onSetDefault,
}: Readonly<ProfileCardProps>) {
  const [isPending, startTransition] = useTransition();

  // Use shared hooks for preview and export
  const { previewHtml, isLoading: isLoadingPreview } = useCardPreview({
    content: resumeData,
    enabled: !!resumeData,
  });

  const { exportPdf } = useExportPdf({
    content: resumeData,
    fileName: name,
  });

  // Extract metadata from resume data
  const email = resumeData?.basics?.email || 'No email';
  const location = resumeData?.basics?.location?.city || 'No location';
  const workExperienceCount = resumeData?.work?.length || 0;
  const educationCount = resumeData?.education?.length || 0;
  const skillsCount = resumeData?.skills?.length || 0;

  const handleExportPDF = async () => {
    try {
      await exportPdf();
      toast.success('PDF exported successfully');
    } catch {
      toast.error('Failed to export PDF');
    }
  };

  const handleDuplicate = () => {
    startTransition(async () => {
      const result = await duplicateProfile(id);
      if (result.success) {
        toast.success('Profile duplicated successfully');
        onDuplicate(result.data.id);
      } else {
        toast.error(result.error || 'Failed to duplicate profile');
      }
    });
  };

  const handleSetDefault = () => {
    startTransition(async () => {
      const result = await setDefaultProfile(id);
      if (result.success) {
        toast.success('Default profile updated');
        onSetDefault(id);
      } else {
        toast.error(result.error || 'Failed to set default profile');
      }
    });
  };

  const handleDelete = async () => {
    const result = await deleteProfile(id);
    if (result.success) {
      toast.success('Profile deleted successfully');
      onDelete(id);
    } else {
      toast.error(result.error || 'Failed to delete profile');
    }
  };

  // Build actions array
  const actions: GalleryCardAction[] = [
    createCardAction.edit(() => onEdit(id), <Edit className="h-4 w-4" />),
    createCardAction.export(handleExportPDF, <Download className="h-4 w-4" />),
    createCardAction.duplicate(handleDuplicate, <Copy className="h-4 w-4" />, isPending),
    ...(isDefault
      ? []
      : [createCardAction.setDefault(handleSetDefault, <Check className="h-4 w-4" />, isPending)]),
  ];

  return (
    <EntityCard
      id={id}
      title={name}
      subtitle={`${email} • ${location}`}
      href={ROUTES.PROFILE(id)}
      previewHtml={previewHtml}
      isPreviewLoading={isLoadingPreview}
      badges={
        isDefault
          ? [
              {
                label: 'Default',
                variant: 'secondary',
                icon: <Star className="h-3 w-3 fill-yellow-500 text-yellow-500" />,
              },
            ]
          : []
      }
      metadata={[
        { label: 'Work', value: workExperienceCount },
        { label: 'Education', value: educationCount },
        { label: 'Skills', value: skillsCount },
      ]}
      actions={actions}
      onDelete={handleDelete}
      deleteDialog={{
        title: "Delete Profile",
        message: "Are you sure you want to delete this profile? This action cannot be undone.",
      }}
    />
  );
}
