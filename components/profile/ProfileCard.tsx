/**
 * Profile Card Component
 * Displays profile information with preview using EntityCard
 */

'use client';

import { useTransition } from 'react';
import { Star, Edit, Copy, Check, Download } from 'lucide-react';
import { EntityCard, createCardAction } from "@/components/shared/EntityCard";
import type { GalleryCardAction } from "@/components/shared/GalleryCard";
import { useToastAction } from '@/hooks';
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
  const { runWithToast } = useToastAction();

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
    await runWithToast(
      async () => {
        await exportPdf();
        return true;
      },
      {
        successMessage: 'PDF exported successfully',
        errorMessage: 'Failed to export PDF',
      },
    );
  };

  const handleDuplicate = () => {
    startTransition(async () => {
      const result = await runWithToast(
        () => duplicateProfile(id),
        {
          successMessage: 'Profile duplicated successfully',
          errorMessage: 'Failed to duplicate profile',
        },
      );

      if (result?.success) {
        onDuplicate(result.data.id);
      }
    });
  };

  const handleSetDefault = () => {
    startTransition(async () => {
      const result = await runWithToast(
        () => setDefaultProfile(id),
        {
          successMessage: 'Default profile updated',
          errorMessage: 'Failed to set default profile',
        },
      );

      if (result?.success) {
        onSetDefault(id);
      }
    });
  };

  const handleDelete = async () => {
    const result = await runWithToast(
      () => deleteProfile(id),
      {
        successMessage: 'Profile deleted successfully',
        errorMessage: 'Failed to delete profile',
      },
    );

    if (result?.success) {
      onDelete(id);
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
