'use client';

import { useState, useMemo } from 'react';
import { FileText, Mail, Palette, X, Search, Loader2 } from 'lucide-react';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsList, TabsTrigger, TabsContent } from '@/components/ui/tabs';
import { ScrollArea } from '@/components/ui/scroll-area';
import { cn } from '@/lib/utils';

interface ArtifactSelectorModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  generationType: 'resume' | 'cover-letter' | 'template';
  artifactOptions: Array<{
    id: string;
    label: string;
    type: 'profile' | 'resume' | 'cover-letter' | 'template';
  }>;
  selectedArtifactRefs: string[];
  onSelectionChange: (ids: string[]) => void;
  isLoading: boolean;
}

const typeIcon = (type: string) => {
  if (type === 'cover-letter') return <Mail className="h-4 w-4 shrink-0" />;
  if (type === 'template') return <Palette className="h-4 w-4 shrink-0" />;
  return <FileText className="h-4 w-4 shrink-0" />;
};

const typeLabel = (type: string) => {
  if (type === 'cover-letter') return 'Cover Letter';
  if (type === 'template') return 'Template';
  if (type === 'profile') return 'Profile';
  return 'Resume';
};

const TAB_FILTERS: Record<string, string[]> = {
  all: ['profile', 'resume', 'cover-letter', 'template'],
  profiles: ['profile'],
  resumes: ['resume'],
  'cover-letters': ['cover-letter'],
  templates: ['template'],
};

export function ArtifactSelectorModal({
  open,
  onOpenChange,
  artifactOptions,
  selectedArtifactRefs,
  onSelectionChange,
  isLoading,
}: ArtifactSelectorModalProps) {
  const [search, setSearch] = useState('');
  const [activeTab, setActiveTab] = useState('all');

  const filtered = useMemo(() => {
    const types = TAB_FILTERS[activeTab] ?? TAB_FILTERS.all;
    return artifactOptions.filter(
      (a) =>
        types.includes(a.type) &&
        a.label.toLowerCase().includes(search.toLowerCase())
    );
  }, [artifactOptions, activeTab, search]);

  const toggle = (id: string) => {
    if (selectedArtifactRefs.includes(id)) {
      onSelectionChange(selectedArtifactRefs.filter((r) => r !== id));
    } else {
      onSelectionChange([...selectedArtifactRefs, id]);
    }
  };

  const clearAll = () => onSelectionChange([]);

  const selectedArtifacts = artifactOptions.filter((a) =>
    selectedArtifactRefs.includes(a.id)
  );

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="flex flex-col gap-0 p-0 sm:max-w-[560px] max-h-[80vh]">
        <DialogHeader className="px-6 pt-6 pb-4">
          <DialogTitle>Select References</DialogTitle>
          <DialogDescription>
            Choose existing artifacts to provide as context to the AI.
          </DialogDescription>
        </DialogHeader>

        <div className="px-6 pb-3">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Search artifacts..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="pl-9"
            />
          </div>
        </div>

        <Tabs value={activeTab} onValueChange={setActiveTab} className="flex flex-col flex-1 min-h-0">
          <TabsList className="mx-6 mb-2 w-auto justify-start h-auto flex-wrap gap-1 bg-transparent p-0">
            {['all', 'profiles', 'resumes', 'cover-letters', 'templates'].map((t) => (
              <TabsTrigger
                key={t}
                value={t}
                className="text-xs capitalize data-[state=active]:bg-primary data-[state=active]:text-primary-foreground rounded-full px-3 py-1 border"
              >
                {t === 'cover-letters' ? 'Cover Letters' : t.charAt(0).toUpperCase() + t.slice(1)}
              </TabsTrigger>
            ))}
          </TabsList>

          {['all', 'profiles', 'resumes', 'cover-letters', 'templates'].map((t) => (
            <TabsContent key={t} value={t} className="flex-1 min-h-0 mt-0">
              <ScrollArea className="h-[260px] px-6">
                {isLoading ? (
                  <div className="flex items-center justify-center h-20 gap-2 text-muted-foreground text-sm">
                    <Loader2 className="h-4 w-4 animate-spin" />
                    Loading...
                  </div>
                ) : filtered.length === 0 ? (
                  <div className="flex items-center justify-center h-20 text-muted-foreground text-sm">
                    No artifacts found.
                  </div>
                ) : (
                  <div className="space-y-1 py-1">
                    {filtered.map((artifact) => {
                      const selected = selectedArtifactRefs.includes(artifact.id);
                      return (
                        <button
                          key={artifact.id}
                          type="button"
                          onClick={() => toggle(artifact.id)}
                          className={cn(
                            'w-full flex items-center gap-3 px-3 py-2.5 rounded-md text-left transition-colors',
                            selected
                              ? 'bg-primary/10 border border-primary/30'
                              : 'hover:bg-muted border border-transparent'
                          )}
                        >
                          <span className={cn('text-muted-foreground', selected && 'text-primary')}>
                            {typeIcon(artifact.type)}
                          </span>
                          <span className="flex-1 text-sm truncate">{artifact.label}</span>
                          <Badge variant="secondary" className="text-[10px] shrink-0">
                            {typeLabel(artifact.type)}
                          </Badge>
                          {selected && (
                            <span className="h-2 w-2 rounded-full bg-primary shrink-0" />
                          )}
                        </button>
                      );
                    })}
                  </div>
                )}
              </ScrollArea>
            </TabsContent>
          ))}
        </Tabs>

        {selectedArtifacts.length > 0 && (
          <div className="px-6 py-3 border-t">
            <p className="text-xs text-muted-foreground mb-2">Selected ({selectedArtifacts.length})</p>
            <div className="flex flex-wrap gap-1.5">
              {selectedArtifacts.map((a) => (
                <span
                  key={a.id}
                  className="inline-flex items-center gap-1 text-xs bg-primary/10 text-primary border border-primary/20 rounded-full px-2.5 py-0.5"
                >
                  {a.label}
                  <button
                    type="button"
                    onClick={() => toggle(a.id)}
                    className="hover:text-destructive transition-colors"
                  >
                    <X className="h-3 w-3" />
                  </button>
                </span>
              ))}
            </div>
          </div>
        )}

        <DialogFooter className="px-6 py-4 border-t">
          <Button variant="ghost" size="sm" onClick={clearAll} disabled={selectedArtifacts.length === 0}>
            Clear All
          </Button>
          <Button size="sm" onClick={() => onOpenChange(false)}>
            Done
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
