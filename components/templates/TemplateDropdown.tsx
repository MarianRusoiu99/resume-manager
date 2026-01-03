'use client';

import { useState, useEffect } from 'react';
import { toast } from 'sonner';
import { Check, ChevronDown } from 'lucide-react';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { Button } from '@/components/ui/button';
import { getTemplates } from '@/app/actions/template';
import { updateResumeMetadata } from '@/app/actions/resume';
import type { TemplateBase } from '@/lib/types/template';
import { useComponentLogger } from '@/hooks';

interface TemplateDropdownProps {
  currentTemplateId: string | null;
  resumeId: string;
  onTemplateChange: () => void;
}

export function TemplateDropdown({ 
  currentTemplateId, 
  resumeId, 
  onTemplateChange 
}: Readonly<TemplateDropdownProps>) {
  const log = useComponentLogger('TemplateDropdown');
  const [templates, setTemplates] = useState<TemplateBase[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [isUpdating, setIsUpdating] = useState(false);
  const [isOpen, setIsOpen] = useState(false);

  useEffect(() => {
    const fetchTemplates = async () => {
      try {
        setIsLoading(true);
        const result = await getTemplates();
        if (!result.success) {
          throw new Error(result.error ?? 'Failed to load templates');
        }

        setTemplates((result.data as unknown as TemplateBase[]) ?? []);
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

  const handleTemplateSelect = async (templateId: string) => {
    if (templateId === currentTemplateId) {
      setIsOpen(false);
      return;
    }

    try {
      setIsUpdating(true);
      const result = await updateResumeMetadata(resumeId, {
        templateId,
      });

      if (!result.success) {
        throw new Error(result.error ?? 'Failed to update template');
      }

      toast.success('Template updated successfully');
      setIsOpen(false);
      onTemplateChange();
    } catch (error) {
      log.error('Error updating template', error, { templateId });
      toast.error(error instanceof Error ? error.message : 'Failed to update template');
    } finally {
      setIsUpdating(false);
    }
  };

  const currentTemplate = templates.find(t => t.id === currentTemplateId);

  return (
    <DropdownMenu open={isOpen} onOpenChange={setIsOpen}>
      <DropdownMenuTrigger asChild>
        <Button 
          variant="secondary" 
          disabled={isUpdating}
          className="gap-2"
        >
          {isUpdating ? 'Updating...' : 'Change Template'}
          <ChevronDown className="h-4 w-4" />
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="w-[320px]">
        <DropdownMenuLabel>
          <div className="flex flex-col">
            <span>Select Template</span>
            {currentTemplate && (
              <span className="text-xs font-normal text-muted-foreground mt-1">
                Current: {currentTemplate.name}
              </span>
            )}
          </div>
        </DropdownMenuLabel>
        <DropdownMenuSeparator />
        
        {isLoading ? (
          <div className="flex items-center justify-center py-6">
            <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-primary"></div>
          </div>
        ) : (
          <div className="max-h-[400px] overflow-y-auto">
            {templates.map((template) => (
              <DropdownMenuItem
                key={template.id}
                onClick={() => handleTemplateSelect(template.id)}
                className="flex items-start gap-3 py-3 cursor-pointer"
                disabled={isUpdating}
              >
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2">
                    <span className="font-medium">{template.name}</span>
                    {template.id === currentTemplateId && (
                      <Check className="h-4 w-4 text-primary shrink-0" />
                    )}
                  </div>
                  {template.description && (
                    <p className="text-xs text-muted-foreground mt-1 line-clamp-2">
                      {template.description}
                    </p>
                  )}
                </div>
              </DropdownMenuItem>
            ))}
          </div>
        )}
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
