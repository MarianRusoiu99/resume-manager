'use client';

import Link from 'next/link';
import { ExternalLink } from 'lucide-react';

interface CoverLetterSidebarProps {
  resumeId?: string | null;
  jobDescription?: string | null;
  metadata: {
    personalInstructions?: string;
    model?: string;
    tokens?: number;
  };
  createdAt: string | Date;
}

export function CoverLetterSidebar({
  resumeId,
  jobDescription,
  metadata,
  createdAt,
}: CoverLetterSidebarProps) {
  return (
    <div className="bg-background flex flex-col gap-px overflow-y-auto">
      {/* Linked Resume */}
      <div className="p-6 border-b">
        <span className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground block mb-4">
          Context & Links
        </span>
        {resumeId ? (
          <div className="space-y-4">
            <div className="flex items-center gap-3 p-3 bg-muted/30 border border-dashed rounded-none">
              <ExternalLink className="w-4 h-4 text-primary" />
              <div className="flex-1 min-w-0">
                <p className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">Linked Resume</p>
                <Link
                  href={`/resumes/${resumeId}`}
                  className="text-sm font-medium hover:text-primary transition-colors block truncate"
                >
                  View Source Resume →
                </Link>
              </div>
            </div>
          </div>
        ) : (
          <p className="text-xs text-muted-foreground italic">No linked resume found.</p>
        )}
      </div>

      {/* Job Description */}
      <div className="p-6 border-b flex-1">
        <span className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground block mb-4">
          Target Job Description
        </span>
        <div className="p-4 bg-muted/20 border text-sm text-muted-foreground leading-relaxed max-h-[300px] overflow-y-auto font-mono text-[11px]">
          {jobDescription || 'No job description available.'}
        </div>
      </div>

      {/* AI Metadata */}
      <div className="p-6">
        <span className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground block mb-4">
          AI Generation Details
        </span>
        <div className="space-y-4">
          {metadata.personalInstructions && (
            <div className="p-4 bg-primary/5 border-l-2 border-primary">
              <p className="text-xs italic text-muted-foreground leading-relaxed">
                &quot;{metadata.personalInstructions}&quot;
              </p>
            </div>
          )}

          <div className="space-y-2 pt-2">
            <div className="flex justify-between items-center text-[10px]">
              <span className="text-muted-foreground font-bold uppercase tracking-widest">Model</span>
              <span className="font-mono">{metadata.model || 'gpt-4o'}</span>
            </div>
            <div className="flex justify-between items-center text-[10px]">
              <span className="text-muted-foreground font-bold uppercase tracking-widest">Tokens</span>
              <span className="font-mono">{metadata.tokens || '-'}</span>
            </div>
            <div className="flex justify-between items-center text-[10px]">
              <span className="text-muted-foreground font-bold uppercase tracking-widest">Created</span>
              <span className="font-mono">{new Date(createdAt).toLocaleDateString()}</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
