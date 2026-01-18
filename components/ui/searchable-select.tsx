'use client';

import * as React from 'react';
import { Check, ChevronsUpDown } from 'lucide-react';

import { cn } from '@/lib/utils';
import { Button } from '@/components/ui/button';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { ScrollArea } from '@/components/ui/scroll-area';

export type SearchableSelectOption = {
  value: string;
  label: string;
  description?: string;
};

export interface SearchableSelectProps {
  value: string | null | undefined;
  onValueChange: (nextValue: string) => void;
  options: SearchableSelectOption[];
  placeholder?: string;
  searchPlaceholder?: string;
  emptyText?: string;
  disabled?: boolean;
  className?: string;
  dialogTitle?: string;
  maxListHeightClassName?: string;
}

export function SearchableSelect({
  value,
  onValueChange,
  options,
  placeholder = 'Select...',
  searchPlaceholder = 'Search...',
  emptyText = 'No results found.',
  disabled,
  className,
  dialogTitle = 'Select an option',
  maxListHeightClassName = 'h-64',
}: Readonly<SearchableSelectProps>) {
  const [open, setOpen] = React.useState(false);
  const [query, setQuery] = React.useState('');

  const selected = options.find((o) => o.value === value) ?? null;

  const filtered = React.useMemo(() => {
    const q = query.trim().toLowerCase();
    if (!q) return options;

    return options.filter((o) => {
      const haystack = `${o.label} ${o.description ?? ''}`.toLowerCase();
      return haystack.includes(q);
    });
  }, [options, query]);

  const handleSelect = (nextValue: string) => {
    onValueChange(nextValue);
    setOpen(false);
    setQuery('');
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button
          type="button"
          variant="outline"
          role="combobox"
          aria-expanded={open}
          disabled={disabled}
          className={cn('w-full justify-between', className)}
        >
          <span className={cn('truncate text-left', !selected && 'text-muted-foreground')}>
            {selected ? selected.label : placeholder}
          </span>
          <ChevronsUpDown className="h-4 w-4 shrink-0 opacity-50" />
        </Button>
      </DialogTrigger>

      <DialogContent className="p-0">
        <DialogHeader className="px-6 pt-6">
          <DialogTitle>{dialogTitle}</DialogTitle>
        </DialogHeader>

        <div className="px-6 pb-2">
          <Input value={query} onChange={(e) => setQuery(e.target.value)} placeholder={searchPlaceholder} />
        </div>

        <div className="px-2 pb-6">
          <ScrollArea className={cn('w-full', maxListHeightClassName)}>
            <div className="space-y-1 px-4">
              {filtered.length === 0 && (
                <div className="py-6 text-center text-sm text-muted-foreground">{emptyText}</div>
              )}

              {filtered.map((o) => {
                const isSelected = o.value === value;

                return (
                  <button
                    key={o.value}
                    type="button"
                    className={cn(
                      'flex w-full items-start gap-2 rounded-md px-3 py-2 text-left text-sm hover:bg-accent hover:text-accent-foreground',
                      isSelected && 'bg-accent text-accent-foreground'
                    )}
                    onClick={() => handleSelect(o.value)}
                  >
                    <span className="mt-0.5 flex h-4 w-4 items-center justify-center">
                      {isSelected ? <Check className="h-4 w-4" /> : null}
                    </span>

                    <span className="min-w-0 flex-1">
                      <span className="block truncate font-medium">{o.label}</span>
                      {o.description ? (
                        <span className="block truncate text-xs text-muted-foreground">{o.description}</span>
                      ) : null}
                    </span>
                  </button>
                );
              })}
            </div>
          </ScrollArea>
        </div>
      </DialogContent>
    </Dialog>
  );
}
