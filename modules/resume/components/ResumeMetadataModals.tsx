'use client';

import { useState } from 'react';
import { Button } from '@/components/ui';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { FileText, Cpu, Zap, Calendar } from 'lucide-react';

interface ResumeMetadataModalsProps {
  isRenameModalOpen: boolean;
  setIsRenameModalOpen: (open: boolean) => void;
  isInfoModalOpen: boolean;
  setIsInfoModalOpen: (open: boolean) => void;
  title: string;
  onSaveTitle: (title: string) => Promise<boolean>;
  companyName?: string;
  jobDescription?: string;
  metadata?: {
    modelId?: string;
    usage?: {
      totalTokens?: number;
    };
    matchScore?: number;
    suggestions?: string[];
    personalInstructions?: string;
  };
  createdAt?: string | Date;
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
  metadata,
  createdAt,
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
        <DialogContent className="max-w-4xl max-h-[90vh] flex flex-col p-0 overflow-hidden border-none rounded-[2rem] shadow-2xl">
          <DialogHeader className="p-10 pb-4">
            <div className="flex items-center gap-3 mb-2">
              <div className="p-2 bg-primary/10 rounded-lg">
                <FileText className="h-5 w-5 text-primary" />
              </div>
              <div>
                <DialogTitle className="text-2xl font-black tracking-tight">Resume Insights</DialogTitle>
                <DialogDescription className="text-xs font-bold uppercase tracking-widest opacity-70">Details about your AI-optimized document.</DialogDescription>
              </div>
            </div>
          </DialogHeader>
          
          <div className="flex-1 overflow-y-auto px-10 pb-10 space-y-10 scrollbar-thin scrollbar-track-transparent scrollbar-thumb-muted-foreground/20">
            {/* Optimization Score */}
            {metadata?.matchScore !== undefined && (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-10 bg-primary/5 p-8 rounded-[1.5rem] border border-primary/10">
                <div>
                  <h4 className="text-[10px] font-bold uppercase tracking-widest text-primary mb-3 flex items-center gap-2">
                    <Zap className="w-3 h-3" />
                    Optimization Score
                  </h4>
                  <div className="flex items-end gap-2">
                    <span className="text-5xl font-black tracking-tighter text-primary">
                      {metadata.matchScore}
                    </span>
                    <span className="text-sm font-bold text-muted-foreground mb-2 uppercase tracking-widest">% Match</span>
                  </div>
                  <div className="mt-6 w-full bg-muted rounded-full h-2 overflow-hidden">
                    <div 
                      className="bg-primary h-full transition-all duration-1000 ease-out"
                      style={{ width: `${metadata.matchScore}%` }}
                    />
                  </div>
                </div>
                
                {metadata.usage?.totalTokens !== undefined && (
                  <div className="flex flex-col justify-center border-l border-primary/10 pl-10">
                    <h4 className="text-[10px] font-bold uppercase tracking-widest text-primary mb-3 flex items-center gap-2">
                      <Cpu className="w-3 h-3" />
                      AI Details
                    </h4>
                    <div className="space-y-3">
                      <div className="flex justify-between text-[11px]">
                        <span className="text-muted-foreground font-bold uppercase tracking-widest">Model</span>
                        <span className="font-mono font-bold bg-primary/5 px-2 py-0.5 rounded text-primary">{metadata.modelId || 'gpt-4o'}</span>
                      </div>
                      <div className="flex justify-between text-[11px]">
                        <span className="text-muted-foreground font-bold uppercase tracking-widest">Usage</span>
                        <span className="font-mono font-bold bg-muted px-2 py-0.5 rounded">{metadata.usage.totalTokens} Tokens</span>
                      </div>
                    </div>
                  </div>
                )}
              </div>
            )}

            {/* Suggestions */}
            {metadata?.suggestions && metadata.suggestions.length > 0 && (
              <div className="space-y-6">
                <h4 className="text-[10px] font-bold uppercase tracking-widest text-primary flex items-center gap-2">
                  <Zap className="w-3 h-3 text-yellow-500" />
                  Key Improvements
                </h4>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {metadata.suggestions.map((suggestion, i) => (
                    <div key={i} className="flex gap-4 p-5 bg-muted/20 rounded-2xl text-[13px] leading-relaxed text-muted-foreground border border-primary/5 hover:bg-muted/30 transition-all hover:border-primary/10 group">
                      <div className="w-2 h-2 rounded-full bg-primary/20 mt-1.5 shrink-0 group-hover:bg-primary transition-colors" />
                      {suggestion}
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Context */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-10">
              {companyName && (
                <div>
                  <h4 className="text-[10px] font-bold uppercase tracking-widest text-primary mb-2">Target Company</h4>
                  <p className="text-lg font-black tracking-tight">{companyName}</p>
                </div>
              )}
              {createdAt && (
                <div>
                  <h4 className="text-[10px] font-bold uppercase tracking-widest text-primary mb-2 flex items-center gap-2">
                    <Calendar className="w-3 h-3" />
                    Generated On
                  </h4>
                  <p className="text-lg font-black tracking-tight">{new Date(createdAt).toLocaleDateString(undefined, { dateStyle: 'long' })}</p>
                </div>
              )}
            </div>

            {/* Job Description */}
            <div className="space-y-6 pt-6 border-t border-primary/5">
              <h4 className="text-[10px] font-bold uppercase tracking-widest text-primary mb-2">Original Job Description</h4>
              <div className="bg-muted/30 rounded-[1.5rem] p-8 text-[13px] leading-relaxed whitespace-pre-wrap font-mono text-muted-foreground border border-primary/5 max-h-[500px] overflow-y-auto scrollbar-hide select-all">
                {jobDescription || "No job description provided."}
              </div>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </>
  );
}
