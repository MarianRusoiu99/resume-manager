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
    <div className="space-y-6">
      {/* Linked Resume */}
      <div className="p-6 bg-card/60 backdrop-blur-sm rounded-2xl shadow-sm border-none">
        <span className="text-[10px] font-bold uppercase tracking-widest text-primary block mb-4">
          Context & Links
        </span>
        {resumeId ? (
          <div className="space-y-4">
            <div className="flex items-center gap-3 p-3 bg-primary/5 rounded-xl border border-primary/10 group hover:border-primary/30 transition-all">
              <ExternalLink className="w-4 h-4 text-primary" />
              <div className="flex-1 min-w-0">
                <p className="text-[9px] font-bold uppercase tracking-widest text-muted-foreground">Linked Resume</p>
                <Link
                  href={`/resumes/${resumeId}`}
                  className="text-xs font-bold uppercase tracking-tight hover:text-primary transition-colors block truncate"
                >
                  View Source Resume →
                </Link>
              </div>
            </div>
          </div>
        ) : (
          <p className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground italic">No linked resume found.</p>
        )}
      </div>

      {/* Job Description */}
      <div className="p-6 bg-card/60 backdrop-blur-sm rounded-2xl shadow-sm border-none flex flex-col">
        <span className="text-[10px] font-bold uppercase tracking-widest text-primary block mb-4">
          Target Job Description
        </span>
        <div className="p-4 bg-muted/20 rounded-xl text-xs text-muted-foreground leading-relaxed max-h-[300px] overflow-y-auto font-mono scrollbar-hide">
          {jobDescription || 'No job description available.'}
        </div>
      </div>

      {/* AI Metadata */}
      <div className="p-6 bg-card/60 backdrop-blur-sm rounded-2xl shadow-sm border-none">
        <span className="text-[10px] font-bold uppercase tracking-widest text-primary block mb-4">
          AI Generation Details
        </span>
        <div className="space-y-4">
          {metadata.personalInstructions && (
            <div className="p-4 bg-primary/5 border-l-2 border-primary rounded-r-xl">
              <p className="text-[10px] italic font-bold text-muted-foreground leading-relaxed">
                &quot;{metadata.personalInstructions}&quot;
              </p>
            </div>
          )}

          <div className="space-y-3 pt-2">
            <div className="flex justify-between items-center text-[10px]">
              <span className="text-muted-foreground font-bold uppercase tracking-widest">Model</span>
              <span className="font-mono bg-muted px-2 py-0.5 rounded-md text-primary font-bold">{metadata.model || 'gpt-4o'}</span>
            </div>
            <div className="flex justify-between items-center text-[10px]">
              <span className="text-muted-foreground font-bold uppercase tracking-widest">Tokens</span>
              <span className="font-mono bg-muted px-2 py-0.5 rounded-md font-bold">{metadata.tokens || '-'}</span>
            </div>
            <div className="flex justify-between items-center text-[10px]">
              <span className="text-muted-foreground font-bold uppercase tracking-widest">Created</span>
              <span className="font-mono bg-muted px-2 py-0.5 rounded-md font-bold">{new Date(createdAt).toLocaleDateString()}</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
