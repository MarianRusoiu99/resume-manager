'use client';

import { Save, Code, Maximize2, Minimize2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import {
  TabsList,
  TabsTrigger,
} from '@/components/ui/tabs';
import { AIEnhanceButton } from '@/modules/ai-enhance/components/AIEnhanceButton';

interface TemplateEditorToolbarProps {
  readonly htmlTemplate: string;
  readonly isFullscreen: boolean;
  readonly setIsFullscreen: (value: boolean) => void;
  readonly setTemplateEnhanceModalOpen: (value: boolean) => void;
  readonly handleSave: () => void;
  readonly saving: boolean;
}

export function TemplateEditorToolbar({
  htmlTemplate,
  isFullscreen,
  setIsFullscreen,
  setTemplateEnhanceModalOpen,
  handleSave,
  saving,
}: TemplateEditorToolbarProps) {
  return (
    <div className="flex items-center justify-end bg-muted/40 px-4 py-1.5 shrink-0">
      <TabsList className="bg-transparent gap-1 mr-auto">
        <TabsTrigger
          value="html"
          className="text-xs data-[state=active]:bg-background data-[state=active]:shadow-sm px-3 py-1 font-bold rounded-lg transition-all"
        >
          <Code className="mr-1.5 h-3.5 w-3.5" />
          HTML
        </TabsTrigger>
      </TabsList>
      <div className="flex items-center gap-1">
        <AIEnhanceButton
          onClick={() => setTemplateEnhanceModalOpen(true)}
          disabled={!htmlTemplate.trim()}
          variant="ghost"
          size="sm"
          className="h-8 w-auto px-2 rounded-lg hover:bg-primary/10 hover:text-primary transition-all"
        />
        <Button
          variant="ghost"
          size="sm"
          className="h-8 w-8 p-0 hover:bg-muted rounded-lg"
          onClick={() => setIsFullscreen(!isFullscreen)}
        >
          {isFullscreen ? <Minimize2 className="h-4 w-4" /> : <Maximize2 className="h-4 w-4" />}
        </Button>
        {isFullscreen && (
          <Button
            onClick={handleSave}
            disabled={saving}
            size="sm"
            className="h-8 px-4 ml-2 font-bold uppercase tracking-widest text-[10px] rounded-lg"
          >
            <Save className="mr-2 h-3.5 w-3.5" />
            {saving ? 'Saving...' : 'Save'}
          </Button>
        )}
      </div>
    </div>
  );
}
