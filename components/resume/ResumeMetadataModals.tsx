'use client';

import { useState } from 'react';
import { Button } from '@/components/ui';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { FileText } from 'lucide-react';

interface ResumeMetadataModalsProps {
  isRenameModalOpen: boolean;
  setIsRenameModalOpen: (open: boolean) => void;
  isInfoModalOpen: boolean;
  setIsInfoModalOpen: (open: boolean) => void;
  title: string;
  onSaveTitle: (title: string) => Promise<boolean>;
  companyName?: string;
  jobDescription?: string;
}

export function ResumeMetadataModals({
  isRenameModalOpen,
  setIsRenameModalOpen,
  isInfoModalOpen,
  setIsInfoModalOpen,
  title: initialTitle,
  onSaveTitle,
  companyName,
  jobDescription,
}: ResumeMetadataModalsProps) {
  const [title, setTitle] = useState(initialTitle);

  const handleSave = async () => {
    if (!title.trim()) {
      return;
    }
    const success = await onSaveTitle(title);
    if (success) {
      setIsRenameModalOpen(false);
    }
  };

  return (
    <>
      {/* Rename Modal */}
      <Dialog open={isRenameModalOpen} onOpenChange={setIsRenameModalOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Rename Resume</DialogTitle>
            <DialogDescription>Identify this resume in your library.</DialogDescription>
          </DialogHeader>
          <div className="py-4 space-y-4">
            <div className="space-y-2">
              <Label htmlFor="title" className="text-xs font-bold uppercase tracking-widest block">Resume Title</Label>
              <Input
                id="title"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                autoFocus
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setIsRenameModalOpen(false)}>Cancel</Button>
            <Button onClick={handleSave}>Save Changes</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Info/Job Description Modal */}
      <Dialog open={isInfoModalOpen} onOpenChange={setIsInfoModalOpen}>
        <DialogContent className="max-w-2xl max-h-[80vh] flex flex-col p-0 overflow-hidden border-none rounded-[2rem]">
          <DialogHeader className="p-8 pb-4">
            <div className="flex items-center gap-3 mb-2">
              <div className="p-2 bg-primary/10 rounded-lg">
                <FileText className="h-5 w-5 text-primary" />
              </div>
              <div>
                <DialogTitle className="text-xl font-bold">Job Details</DialogTitle>
                <DialogDescription>Reference information for this optimized resume.</DialogDescription>
              </div>
            </div>
          </DialogHeader>
          
          <div className="flex-1 overflow-y-auto px-8 pb-8 space-y-6 scrollbar-thin scrollbar-track-transparent scrollbar-thumb-muted-foreground/20">
            {companyName && (
              <div>
                <h4 className="text-[10px] font-bold uppercase tracking-widest text-primary mb-1">Company</h4>
                <p className="text-sm font-medium">{companyName}</p>
              </div>
            )}
            
            <div>
              <h4 className="text-[10px] font-bold uppercase tracking-widest text-primary mb-2">Job Description</h4>
              <div className="bg-muted/30 rounded-xl p-4 text-sm leading-relaxed whitespace-pre-wrap border border-primary/5">
                {jobDescription || "No job description provided."}
              </div>
            </div>
          </div>
          
          <DialogFooter className="p-6 bg-muted/20 border-t border-primary/5">
            <Button onClick={() => setIsInfoModalOpen(false)} className="rounded-xl font-bold uppercase tracking-widest text-[10px] px-6">
              Close
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
}
