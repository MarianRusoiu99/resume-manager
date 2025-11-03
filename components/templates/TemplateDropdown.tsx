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

interface Template {
  id: string;
  name: string;
  category: string;
  description: string;
}

interface TemplateDropdownProps {
  currentTemplateId: string | null;
  resumeId: string;
  onTemplateChange: () => void;
}

export function TemplateDropdown({ 
  currentTemplateId, 
  resumeId, 
  onTemplateChange 
}: TemplateDropdownProps) {
  const [templates, setTemplates] = useState<Template[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [isUpdating, setIsUpdating] = useState(false);
  const [isOpen, setIsOpen] = useState(false);

  useEffect(() => {
    const fetchTemplates = async () => {
      try {
        setIsLoading(true);
        const response = await fetch('/api/templates');
        if (!response.ok) {
          throw new Error('Failed to fetch templates');
        }
        const data = await response.json();
        setTemplates(data.templates || []);
      } catch (error) {
        console.error('Error fetching templates:', error);
        toast.error('Failed to load templates');
      } finally {
        setIsLoading(false);
      }
    };

    if (isOpen && templates.length === 0) {
      fetchTemplates();
    }
  }, [isOpen, templates.length]);

  const handleTemplateSelect = async (templateId: string) => {
    if (templateId === currentTemplateId) {
      setIsOpen(false);
      return;
    }

    try {
      setIsUpdating(true);
      const response = await fetch(`/api/resumes/${resumeId}/template`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          templateId: templateId,
        }),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Failed to update template');
      }

      toast.success('Template updated successfully');
      setIsOpen(false);
      onTemplateChange();
    } catch (error) {
      console.error('Error updating template:', error);
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
                  <p className="text-xs text-muted-foreground mt-1 line-clamp-2">
                    {template.description}
                  </p>
                  <div className="flex items-center gap-2 mt-1.5">
                    <span className="text-xs px-1.5 py-0.5 rounded bg-secondary text-secondary-foreground">
                      {template.category}
                    </span>
        
                  </div>
                </div>
              </DropdownMenuItem>
            ))}
          </div>
        )}
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
