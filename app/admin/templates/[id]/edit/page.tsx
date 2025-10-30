'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { toast } from 'sonner';
import { Button, Card, Input, Textarea } from '@/components/ui';
import { TemplateLivePreview } from '@/components/templates/TemplateLivePreview';
import type { TemplateDefinition } from '@/types/template';

interface TemplateFormData {
  name: string;
  category: string;
  description: string;
  isPublic: boolean;
  version: string;
  atsScore: number;
  definition: TemplateDefinition;
}

interface EditTemplatePageProps {
  params: Promise<{ id: string }>;
}

export default function EditTemplatePage({ params }: EditTemplatePageProps) {
  const router = useRouter();
  const [templateId, setTemplateId] = useState<string | null>(null);
  const [template, setTemplate] = useState<TemplateFormData | null>(null);
  const [jsonInput, setJsonInput] = useState('');
  const [jsonError, setJsonError] = useState<string | null>(null);
  const [isSaving, setIsSaving] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [previewMode, setPreviewMode] = useState<'json' | 'visual'>('json');

  useEffect(() => {
    const loadTemplate = async () => {
      try {
        const resolvedParams = await params;
        setTemplateId(resolvedParams.id);
        
        const response = await fetch(`/api/admin/templates/${resolvedParams.id}`);
        if (!response.ok) {
          throw new Error('Failed to load template');
        }
        
        const data = await response.json();
        const loadedTemplate: TemplateFormData = {
          name: data.template.name,
          category: data.template.category,
          description: data.template.description || '',
          isPublic: data.template.isPublic,
          version: data.template.version,
          atsScore: data.template.atsScore,
          definition: data.template.definition,
        };
        
        setTemplate(loadedTemplate);
        setJsonInput(JSON.stringify(data.template.definition, null, 2));
      } catch (error) {
        toast.error(error instanceof Error ? error.message : 'Failed to load template');
        router.push('/templates');
      } finally {
        setIsLoading(false);
      }
    };
    
    loadTemplate();
  }, [params, router]);

  const handleJsonChange = (value: string) => {
    setJsonInput(value);
    try {
      const parsed = JSON.parse(value);
      if (template) {
        setTemplate({ ...template, definition: parsed });
      }
      setJsonError(null);
    } catch (error) {
      setJsonError(error instanceof Error ? error.message : 'Invalid JSON');
    }
  };

  const handleMetadataChange = (field: keyof TemplateFormData, value: string | boolean | number) => {
    if (template) {
      setTemplate({ ...template, [field]: value });
    }
  };

  const validateTemplate = (): string[] => {
    const errors: string[] = [];
    
    if (!template) {
      errors.push('Template data not loaded');
      return errors;
    }
    
    if (!template.name || template.name.trim().length === 0) {
      errors.push('Template name is required');
    }
    
    if (!template.category) {
      errors.push('Template category is required');
    }
    
    if (!template.definition) {
      errors.push('Template definition is required');
    } else {
      // Validate required fields in definition
      if (!template.definition.colors) {
        errors.push('Colors configuration is required');
      }
      if (!template.definition.typography) {
        errors.push('Typography configuration is required');
      }
      if (!template.definition.sections) {
        errors.push('Sections configuration is required');
      }
    }
    
    if (jsonError) {
      errors.push(`JSON Error: ${jsonError}`);
    }
    
    return errors;
  };

  const handleSave = async () => {
    const errors = validateTemplate();
    
    if (errors.length > 0) {
      toast.error(`Validation failed:\n${errors.join('\n')}`);
      return;
    }
    
    if (!templateId) {
      toast.error('Template ID is missing');
      return;
    }
    
    try {
      setIsSaving(true);
      
      const response = await fetch(`/api/admin/templates/${templateId}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(template),
      });
      
      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || 'Failed to update template');
      }
      
      toast.success('Template updated successfully!');
      
      // Redirect to templates gallery
      router.push('/templates');
    } catch (error) {
      toast.error(error instanceof Error ? error.message : 'Failed to update template');
    } finally {
      setIsSaving(false);
    }
  };

  const handleDelete = async () => {
    if (!templateId) return;
    
    if (!confirm('Are you sure you want to delete this template? This action cannot be undone.')) {
      return;
    }
    
    try {
      const response = await fetch(`/api/admin/templates/${templateId}`, {
        method: 'DELETE',
      });
      
      if (!response.ok) {
        throw new Error('Failed to delete template');
      }
      
      toast.success('Template deleted successfully');
      router.push('/templates');
    } catch (error) {
      toast.error(error instanceof Error ? error.message : 'Failed to delete template');
    }
  };

  if (isLoading) {
    return (
      <div className="container mx-auto px-4 py-8 max-w-7xl">
        <div className="flex items-center justify-center min-h-[400px]">
          <div className="text-center">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
            <p className="text-gray-600">Loading template...</p>
          </div>
        </div>
      </div>
    );
  }

  if (!template) {
    return null;
  }

  return (
    <div className="container mx-auto px-4 py-8 max-w-7xl">
      <div className="mb-8">
        <Button
          variant="ghost"
          onClick={() => router.push('/templates')}
          className="mb-4"
        >
          ← Back to Templates
        </Button>
        
        <div className="flex justify-between items-start">
          <div>
            <h1 className="text-3xl font-bold mb-2">Edit Template</h1>
            <p className="text-gray-600">
              Update template configuration and settings
            </p>
          </div>
          <Button
            variant="danger"
            onClick={handleDelete}
          >
            Delete Template
          </Button>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Left Column: Template Configuration */}
        <div className="space-y-6">
          {/* Metadata Section */}
          <Card className="p-6">
            <h2 className="text-xl font-semibold mb-4">Template Metadata</h2>
            
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Template Name *
                </label>
                <Input
                  value={template.name || ''}
                  onChange={(e) => handleMetadataChange('name', e.target.value)}
                  placeholder="Professional Resume"
                />
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Category *
                </label>
                <select
                  value={template.category || 'professional'}
                  onChange={(e) => handleMetadataChange('category', e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                >
                  <option value="professional">Professional</option>
                  <option value="modern">Modern</option>
                  <option value="creative">Creative</option>
                  <option value="minimal">Minimal</option>
                  <option value="ats-optimized">ATS-Optimized</option>
                </select>
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Description
                </label>
                <Textarea
                  value={template.description || ''}
                  onChange={(e) => handleMetadataChange('description', e.target.value)}
                  placeholder="A clean, professional template suitable for corporate roles"
                  rows={3}
                />
              </div>
              
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Version
                  </label>
                  <Input
                    value={template.version}
                    onChange={(e) => handleMetadataChange('version', e.target.value)}
                    placeholder="1.0.0"
                  />
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    ATS Score (1-10)
                  </label>
                  <Input
                    type="number"
                    min="1"
                    max="10"
                    value={template.atsScore}
                    onChange={(e) => handleMetadataChange('atsScore', parseInt(e.target.value) || 8)}
                  />
                </div>
              </div>
              
              <div>
                <label className="flex items-center gap-2">
                  <input
                    type="checkbox"
                    checked={template.isPublic}
                    onChange={(e) => handleMetadataChange('isPublic', e.target.checked)}
                    className="w-4 h-4 text-blue-600 rounded"
                  />
                  <span className="text-sm font-medium text-gray-700">Public Template</span>
                </label>
                <p className="text-xs text-gray-500 mt-1">
                  Public templates are visible to all users in the gallery
                </p>
              </div>
            </div>
          </Card>

          {/* JSON Editor Section */}
          <Card className="p-6">
            <div className="flex justify-between items-center mb-4">
              <h2 className="text-xl font-semibold">Template Definition (JSON)</h2>
              <Button
                variant="ghost"
                size="sm"
                onClick={() => setJsonInput(JSON.stringify(template.definition, null, 2))}
              >
                Format
              </Button>
            </div>
            
            {jsonError && (
              <div className="mb-4 p-3 bg-red-50 border border-red-200 rounded-lg">
                <p className="text-sm text-red-800">{jsonError}</p>
              </div>
            )}
            
            <Textarea
              value={jsonInput}
              onChange={(e) => handleJsonChange(e.target.value)}
              rows={20}
              className="font-mono text-sm"
              placeholder="Enter JSON template definition..."
            />
            
            <p className="mt-2 text-xs text-gray-500">
              Must include: colors, typography, layout, and sections configuration
            </p>
          </Card>
        </div>

        {/* Right Column: Live Preview */}
        <div className="space-y-6">
          <Card className="p-6">
            <div className="flex justify-between items-center mb-4">
              <h2 className="text-xl font-semibold">Live Preview</h2>
              <div className="flex gap-2">
                <Button
                  variant={previewMode === 'json' ? 'primary' : 'ghost'}
                  size="sm"
                  onClick={() => setPreviewMode('json')}
                >
                  JSON
                </Button>
                <Button
                  variant={previewMode === 'visual' ? 'primary' : 'ghost'}
                  size="sm"
                  onClick={() => setPreviewMode('visual')}
                >
                  Visual
                </Button>
              </div>
            </div>
            
            {previewMode === 'json' ? (
              <div className="bg-gray-50 rounded-lg p-4 overflow-auto max-h-[600px]">
                <pre className="text-xs font-mono">
                  {JSON.stringify(template, null, 2)}
                </pre>
              </div>
            ) : (
              <div className="border border-gray-200 rounded-lg overflow-auto max-h-[600px]">
                {template.definition && !jsonError ? (
                  <TemplateLivePreview
                    template={{
                      id: templateId || 'preview',
                      name: template.name,
                      category: template.category as 'professional' | 'modern' | 'creative' | 'ats-optimized' | 'minimal',
                      description: template.description,
                      definition: template.definition,
                      version: template.version,
                      atsScore: template.atsScore,
                      isPublic: template.isPublic,
                      previewUrl: undefined,
                      createdAt: new Date(),
                      updatedAt: new Date(),
                    }}
                  />
                ) : (
                  <div className="p-8 text-center text-gray-500">
                    <p>Fix JSON errors to see live preview</p>
                  </div>
                )}
              </div>
            )}
          </Card>
          
          {/* ATS Compatibility Warning */}
          <Card className="p-4 bg-yellow-50 border-yellow-200">
            <h3 className="text-sm font-semibold text-yellow-900 mb-2">
              ⚠️ ATS Compatibility Guidelines
            </h3>
            <ul className="text-xs text-yellow-800 space-y-1">
              <li>• Use standard fonts (Helvetica, Arial, Times-Roman)</li>
              <li>• Avoid text sizes below 10pt</li>
              <li>• Maintain sufficient margin (40-60pt recommended)</li>
              <li>• Use simple bullet styles (disc, square)</li>
              <li>• Avoid complex layouts or tables</li>
            </ul>
          </Card>
        </div>
      </div>

      {/* Action Buttons */}
      <div className="mt-8 flex justify-end gap-4">
        <Button
          variant="secondary"
          onClick={() => router.push('/templates')}
        >
          Cancel
        </Button>
        <Button
          onClick={handleSave}
          disabled={isSaving || !!jsonError}
        >
          {isSaving ? 'Saving...' : 'Save Changes'}
        </Button>
      </div>
    </div>
  );
}
