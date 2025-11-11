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

interface PreviewTemplateSelectorProps {
  selectedTemplateId: string | null;
  onTemplateChange: (templateId: string | null) => void;
  variant?: 'default' | 'ghost' | 'outline' | 'secondary';
  size?: 'default' | 'sm' | 'lg' | 'icon';
}

export function PreviewTemplateSelector({ 
  selectedTemplateId, 
  onTemplateChange,
  variant = 'outline',
  size = 'sm'
}: PreviewTemplateSelectorProps) {
  const [templates, setTemplates] = useState<Template[]>([]);
  const [isLoading, setIsLoading] = useState(false);
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

  const selectedTemplate = templates.find(t => t.id === selectedTemplateId);

  return (
    <DropdownMenu open={isOpen} onOpenChange={setIsOpen}>
      <DropdownMenuTrigger asChild>
        <Button variant={variant} size={size}>
          {selectedTemplate ? selectedTemplate.name : 'Select Template'}
          <ChevronDown className="ml-2 h-4 w-4" />
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="w-[250px]">
        <DropdownMenuLabel>Change Template</DropdownMenuLabel>
        <DropdownMenuSeparator />
        
        {isLoading ? (
          <DropdownMenuItem disabled>
            Loading templates...
          </DropdownMenuItem>
        ) : templates.length === 0 ? (
          <DropdownMenuItem disabled>
            No templates available
          </DropdownMenuItem>
        ) : (
          <>
            <DropdownMenuItem
              onClick={() => {
                onTemplateChange(null);
                setIsOpen(false);
              }}
            >
              <div className="flex items-center justify-between w-full">
                <span>Default</span>
                {!selectedTemplateId && <Check className="h-4 w-4" />}
              </div>
            </DropdownMenuItem>
            
            {templates.map((template) => (
              <DropdownMenuItem
                key={template.id}
                onClick={() => {
                  onTemplateChange(template.id);
                  setIsOpen(false);
                  toast.success(`Template changed to ${template.name}`);
                }}
              >
                <div className="flex flex-col flex-1">
                  <div className="flex items-center justify-between w-full">
                    <span className="font-medium">{template.name}</span>
                    {selectedTemplateId === template.id && (
                      <Check className="h-4 w-4 ml-2" />
                    )}
                  </div>
                  {template.description && (
                    <span className="text-xs text-muted-foreground line-clamp-1">
                      {template.description}
                    </span>
                  )}
                </div>
              </DropdownMenuItem>
            ))}
          </>
        )}
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
