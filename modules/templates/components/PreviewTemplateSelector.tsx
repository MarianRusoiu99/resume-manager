'use client';

import { useState, useEffect, useMemo } from 'react';
import { ExternalServiceError } from "@/lib/errors";
import { toast } from 'sonner';
import { ChevronDown, Loader2 } from 'lucide-react';
import { Search, Info } from 'lucide-react';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { ScrollArea } from '@/components/ui/scroll-area';
import { TemplateThumbnail } from './TemplateThumbnail';
import type { ResumeTemplate } from '@/lib/templates/template';
import { useComponentLogger } from "@/hooks";
import { getTemplates } from '@/app/actions/template';
import { cn } from '@/lib/utils';
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";

interface PreviewTemplateSelectorProps {
  selectedTemplateId: string | null;
  onTemplateChange: (templateId: string | null) => void;
  variant?: 'default' | 'ghost' | 'outline' | 'secondary';
  size?: 'default' | 'sm' | 'lg' | 'icon';
  className?: string;
  children?: React.ReactNode;
}

export function PreviewTemplateSelector({
  selectedTemplateId,
  onTemplateChange,
  variant = 'outline',
  size = 'sm',
  className,
  children
}: Readonly<PreviewTemplateSelectorProps>) {
  const log = useComponentLogger('PreviewTemplateSelector');
  const [templates, setTemplates] = useState<ResumeTemplate[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [isOpen, setIsOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');

  useEffect(() => {
    const fetchTemplates = async () => {
      try {
        setIsLoading(true);
        // We'll cast to ResumeTemplate[] since the API returns full objects
        const result = await getTemplates();
        if (!result.success) {
          throw new ExternalServiceError('Template API', result.error);
        }

        setTemplates((result.data as unknown as ResumeTemplate[]) ?? []);
      } catch (error) {
        log.error('Error fetching templates', error);
        toast.error('Failed to load templates');
      } finally {
        setIsLoading(false);
      }
    };

    if (isOpen && templates.length === 0) {
      fetchTemplates();
    }
  }, [isOpen, templates.length, log]);

  const filteredTemplates = useMemo(() => {
    return templates.filter(t =>
      t.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      t.description?.toLowerCase().includes(searchQuery.toLowerCase())
    );
  }, [templates, searchQuery]);

  const handleTemplateSelect = (templateId: string | null) => {
    onTemplateChange(templateId);
    setIsOpen(false);
  };

  const selectedTemplate = templates.find(t => t.id === selectedTemplateId);

  return (
    <Dialog open={isOpen} onOpenChange={setIsOpen}>
      <DialogTrigger asChild>
        <Button variant={variant} size={size} className={cn("gap-2", className)}>
          {children || (
            <>
              <span className="truncate">
                {selectedTemplate ? selectedTemplate.name : 'Select Template'}
              </span>
              <ChevronDown className="h-3.5 w-3.5 shrink-0 opacity-50" />
            </>
          )}
        </Button>
      </DialogTrigger>
      <DialogContent className="max-w-3xl h-[80vh] flex flex-col p-0 overflow-hidden">
        <DialogHeader className="p-6 pb-0">
          <DialogTitle className="flex items-center justify-between">
            <span>Choose Template</span>
            <div className="relative w-64 mr-8">
              <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Search templates..."
                className="pl-9 h-9"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
              />
            </div>
          </DialogTitle>
        </DialogHeader>

        <div className="flex-1 overflow-hidden p-6 pt-4">
          {isLoading ? (
            <div className="flex h-full items-center justify-center">
              <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
            </div>
          ) : filteredTemplates.length === 0 ? (
            <div className="flex h-full flex-col items-center justify-center text-muted-foreground space-y-2">
              <Search className="h-10 w-10 opacity-20" />
              <p>No templates found matching &quot;{searchQuery}&quot;</p>
            </div>
          ) : (
            <ScrollArea className="h-full pr-4">
              <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-4 pb-4">
                {filteredTemplates.map((template: ResumeTemplate) => (
                  <div key={template.id} className="space-y-2">
                    <TemplateThumbnail
                      templateHtml={template.htmlTemplate}
                      name={template.name}
                      isSelected={template.id === selectedTemplateId}
                      onClick={() => handleTemplateSelect(template.id)}
                    />
                    <div className="flex items-center justify-between px-1">
                      <p className="text-xs font-semibold truncate leading-none">{template.name}</p>
                      {template.description && (
                        <TooltipProvider>
                          <Tooltip>
                            <TooltipTrigger asChild>
                              <Info className="h-3 w-3 text-muted-foreground cursor-help" />
                            </TooltipTrigger>
                            <TooltipContent side="top" className="max-w-xs">
                              <p className="text-xs">{template.description}</p>
                            </TooltipContent>
                          </Tooltip>
                        </TooltipProvider>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            </ScrollArea>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
}
