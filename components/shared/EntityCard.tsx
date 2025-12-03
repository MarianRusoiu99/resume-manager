"use client";

import { useState, type ReactNode } from "react";
import { GalleryCard, type GalleryCardProps, type GalleryCardAction } from "@/components/shared/GalleryCard";
import { ConfirmDialog } from "@/components/shared/ConfirmDialog";

interface DeleteDialogConfig {
  title: string;
  message: string;
  confirmText?: string;
}

export interface EntityCardProps extends Omit<GalleryCardProps, "actions"> {
  /** Actions for the card dropdown menu */
  actions?: GalleryCardAction[];
  
  /** Delete action configuration - if provided, adds delete to actions with confirmation */
  onDelete?: () => void | Promise<void>;
  
  /** Delete dialog configuration */
  deleteDialog?: DeleteDialogConfig;
  
  /** Whether delete action is in progress */
  isDeleting?: boolean;
}

const DEFAULT_DELETE_DIALOG: DeleteDialogConfig = {
  title: "Delete Item",
  message: "Are you sure you want to delete this item? This action cannot be undone.",
  confirmText: "Delete",
};

/**
 * EntityCard - Wrapper around GalleryCard with built-in delete confirmation
 * 
 * Reduces boilerplate by handling the common pattern of:
 * - GalleryCard display
 * - Delete action with confirmation dialog
 * 
 * @example
 * ```tsx
 * <EntityCard
 *   id={profile.id}
 *   title={profile.name}
 *   subtitle={profile.email}
 *   href={`/profile/${profile.id}`}
 *   previewHtml={previewHtml}
 *   isPreviewLoading={isLoading}
 *   actions={[
 *     { label: 'Edit', icon: <Edit />, onClick: () => handleEdit(profile.id) },
 *   ]}
 *   onDelete={() => handleDelete(profile.id)}
 *   deleteDialog={{
 *     title: 'Delete Profile',
 *     message: 'Are you sure you want to delete this profile?',
 *   }}
 * />
 * ```
 */
export function EntityCard({
  actions = [],
  onDelete,
  deleteDialog = DEFAULT_DELETE_DIALOG,
  isDeleting = false,
  ...galleryCardProps
}: EntityCardProps) {
  const [showDeleteDialog, setShowDeleteDialog] = useState(false);
  const [isDeletePending, setIsDeletePending] = useState(false);

  // Build final actions array
  const finalActions: GalleryCardAction[] = [...actions];

  // Add delete action if onDelete is provided
  if (onDelete) {
    // Add separator if there are other actions
    finalActions.push({
      label: deleteDialog.confirmText || "Delete",
      onClick: () => setShowDeleteDialog(true),
      variant: "destructive",
      disabled: isDeleting || isDeletePending,
    });
  }

  const handleConfirmDelete = async () => {
    if (!onDelete) return;

    try {
      setIsDeletePending(true);
      await onDelete();
    } finally {
      setIsDeletePending(false);
      setShowDeleteDialog(false);
    }
  };

  return (
    <>
      <GalleryCard
        {...galleryCardProps}
        actions={finalActions}
      />

      {onDelete && (
        <ConfirmDialog
          isOpen={showDeleteDialog}
          onCancel={() => setShowDeleteDialog(false)}
          onConfirm={handleConfirmDelete}
          title={deleteDialog.title}
          message={deleteDialog.message}
          confirmText={deleteDialog.confirmText || "Delete"}
          variant="danger"
        />
      )}
    </>
  );
}

/**
 * Helper to create common card action configurations
 */
export const createCardAction = {
  edit: (onClick: () => void, icon?: ReactNode): GalleryCardAction => ({
    label: "Edit",
    icon,
    onClick,
  }),
  
  view: (onClick: () => void, icon?: ReactNode): GalleryCardAction => ({
    label: "View",
    icon,
    onClick,
  }),
  
  duplicate: (onClick: () => void, icon?: ReactNode, disabled?: boolean): GalleryCardAction => ({
    label: "Duplicate",
    icon,
    onClick,
    disabled,
  }),
  
  export: (onClick: () => void, icon?: ReactNode, disabled?: boolean): GalleryCardAction => ({
    label: "Export PDF",
    icon,
    onClick,
    disabled,
  }),
  
  setDefault: (onClick: () => void, icon?: ReactNode, disabled?: boolean): GalleryCardAction => ({
    label: "Set as Default",
    icon,
    onClick,
    disabled,
  }),
};
