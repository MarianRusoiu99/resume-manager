"use client";

import { useState } from "react";
import { Card, Button, Badge } from "@/components/ui";
import { Star, MoreVertical, Edit, Copy, Trash2, Check } from "lucide-react";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { ConfirmDialog } from "@/components/ui/ConfirmDialog";
import { toast } from "sonner";
import type { Resume } from "@/lib/validations/jsonresume";

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
}: ProfileCardProps) {
  const [showDeleteDialog, setShowDeleteDialog] = useState(false);

  // Extract some summary info from resume data
  const email = resumeData?.basics?.email || "No email";
  const location = resumeData?.basics?.location?.city || "No location";
  const workExperienceCount = resumeData?.work?.length || 0;
  const educationCount = resumeData?.education?.length || 0;
  const skillsCount = resumeData?.skills?.length || 0;

  const handleDelete = async () => {
    try {
      const response = await fetch(`/api/profiles/${id}`, {
        method: "DELETE",
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || "Failed to delete profile");
      }

      toast.success("Profile deleted successfully");
      onDelete(id);
    } catch (error) {
      const message = error instanceof Error ? error.message : "Failed to delete profile";
      toast.error(message);
    }
  };

  const handleDuplicate = async () => {
    try {
      const response = await fetch(`/api/profiles/${id}/duplicate`, {
        method: "POST",
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || "Failed to duplicate profile");
      }

      const data = await response.json();
      toast.success("Profile duplicated successfully");
      onDuplicate(data.profile.id);
    } catch (error) {
      const message = error instanceof Error ? error.message : "Failed to duplicate profile";
      toast.error(message);
    }
  };

  const handleSetDefault = async () => {
    try {
      const response = await fetch(`/api/profiles/${id}/default`, {
        method: "POST",
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || "Failed to set default profile");
      }

      toast.success("Default profile updated");
      onSetDefault(id);
    } catch (error) {
      const message = error instanceof Error ? error.message : "Failed to set default profile";
      toast.error(message);
    }
  };

  return (
    <>
      <Card className="group hover:shadow-lg transition-shadow cursor-pointer relative">
        <div className="absolute top-4 right-4 flex items-center gap-2">
          {isDefault && (
            <Badge variant="secondary" className="gap-1">
              <Star className="h-3 w-3 fill-yellow-500 text-yellow-500" />
              Default
            </Badge>
          )}
          
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button
                variant="ghost"
                size="sm"
                className="h-8 w-8 p-0 opacity-0 group-hover:opacity-100 transition-opacity"
                onClick={(e) => e.stopPropagation()}
              >
                <MoreVertical className="h-4 w-4" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
              <DropdownMenuItem onClick={() => onEdit(id)}>
                <Edit className="h-4 w-4 mr-2" />
                Edit
              </DropdownMenuItem>
              <DropdownMenuItem onClick={handleDuplicate}>
                <Copy className="h-4 w-4 mr-2" />
                Duplicate
              </DropdownMenuItem>
              {!isDefault && (
                <DropdownMenuItem onClick={handleSetDefault}>
                  <Check className="h-4 w-4 mr-2" />
                  Set as Default
                </DropdownMenuItem>
              )}
              <DropdownMenuItem
                onClick={(e) => {
                  e.stopPropagation();
                  setShowDeleteDialog(true);
                }}
                className="text-destructive"
              >
                <Trash2 className="h-4 w-4 mr-2" />
                Delete
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>

        <div className="p-6" onClick={() => onEdit(id)}>
          <h3 className="text-xl font-semibold mb-2">{name}</h3>
          
          <div className="space-y-2 text-sm text-muted-foreground">
            <p className="truncate">{email}</p>
            <p>{location}</p>
            
            <div className="flex gap-4 pt-2 border-t">
              <div>
                <span className="font-medium text-foreground">{workExperienceCount}</span>
                <span className="ml-1">Work</span>
              </div>
              <div>
                <span className="font-medium text-foreground">{educationCount}</span>
                <span className="ml-1">Education</span>
              </div>
              <div>
                <span className="font-medium text-foreground">{skillsCount}</span>
                <span className="ml-1">Skills</span>
              </div>
            </div>
          </div>
        </div>
      </Card>

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
