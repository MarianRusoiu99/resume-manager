'use client';

import { ResumePreview } from '@/modules/resume/components/ResumePreview';
import { type ProfileListItem } from '@/lib/actions/types';
import type { Resume } from '@/lib/validations/jsonresume';

interface TemplatePreviewFrameProps {
  readonly isLoadingProfile: boolean;
  readonly previewResume: Resume;
  readonly htmlTemplate: string;
  readonly selectedProfileId: string;
  readonly setSelectedProfileId: (id: string) => void;
  readonly profiles: ProfileListItem[];
}

export function TemplatePreviewFrame({
  isLoadingProfile,
  previewResume,
  htmlTemplate,
  selectedProfileId,
  setSelectedProfileId,
  profiles,
}: TemplatePreviewFrameProps) {
  return (
    <div className="bg-card rounded-2xl overflow-hidden shadow-sm w-full md:w-1/2 flex flex-col min-h-0">
      <div className="flex-1 relative bg-muted/5 overflow-auto p-0 flex flex-col min-h-0">
        {isLoadingProfile && (
          <div className="absolute inset-0 z-50 bg-background/50 flex items-center justify-center pointer-events-none">
            <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-primary"></div>
          </div>
        )}
        <ResumePreview
          resumeData={previewResume}
          templateHtml={htmlTemplate}
          showTemplateSelector={false}
          showCard={false}
          disableScaling={false}
          className="h-full"
          headerTitle={
            <div className="flex items-center gap-2">
              <div className="w-2 h-2 rounded-full bg-green-500 animate-pulse" />
              <span className="text-[10px] font-black uppercase tracking-[0.2em] text-muted-foreground">Live Preview</span>
            </div>
          }
          headerActions={
            <div className="flex items-center gap-2">
              <div className="w-px h-4 bg-muted-foreground/10 mr-1" />
              <select
                title="Select profile for preview"
                className="text-[11px] border-none bg-background/50 rounded-lg px-3 py-1 shadow-sm font-bold uppercase tracking-wider focus:ring-1 focus:ring-primary outline-none transition-all cursor-pointer hover:bg-background/80"
                value={selectedProfileId}
                onChange={(e) => setSelectedProfileId(e.target.value)}
              >
                <option value="sample">Sample Data</option>
                {profiles.map(p => (
                  <option key={p.id} value={p.id}>{p.name}</option>
                ))}
              </select>
            </div>
          }
        />
      </div>
    </div>
  );
}
