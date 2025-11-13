/**
 * Profile Card Component
 * Displays profile information with preview using GalleryCard
 */

'use client';

import { useState, useEffect } from 'react';
import { Star, Edit, Copy, Trash2, Check } from 'lucide-react';
import { GalleryCard, type GalleryCardAction } from '@/components/ui/GalleryCard';
import { ConfirmDialog } from '@/components/ui/ConfirmDialog';
import { toast } from 'sonner';
import type { Resume } from '@/lib/validations/jsonresume';
import { renderTemplateClientSide } from '@/lib/utils/client-renderer';

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
  const [showDeleteDialog, setShowDeleteDialog] = useState(false);
  const [previewHtml, setPreviewHtml] = useState<string | undefined>(undefined);
  const [isLoadingPreview, setIsLoadingPreview] = useState(false);

  // Extract metadata from resume data
  const email = resumeData?.basics?.email || 'No email';
  const location = resumeData?.basics?.location?.city || 'No location';
  const workExperienceCount = resumeData?.work?.length || 0;
  const educationCount = resumeData?.education?.length || 0;
  const skillsCount = resumeData?.skills?.length || 0;

  // Generate preview HTML when component mounts
  useEffect(() => {
    async function generatePreview() {
      if (!resumeData) return;

      try {
        setIsLoadingPreview(true);

        // Fetch default template
        const templatesResponse = await fetch('/api/templates?limit=1');
        if (!templatesResponse.ok) return;

        const { templates } = await templatesResponse.json();
        if (!templates || templates.length === 0) return;

        const template = templates[0];

        // Render preview client-side
        const html = renderTemplateClientSide({
          htmlTemplate: template.htmlTemplate,
          cssStyles: template.cssStyles,
          resumeData,
        });

        setPreviewHtml(html);
      } catch (error) {
        console.error('Failed to generate preview:', error);
      } finally {
        setIsLoadingPreview(false);
      }
    }

    generatePreview();
  }, [resumeData]);

  // Define actions for dropdown menu
  const actions: GalleryCardAction[] = [
    {
      label: 'Edit',
      icon: <Edit className="h-4 w-4" />,
      onClick: () => onEdit(id),
    },
    {
      label: 'Duplicate',
      icon: <Copy className="h-4 w-4" />,
      onClick: async () => {
        try {
          const response = await fetch(`/api/profiles/${id}/duplicate`, {
            method: 'POST',
          });

          if (!response.ok) {
            const error = await response.json();
            throw new Error(error.error || 'Failed to duplicate profile');
          }

          const data = await response.json();
          toast.success('Profile duplicated successfully');
          onDuplicate(data.profile.id);
        } catch (error) {
          const message =
            error instanceof Error ? error.message : 'Failed to duplicate profile';
          toast.error(message);
        }
      },
    },
    ...(isDefault
      ? []
      : [
          {
            label: 'Set as Default',
            icon: <Check className="h-4 w-4" />,
            onClick: async () => {
              try {
                const response = await fetch(`/api/profiles/${id}/default`, {
                  method: 'POST',
                });

                if (!response.ok) {
                  const error = await response.json();
                  throw new Error(error.error || 'Failed to set default profile');
                }

                toast.success('Default profile updated');
                onSetDefault(id);
              } catch (error) {
                const message =
                  error instanceof Error ? error.message : 'Failed to set default profile';
                toast.error(message);
              }
            },
          },
        ]),
    {
      label: 'Delete',
      icon: <Trash2 className="h-4 w-4" />,
      onClick: () => setShowDeleteDialog(true),
      variant: 'destructive',
    },
  ];

  const handleDelete = async () => {
    try {
      const response = await fetch(`/api/profiles/${id}`, {
        method: 'DELETE',
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || 'Failed to delete profile');
      }

      toast.success('Profile deleted successfully');
      onDelete(id);
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Failed to delete profile';
      toast.error(message);
    } finally {
      setShowDeleteDialog(false);
    }
  };

  return (
    <>
      <GalleryCard
        id={id}
        title={name}
        subtitle={`${email} • ${location}`}
        href={`/profile/${id}`}
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
      />

      <ConfirmDialog
        isOpen={showDeleteDialog}
        onCancel={() => setShowDeleteDialog(false)}
        onConfirm={handleDelete}
        title="Delete Profile"
        message="Are you sure you want to delete this profile? This action cannot be undone."
        confirmText="Delete"
        variant="danger"
      />
    </>
  );
}
