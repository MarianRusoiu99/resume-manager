'use client';

import { useMemo, useState } from 'react';
import { Search, Check, Link2 } from 'lucide-react';
import { BaseDialog } from '@/components/core/feedback/dialogs/BaseDialog';
import { Input } from '@/components/ui/input';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';

export interface ReferenceOption {
  value: string;
  label: string;
  group?: 'profiles' | 'templates' | 'artifacts';
}

interface ReferenceSelectionModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  values: string[];
  options: ReferenceOption[];
  onChange: (values: string[]) => void;
  noneLabel?: string;
  title?: string;
}

export function ReferenceSelectionModal({
  open,
  onOpenChange,
  values,
  options,
  onChange,
  noneLabel = 'No reference',
  title = 'Select reference',
}: Readonly<ReferenceSelectionModalProps>) {
  const [query, setQuery] = useState('');

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    if (!q) return options;
    return options.filter((option) => option.label.toLowerCase().includes(q));
  }, [options, query]);

  const grouped = useMemo(() => {
    const profiles = filtered.filter((option) => option.group === 'profiles');
    const templates = filtered.filter((option) => option.group === 'templates');
    const artifacts = filtered.filter((option) => !option.group || option.group === 'artifacts');
    return { profiles, templates, artifacts };
  }, [filtered]);

  const hasGroups = grouped.profiles.length > 0 || grouped.templates.length > 0;

  const clearAll = () => {
    onChange([]);
    onOpenChange(false);
    setQuery('');
  };

  const toggle = (next: string) => {
    const exists = values.includes(next);
    const updated = exists ? values.filter((v) => v !== next) : [...values, next];
    onChange(updated);
  };

  return (
    <BaseDialog
      open={open}
      onOpenChange={onOpenChange}
      variant="premium"
      size="lg"
      title={title}
      contentClassName="p-0 h-[520px]"
    >
      <div className="flex h-full min-h-0 flex-col">
        <div className="p-4 border-b border-border/40 bg-background/40">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              autoFocus
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="Search references..."
              className="pl-9 bg-background/50 h-10"
            />
          </div>
        </div>

        <ScrollArea className="flex-1 p-4">
          <div className="space-y-5">
            <button
              type="button"
              className={cn(
                'w-full flex items-center justify-between rounded-xl border px-3 py-2 text-left text-sm transition-colors',
                values.length === 0 ? 'border-primary bg-primary/5 text-primary' : 'border-border/50 hover:bg-accent/40'
              )}
              onClick={clearAll}
            >
              <span className="font-medium">{noneLabel}</span>
              {values.length === 0 && <Check className="h-4 w-4" />}
            </button>

            {hasGroups && grouped.profiles.length > 0 && (
              <div className="space-y-2">
                <div className="px-1 text-[10px] font-bold uppercase tracking-widest text-muted-foreground">Profiles</div>
                {grouped.profiles.map((option) => {
                  const selected = values.includes(option.value);
                  return (
                    <button
                      key={option.value}
                      type="button"
                      className={cn(
                        'w-full flex items-center justify-between rounded-xl border px-3 py-2 text-left text-sm transition-colors',
                        selected ? 'border-primary bg-primary/5 text-primary' : 'border-border/50 hover:bg-accent/40'
                      )}
                      onClick={() => toggle(option.value)}
                    >
                      <span>{option.label}</span>
                      {selected && <Check className="h-4 w-4" />}
                    </button>
                  );
                })}
              </div>
            )}

            {hasGroups && grouped.templates.length > 0 && (
              <div className="space-y-2">
                <div className="px-1 text-[10px] font-bold uppercase tracking-widest text-muted-foreground">Templates</div>
                {grouped.templates.map((option) => {
                  const selected = values.includes(option.value);
                  return (
                    <button
                      key={option.value}
                      type="button"
                      className={cn(
                        'w-full flex items-center justify-between rounded-xl border px-3 py-2 text-left text-sm transition-colors',
                        selected ? 'border-primary bg-primary/5 text-primary' : 'border-border/50 hover:bg-accent/40'
                      )}
                      onClick={() => toggle(option.value)}
                    >
                      <span>{option.label}</span>
                      {selected && <Check className="h-4 w-4" />}
                    </button>
                  );
                })}
              </div>
            )}

            {grouped.artifacts.length > 0 && (
              <div className="space-y-2">
                {hasGroups && <div className="px-1 text-[10px] font-bold uppercase tracking-widest text-muted-foreground">Artifacts</div>}
                {grouped.artifacts.map((option) => {
                  const selected = values.includes(option.value);
                  return (
                    <button
                      key={option.value}
                      type="button"
                      className={cn(
                        'w-full flex items-center justify-between rounded-xl border px-3 py-2 text-left text-sm transition-colors',
                        selected ? 'border-primary bg-primary/5 text-primary' : 'border-border/50 hover:bg-accent/40'
                      )}
                      onClick={() => toggle(option.value)}
                    >
                      <span>{option.label}</span>
                      {selected && <Check className="h-4 w-4" />}
                    </button>
                  );
                })}
              </div>
            )}

            {filtered.length === 0 && (
              <div className="py-12 text-center text-sm text-muted-foreground">
                <Link2 className="h-5 w-5 mx-auto mb-2 opacity-70" />
                No matching references.
              </div>
            )}
          </div>
        </ScrollArea>

        <div className="p-3 border-t border-border/40 flex justify-end">
          <Button type="button" variant="ghost" size="sm" onClick={() => onOpenChange(false)}>
            Done
          </Button>
        </div>
      </div>
    </BaseDialog>
  );
}
