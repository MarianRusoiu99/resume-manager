'use client';

import { useState, useEffect } from 'react';
import { toast } from 'sonner';
import { Check, ChevronDown, Loader2 } from 'lucide-react';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import type { TemplateBase } from '@/lib/types/template';
import { useComponentLogger } from '@/hooks';
import { apiV1, type TemplateListResponseDto } from '@/lib/client';

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
}: Readonly<PreviewTemplateSelectorProps>) {
  const log = useComponentLogger('PreviewTemplateSelector');
  const [templates, setTemplates] = useState<TemplateBase[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [isOpen, setIsOpen] = useState(false);

  useEffect(() => {
    const fetchTemplates = async () => {
      try {
        setIsLoading(true);
        const result = await apiV1.TEMPLATE.LIST.get<TemplateListResponseDto<TemplateBase>>();
        if (result.error) {
          throw new Error(result.error);
        }

        setTemplates(result.data?.templates ?? []);
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

  const handleTemplateSelect = (templateId: string | null) => {
    onTemplateChange(templateId);
    setIsOpen(false);
  };

  const selectedTemplate = templates.find(t => t.id === selectedTemplateId);

  // Group templates by category
  const templatesByCategory = templates.reduce((acc, template) => {
    if (!acc[template.category]) {
      acc[template.category] = [];
    }
    acc[template.category].push(template);
    return acc;
  }, {} as Record<string, TemplateBase[]>);

  const categories = Object.keys(templatesByCategory).sort((a, b) => a.localeCompare(b));

  return (
    <DropdownMenu open={isOpen} onOpenChange={setIsOpen}>
      <DropdownMenuTrigger asChild>
        <Button variant={variant} size={size} className="gap-2">
          <span className="truncate">
            {selectedTemplate ? selectedTemplate.name : 'Select Template'}
          </span>
          <ChevronDown className="h-3.5 w-3.5 shrink-0 opacity-50" />
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="w-[360px]">
        <DropdownMenuLabel>
          <div className="space-y-1">
            <div className="font-semibold">Choose Template</div>
            {selectedTemplate && (
              <div className="text-xs font-normal text-muted-foreground">
                Currently using: {selectedTemplate.name}
              </div>
            )}
          </div>
        </DropdownMenuLabel>
        <DropdownMenuSeparator />
        
        {isLoading && (
          <div className="flex items-center justify-center py-6">
            <Loader2 className="h-5 w-5 animate-spin text-muted-foreground" />
          </div>
        )}
        
        {!isLoading && templates.length === 0 && (
          <div className="py-6 text-center text-sm text-muted-foreground">
            No templates available
          </div>
        )}
        
        {!isLoading && templates.length > 0 && (
          <div className="max-h-[400px] overflow-y-auto">{categories.map((category, categoryIndex) => (
              <div key={category}>
                {categoryIndex > 0 && <DropdownMenuSeparator className="my-1" />}
                <div className="px-2 py-1">
                  <Badge variant="secondary" className="text-[10px] font-medium uppercase">
                    {category}
                  </Badge>
                </div>
                {templatesByCategory[category].map((template) => {
                  const isSelected = template.id === selectedTemplateId;
                  
                  return (
                    <DropdownMenuItem
                      key={template.id}
                      onClick={() => handleTemplateSelect(template.id)}
                      className="flex items-start gap-2 py-2.5 px-2 cursor-pointer"
                    >
                      <div className="flex h-5 items-center shrink-0">
                        {isSelected ? (
                          <Check className="h-4 w-4 text-primary" />
                        ) : (
                          <div className="h-4 w-4" />
                        )}
                      </div>
                      <div className="flex-1 min-w-0 space-y-0.5">
                        <div className="font-medium text-sm leading-tight">
                          {template.name}
                        </div>
                        <p className="text-xs text-muted-foreground line-clamp-2 leading-relaxed">
                          {template.description}
                        </p>
                      </div>
                    </DropdownMenuItem>
                  );
                })}
              </div>
            ))}
          </div>
        )}
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
