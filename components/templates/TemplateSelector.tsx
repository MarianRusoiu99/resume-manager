'use client';

import { useState, useEffect } from 'react';
import { toast } from 'sonner';
import type { TemplateBase } from '@/lib/types/template';
import { createComponentLogger } from '@/lib/utils/client-logger';
import { apiV1 } from '@/lib/client';

const logger = createComponentLogger('TemplateSelector');

interface TemplateSelector {
  currentTemplateId: string | null;
  resumeId: string;
  onTemplateChange: () => void;
}

export function TemplateSelector({ currentTemplateId, resumeId, onTemplateChange }: TemplateSelector) {
  const [templates, setTemplates] = useState<TemplateBase[]>([]);
  const [selectedTemplateId, setSelectedTemplateId] = useState<string | null>(currentTemplateId);
  const [isLoading, setIsLoading] = useState(false);
  const [isUpdating, setIsUpdating] = useState(false);
  const [isOpen, setIsOpen] = useState(false);

  useEffect(() => {
    const fetchTemplates = async () => {
      try {
        setIsLoading(true);
        const result = await apiV1.TEMPLATE.LIST.get<{ templates?: TemplateBase[] }>();
        if (result.error) {
          throw new Error(result.error);
        }

        setTemplates(result.data?.templates ?? []);
      } catch (error) {
        logger.error('Error fetching templates', error);
        toast.error('Failed to load templates');
      } finally {
        setIsLoading(false);
      }
    };

    if (isOpen) {
      fetchTemplates();
    }
  }, [isOpen]);

  const handleUpdateTemplate = async () => {
    if (!selectedTemplateId || selectedTemplateId === currentTemplateId) {
      setIsOpen(false);
      return;
    }

    try {
      setIsUpdating(true);
      const result = await apiV1.RESUME.TEMPLATE(resumeId).patch<{ success?: boolean }>({ templateId: selectedTemplateId });

      if (result.error) {
        throw new Error(result.error);
      }

      toast.success('Template updated successfully');
      setIsOpen(false);
      logger.debug('Calling onTemplateChange callback');
      onTemplateChange();
    } catch (error) {
      logger.error('Error updating template', error);
      toast.error(error instanceof Error ? error.message : 'Failed to update template');
    } finally {
      setIsUpdating(false);
    }
  };

  const currentTemplate = templates.find(t => t.id === currentTemplateId);

  if (!isOpen) {
    return (
      <div className="border rounded-lg p-4">
        <div className="flex items-center justify-between">
          <div>
            <h3 className="font-medium text-sm ">Template</h3>
            <p className="text-lg font-semibold mt-1">
              {currentTemplate?.name || 'Default Template'}
            </p>
            {currentTemplate && (
              <div className="flex items-center gap-2 mt-1">
                <span className="text-xs px-2 py-0.5 rounded bg-blue-100 text-blue-700">
                  {currentTemplate.category}
                </span>
              </div>
            )}
          </div>
          <button
            onClick={() => setIsOpen(true)}
            className="px-4 py-2 text-sm font-medium text-blue-600 hover:text-blue-700 hover:bg-blue-50 rounded-lg transition-colors"
          >
            Change Template
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="border rounded-lg p-4">
      <h3 className="font-semibold text-lg mb-4">Select Template</h3>
      
      {isLoading ? (
        <div className="flex items-center justify-center py-8">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
        </div>
      ) : (
        <div className="space-y-3 max-h-96 overflow-y-auto">
          {templates.map((template) => (
            <button
              key={template.id}
              onClick={() => setSelectedTemplateId(template.id)}
              className={`w-full text-left p-3 rounded-lg border-2 transition-all ${
                selectedTemplateId === template.id
                  ? 'border-blue-600 bg-blue-50'
                  : 'border-gray-200 hover:border-gray-300'
              }`}
            >
              <div className="flex items-start justify-between">
                <div className="flex-1">
                  <h4 className="font-medium">{template.name}</h4>
                  <p className="text-sm text-gray-600 mt-1">{template.description}</p>
                  <div className="flex items-center gap-2 mt-2">
                    <span className="text-xs px-2 py-0.5 rounded bg-gray-100 ">
                      {template.category}
                    </span>
                  </div>
                </div>
                {selectedTemplateId === template.id && (
                  <svg
                    className="w-6 h-6 text-blue-600 shrink-0"
                    fill="currentColor"
                    viewBox="0 0 20 20"
                  >
                    <path
                      fillRule="evenodd"
                      d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z"
                      clipRule="evenodd"
                    />
                  </svg>
                )}
              </div>
            </button>
          ))}
        </div>
      )}

      <div className="flex items-center gap-2 mt-4 pt-4 border-t">
        <button
          onClick={() => {
            setIsOpen(false);
            setSelectedTemplateId(currentTemplateId);
          }}
          disabled={isUpdating}
          className="flex-1 px-4 py-2 text-sm font-medium  hover:bg-gray-50 border border-gray-300 rounded-lg transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
        >
          Cancel
        </button>
        <button
          onClick={handleUpdateTemplate}
          disabled={isUpdating || !selectedTemplateId || selectedTemplateId === currentTemplateId}
          className="flex-1 px-4 py-2 text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 rounded-lg transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
        >
          {isUpdating ? 'Updating...' : 'Update Template'}
        </button>
      </div>
    </div>
  );
}
