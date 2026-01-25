"use client";

import { useCallback } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Plus, Trash2, Globe, User as UserIcon, Link as LinkIcon } from "lucide-react";

interface ProfileListFieldProps {
  label: string;
  value: { network: string; username?: string; url?: string }[];
  onChange: (value: { network: string; username?: string; url?: string }[]) => void;
  description?: string;
  disabled?: boolean;
}

export function ProfileListField({
  label,
  value,
  onChange,
  description,
  disabled,
}: ProfileListFieldProps) {
  const addProfile = useCallback(() => {
    onChange([...value, { network: "", username: "", url: "" }]);
  }, [value, onChange]);

  const removeProfile = useCallback((index: number) => {
    onChange(value.filter((_, i) => i !== index));
  }, [value, onChange]);

  const updateProfile = useCallback((index: number, field: string, newValue: string) => {
    const newProfiles = [...value];
    newProfiles[index] = { ...newProfiles[index], [field]: newValue };
    onChange(newProfiles);
  }, [value, onChange]);

  return (
    <div className="space-y-3">
      <div className="flex items-center justify-between">
        <Label className="text-base font-semibold">{label}</Label>
        <Button
          type="button"
          variant="outline"
          size="sm"
          onClick={addProfile}
          disabled={disabled}
          className="h-8 gap-1"
        >
          <Plus className="h-4 w-4" />
          Add Profile
        </Button>
      </div>

      {description && (
        <p className="text-sm text-muted-foreground">{description}</p>
      )}

      <div className="space-y-3">
        {value.map((profile, index) => (
          <div
            key={index}
            className="flex flex-col gap-3 p-4 border rounded-lg bg-card/50 relative group"
          >
            <Button
              type="button"
              variant="ghost"
              size="icon"
              className="absolute -right-2 -top-2 h-7 w-7 rounded-full bg-background border shadow-sm opacity-0 group-hover:opacity-100 transition-opacity text-destructive hover:text-destructive hover:bg-destructive/10"
              onClick={() => removeProfile(index)}
              disabled={disabled}
            >
              <Trash2 className="h-4 w-4" />
            </Button>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div className="space-y-1.5">
                <div className="flex items-center gap-2 text-xs font-medium text-muted-foreground ml-1">
                  <Globe className="h-3 w-3" />
                  Network
                </div>
                <Input
                  placeholder="e.g. LinkedIn, GitHub"
                  value={profile.network}
                  onChange={(e) => updateProfile(index, "network", e.target.value)}
                  disabled={disabled}
                  className="h-9"
                />
              </div>
              <div className="space-y-1.5">
                <div className="flex items-center gap-2 text-xs font-medium text-muted-foreground ml-1">
                  <UserIcon className="h-3 w-3" />
                  Username
                </div>
                <Input
                  placeholder="username"
                  value={profile.username}
                  onChange={(e) => updateProfile(index, "username", e.target.value)}
                  disabled={disabled}
                  className="h-9"
                />
              </div>
            </div>

            <div className="space-y-1.5">
              <div className="flex items-center gap-2 text-xs font-medium text-muted-foreground ml-1">
                <LinkIcon className="h-3 w-3" />
                URL
              </div>
              <Input
                placeholder="https://..."
                value={profile.url}
                onChange={(e) => updateProfile(index, "url", e.target.value)}
                disabled={disabled}
                className="h-9"
              />
            </div>
          </div>
        ))}

        {value.length === 0 && (
          <div className="text-center py-6 border border-dashed rounded-lg bg-muted/20">
            <p className="text-sm text-muted-foreground">No social profiles added yet.</p>
          </div>
        )}
      </div>
    </div>
  );
}
