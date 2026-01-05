'use client';

import { Check } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter
} from '@/components/ui/dialog';

interface FormData {
  name: string;
  description: string;
  isPublic: boolean;
}

interface TemplateSettingsDialogProps {
  readonly open: boolean;
  readonly onOpenChange: (open: boolean) => void;
  readonly formData: FormData;
  readonly setFormData: (data: FormData) => void;
}

export function TemplateSettingsDialog({
  open,
  onOpenChange,
  formData,
  setFormData,
}: TemplateSettingsDialogProps) {
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[425px]">
        <DialogHeader>
          <DialogTitle>Template Settings</DialogTitle>
          <DialogDescription>
            Configure your template&apos;s basic information and visibility.
          </DialogDescription>
        </DialogHeader>
        <div className="grid gap-4 py-4">
          <div className="grid gap-2">
            <Label htmlFor="modal-name">Name</Label>
            <Input
              id="modal-name"
              value={formData.name}
              onChange={(e) => setFormData({ ...formData, name: e.target.value })}
              placeholder="Modern Professional"
            />
          </div>
          <div className="grid gap-2">
            <Label htmlFor="modal-description">Description</Label>
            <Textarea
              id="modal-description"
              value={formData.description}
              onChange={(e) => setFormData({ ...formData, description: e.target.value })}
              placeholder="Describe your template..."
              rows={3}
            />
          </div>
          <div className="flex items-center gap-2">
            <div
              className="flex items-center justify-center w-5 h-5 border rounded cursor-pointer"
              style={{
                backgroundColor: formData.isPublic ? 'var(--primary)' : 'transparent',
                borderColor: formData.isPublic ? 'var(--primary)' : 'var(--input)'
              }}
              onClick={() => setFormData({ ...formData, isPublic: !formData.isPublic })}
            >
              {formData.isPublic && <Check className="w-3.5 h-3.5 text-primary-foreground" />}
            </div>
            <Label
              className="cursor-pointer select-none"
              onClick={() => setFormData({ ...formData, isPublic: !formData.isPublic })}
            >
              Make template public
            </Label>
          </div>
        </div>
        <DialogFooter>
          <Button onClick={() => onOpenChange(false)}>Done</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
