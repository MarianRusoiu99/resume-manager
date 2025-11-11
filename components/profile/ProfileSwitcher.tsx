"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { Plus, Check, Copy, Trash2, MoreVertical, Star } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { toast } from "sonner";
import { cn } from "@/lib/utils";

interface Profile {
  id: string;
  name: string;
  isDefault: boolean;
  createdAt: Date;
  updatedAt: Date;
}

interface ProfileSwitcherProps {
  currentProfileId?: string;
  onProfileChange?: (profileId: string) => void;
}

export function ProfileSwitcher({ currentProfileId, onProfileChange }: ProfileSwitcherProps) {
  const router = useRouter();
  const [profiles, setProfiles] = useState<Profile[]>([]);
  const [loading, setLoading] = useState(true);
  const [isCreateDialogOpen, setIsCreateDialogOpen] = useState(false);
  const [isRenameDialogOpen, setIsRenameDialogOpen] = useState(false);
  const [newProfileName, setNewProfileName] = useState("");
  const [selectedProfileForRename, setSelectedProfileForRename] = useState<Profile | null>(null);

  // Load profiles
  useEffect(() => {
    loadProfiles();
  }, []);

  const loadProfiles = async () => {
    try {
      const response = await fetch("/api/profiles");
      if (response.ok) {
        const data = await response.json();
        setProfiles(data);
      }
    } catch (error) {
      console.error("Failed to load profiles:", error);
      toast.error("Failed to load profiles");
    } finally {
      setLoading(false);
    }
  };

  const createProfile = async () => {
    if (!newProfileName.trim()) {
      toast.error("Please enter a profile name");
      return;
    }

    try {
      const response = await fetch("/api/profiles", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: newProfileName,
          resume: { basics: { name: "" } }, // Empty resume
          isDefault: profiles.length === 0, // First profile is default
        }),
      });

      if (response.ok) {
        const newProfile = await response.json();
        toast.success("Profile created successfully");
        setProfiles([...profiles, newProfile]);
        setIsCreateDialogOpen(false);
        setNewProfileName("");
        
        // Switch to new profile
        if (onProfileChange) {
          onProfileChange(newProfile.id);
        }
        router.refresh();
      } else {
        const error = await response.json();
        toast.error(error.error || "Failed to create profile");
      }
    } catch (error) {
      console.error("Failed to create profile:", error);
      toast.error("Failed to create profile");
    }
  };

  const renameProfile = async () => {
    if (!selectedProfileForRename || !newProfileName.trim()) {
      return;
    }

    try {
      const response = await fetch(`/api/profiles/${selectedProfileForRename.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name: newProfileName }),
      });

      if (response.ok) {
        toast.success("Profile renamed successfully");
        setProfiles(
          profiles.map((p) =>
            p.id === selectedProfileForRename.id ? { ...p, name: newProfileName } : p
          )
        );
        setIsRenameDialogOpen(false);
        setSelectedProfileForRename(null);
        setNewProfileName("");
        router.refresh();
      } else {
        const error = await response.json();
        toast.error(error.error || "Failed to rename profile");
      }
    } catch (error) {
      console.error("Failed to rename profile:", error);
      toast.error("Failed to rename profile");
    }
  };

  const duplicateProfile = async (profileId: string) => {
    try {
      const response = await fetch(`/api/profiles/${profileId}/duplicate`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({}),
      });

      if (response.ok) {
        const newProfile = await response.json();
        toast.success("Profile duplicated successfully");
        setProfiles([...profiles, newProfile]);
        router.refresh();
      } else {
        const error = await response.json();
        toast.error(error.error || "Failed to duplicate profile");
      }
    } catch (error) {
      console.error("Failed to duplicate profile:", error);
      toast.error("Failed to duplicate profile");
    }
  };

  const setDefaultProfile = async (profileId: string) => {
    try {
      const response = await fetch(`/api/profiles/${profileId}/set-default`, {
        method: "POST",
      });

      if (response.ok) {
        toast.success("Default profile updated");
        setProfiles(
          profiles.map((p) => ({
            ...p,
            isDefault: p.id === profileId,
          }))
        );
        router.refresh();
      } else {
        const error = await response.json();
        toast.error(error.error || "Failed to set default profile");
      }
    } catch (error) {
      console.error("Failed to set default profile:", error);
      toast.error("Failed to set default profile");
    }
  };

  const deleteProfile = async (profileId: string) => {
    if (profiles.length <= 1) {
      toast.error("Cannot delete your last profile");
      return;
    }

    if (!confirm("Are you sure you want to delete this profile?")) {
      return;
    }

    try {
      const response = await fetch(`/api/profiles/${profileId}`, {
        method: "DELETE",
      });

      if (response.ok) {
        toast.success("Profile deleted successfully");
        const updatedProfiles = profiles.filter((p) => p.id !== profileId);
        setProfiles(updatedProfiles);
        
        // If deleted current profile, switch to default
        if (currentProfileId === profileId && updatedProfiles.length > 0) {
          const defaultProfile = updatedProfiles.find((p) => p.isDefault) || updatedProfiles[0];
          if (onProfileChange) {
            onProfileChange(defaultProfile.id);
          }
        }
        
        router.refresh();
      } else {
        const error = await response.json();
        toast.error(error.error || "Failed to delete profile");
      }
    } catch (error) {
      console.error("Failed to delete profile:", error);
      toast.error("Failed to delete profile");
    }
  };

  const selectProfile = (profileId: string) => {
    if (onProfileChange) {
      onProfileChange(profileId);
    }
    router.push(`/profile?id=${profileId}`);
  };

  if (loading) {
    return (
      <div className="w-64 border-r bg-muted/10 p-4">
        <div className="space-y-2">
          <div className="h-10 bg-muted animate-pulse rounded" />
          <div className="h-10 bg-muted animate-pulse rounded" />
        </div>
      </div>
    );
  }

  return (
    <>
      <div className="w-64 border-r bg-muted/10 flex flex-col h-full">
        {/* Header */}
        <div className="p-4 border-b">
          <div className="flex items-center justify-between mb-4">
            <h2 className="font-semibold text-sm text-muted-foreground">PROFILES</h2>
            <Button
              size="sm"
              variant="ghost"
              onClick={() => setIsCreateDialogOpen(true)}
              className="h-8 w-8 p-0"
            >
              <Plus className="h-4 w-4" />
            </Button>
          </div>
        </div>

        {/* Profile List */}
        <div className="flex-1 overflow-y-auto p-2">
          {profiles.map((profile) => (
            <button
              key={profile.id}
              onClick={() => selectProfile(profile.id)}
              className={cn(
                "w-full flex items-center justify-between p-3 rounded-lg mb-1 transition-colors",
                "hover:bg-muted/50",
                currentProfileId === profile.id && "bg-primary/10 border border-primary/20"
              )}
            >
              <div className="flex items-center gap-2 flex-1 min-w-0">
                {profile.isDefault && (
                  <Star className="h-4 w-4 text-yellow-500 shrink-0" fill="currentColor" />
                )}
                {currentProfileId === profile.id && (
                  <Check className="h-4 w-4 text-primary shrink-0" />
                )}
                <span className="text-sm truncate font-medium">{profile.name}</span>
              </div>

              <DropdownMenu>
                <DropdownMenuTrigger asChild onClick={(e) => e.stopPropagation()}>
                  <Button variant="ghost" size="sm" className="h-8 w-8 p-0">
                    <MoreVertical className="h-4 w-4" />
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end">
                  <DropdownMenuItem
                    onClick={(e) => {
                      e.stopPropagation();
                      setSelectedProfileForRename(profile);
                      setNewProfileName(profile.name);
                      setIsRenameDialogOpen(true);
                    }}
                  >
                    Rename
                  </DropdownMenuItem>
                  <DropdownMenuItem
                    onClick={(e) => {
                      e.stopPropagation();
                      duplicateProfile(profile.id);
                    }}
                  >
                    <Copy className="h-4 w-4 mr-2" />
                    Duplicate
                  </DropdownMenuItem>
                  {!profile.isDefault && (
                    <DropdownMenuItem
                      onClick={(e) => {
                        e.stopPropagation();
                        setDefaultProfile(profile.id);
                      }}
                    >
                      <Star className="h-4 w-4 mr-2" />
                      Set as Default
                    </DropdownMenuItem>
                  )}
                  <DropdownMenuSeparator />
                  <DropdownMenuItem
                    onClick={(e) => {
                      e.stopPropagation();
                      deleteProfile(profile.id);
                    }}
                    className="text-destructive"
                    disabled={profiles.length <= 1}
                  >
                    <Trash2 className="h-4 w-4 mr-2" />
                    Delete
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
            </button>
          ))}
        </div>
      </div>

      {/* Create Profile Dialog */}
      <Dialog open={isCreateDialogOpen} onOpenChange={setIsCreateDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Create New Profile</DialogTitle>
            <DialogDescription>
              Create a new resume profile. You can customize it later.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label htmlFor="profile-name">Profile Name</Label>
              <Input
                id="profile-name"
                placeholder="e.g., Software Engineer, Product Manager"
                value={newProfileName}
                onChange={(e) => setNewProfileName(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === "Enter") {
                    createProfile();
                  }
                }}
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setIsCreateDialogOpen(false)}>
              Cancel
            </Button>
            <Button onClick={createProfile}>Create Profile</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Rename Profile Dialog */}
      <Dialog open={isRenameDialogOpen} onOpenChange={setIsRenameDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Rename Profile</DialogTitle>
            <DialogDescription>
              Enter a new name for this profile.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label htmlFor="rename-profile">Profile Name</Label>
              <Input
                id="rename-profile"
                value={newProfileName}
                onChange={(e) => setNewProfileName(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === "Enter") {
                    renameProfile();
                  }
                }}
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setIsRenameDialogOpen(false)}>
              Cancel
            </Button>
            <Button onClick={renameProfile}>Rename</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
}
