'use client';

/**
 * Template Editor Component
 * Rich editor for creating/editing templates with HTML/Handlebars syntax highlighting
 * and live resume preview
 */

import { useState, useEffect } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import dynamic from 'next/dynamic';
import type { ResumeTemplate } from '@/lib/templates/template';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Save, Code, ImagePlus } from 'lucide-react';
import { toast } from 'sonner';
import { apiJson } from '@/lib/utils/api-client';
import { API_V1 } from '@/lib/constants';
import { sampleResume } from '@/lib/utils/sample-resume';
import { ResumePreview } from '../resume/ResumePreview';
import { TemplateImportModal } from './TemplateImportModal';
import { AIEnhanceButton, AIEnhanceTemplateModalUnified } from '@/components/ai-enhance';

// Dynamically import Monaco Editor (client-side only)
const Editor = dynamic(() => import('@monaco-editor/react'), {
  ssr: false,
  loading: () => (
    <div className="h-[500px] w-full flex items-center justify-center bg-muted rounded-lg">
      <div className="text-center">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-foreground mx-auto mb-2"></div>
        <p className="text-sm text-muted-foreground">Loading editor...</p>
      </div>
    </div>
  ),
});

interface TemplateEditorProps {
  readonly template?: ResumeTemplate;
  readonly isNew?: boolean;
}

const categories = [
  'PROFESSIONAL',
  'MODERN',
  'CREATIVE',
  'ATS-OPTIMIZED',
  'MINIMAL',
] as const;

export function TemplateEditor({ template, isNew = false }: Readonly<TemplateEditorProps>) {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [saving, setSaving] = useState(false);
  const [importModalOpen, setImportModalOpen] = useState(false);
  const [templateEnhanceModalOpen, setTemplateEnhanceModalOpen] = useState(false);
  const [formData, setFormData] = useState({
    name: template?.name || '',
    category: template?.category || 'PROFESSIONAL',
    description: template?.description || '',
    htmlTemplate: template?.htmlTemplate || '',
    cssStyles: template?.cssStyles || '',
    isPublic: template?.isPublic ?? true,
  });

  // Handle imported template data
  const handleImportComplete = (importedTemplate: {
    htmlTemplate: string;
    cssStyles: string;
    name?: string;
    category?: string;
    description?: string;
  }) => {
    setFormData((prev) => ({
      ...prev,
      htmlTemplate: importedTemplate.htmlTemplate,
      cssStyles: importedTemplate.cssStyles,
      name: importedTemplate.name || prev.name,
      category: (importedTemplate.category as typeof prev.category) || prev.category,
      description: importedTemplate.description || prev.description,
    }));
    setImportModalOpen(false);
  };

  // Auto-open import modal if ?import=true query param is present
  useEffect(() => {
    if (isNew && searchParams.get('import') === 'true') {
      setImportModalOpen(true);
    }
  }, [isNew, searchParams]);

  // Auto-save draft to localStorage
  useEffect(() => {
    if (!isNew) return;
    const draftKey = 'template-editor-draft';
    const draft = localStorage.getItem(draftKey);
    if (draft) {
      try {
        const parsed = JSON.parse(draft);
        setFormData(parsed);
      } catch {
        // Ignore invalid draft
      }
    }
  }, [isNew]);

  useEffect(() => {
    if (!isNew) return;
    const draftKey = 'template-editor-draft';
    localStorage.setItem(draftKey, JSON.stringify(formData));
  }, [formData, isNew]);

  const handleSave = async () => {
    try {
      setSaving(true);

      const url = isNew ? API_V1.TEMPLATE.LIST : API_V1.TEMPLATE.GET(template?.id ?? '');

      const method = isNew ? 'POST' : 'PATCH';

      const result = await apiJson(url, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(formData),
      });

      if (result.error) {
        throw new Error(result.error);
      }

      // Clear draft
      if (isNew) {
        localStorage.removeItem('template-editor-draft');
      }

      toast.success(isNew ? 'Template created successfully' : 'Template updated successfully');
      router.push('/templates');
      router.refresh();
    } catch (error) {
      toast.error(error instanceof Error ? error.message : 'Failed to save template');
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="flex flex-col">
      {/* Header */}
      <div className="border-b px-6 py-4">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-2xl font-bold">
              {isNew ? 'Create New Template' : 'Edit Template'}
            </h2>
            <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">
              Design a resume template using HTML and Handlebars syntax
            </p>
          </div>
          <div className="flex gap-2">
            <Button
              variant="outline"
              onClick={() => router.back()}
            >
              Cancel
            </Button>
            {isNew && (
              <Button
                variant="outline"
                onClick={() => setImportModalOpen(true)}
              >
                <ImagePlus className="mr-2 h-4 w-4" />
                Import from Image
              </Button>
            )}
            <Button onClick={handleSave} disabled={saving}>
              <Save className="mr-2 h-4 w-4" />
              {saving ? 'Saving...' : 'Save Template'}
            </Button>
          </div>
        </div>
      </div>

      {/* Main Content - Split Layout */}
      <div className="flex-1 overflow-hidden flex">
        {/* Left Panel - Form and Code Editor */}
        <div className="flex flex-col gap-6 overflow-y-auto p-6 w-1/2">
          {/* Template Metadata */}
          <div className="space-y-4 border rounded-lg p-4 bg-card">
            <h3 className="font-semibold text-lg">Template Information</h3>

            <div>
              <Label htmlFor="name">Template Name</Label>
              <Input
                id="name"
                value={formData.name}
                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                placeholder="Modern Professional"
              />
            </div>

            <div>
              <Label htmlFor="category">Category</Label>
              <Select
                value={formData.category}
                onValueChange={(value) => setFormData({ ...formData, category: value as typeof formData.category })}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {categories.map((cat) => (
                    <SelectItem key={cat} value={cat}>
                      {cat.charAt(0).toUpperCase() + cat.slice(1)}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div>
              <Label htmlFor="description">Description</Label>
              <Textarea
                id="description"
                value={formData.description}
                onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                placeholder="A modern, clean template optimized for tech roles..."
                rows={3}
              />
            </div>


            <div className="flex items-center gap-2">
              <input
                id="isPublic"
                type="checkbox"
                checked={formData.isPublic}
                onChange={(e) => setFormData({ ...formData, isPublic: e.target.checked })}
                className="rounded"
              />
              <Label htmlFor="isPublic">Make template public</Label>
            </div>
          </div>

          {/* Code Editors */}
          <Tabs defaultValue="html" className="flex-1">
            <div className="flex items-center justify-between">
              <TabsList className="grid grid-cols-2 w-auto">
                <TabsTrigger value="html">
                  <Code className="mr-2 h-4 w-4" />
                  HTML Template
                </TabsTrigger>
                <TabsTrigger value="css">
                  <Code className="mr-2 h-4 w-4" />
                  CSS Styles
                </TabsTrigger>
              </TabsList>
              <div className="flex gap-1">
                <AIEnhanceButton
                  onClick={() => setTemplateEnhanceModalOpen(true)}
                  disabled={!formData.htmlTemplate.trim() && !formData.cssStyles.trim()}
                  variant="outline"
                  size="sm"
                  className="h-8 w-auto px-3 rounded-md"
                />
              </div>
            </div>

            <TabsContent value="html" className="mt-4">
              <div className="border rounded-lg overflow-hidden h-[500px]">
                <Editor
                  height="100%"
                  defaultLanguage="html"
                  language="html"
                  theme="vs-dark"
                  value={formData.htmlTemplate}
                  onChange={(value) => setFormData({ ...formData, htmlTemplate: value || '' })}
                  options={{
                    minimap: { enabled: false },
                    fontSize: 13,
                    wordWrap: 'on',
                    automaticLayout: true,
                    lineNumbers: 'on',
                    scrollBeyondLastLine: false,
                    formatOnPaste: true,
                    formatOnType: true,
                    tabSize: 2,
                  }}
                />
              </div>
              <p className="text-xs text-muted-foreground mt-2">
                Use Handlebars syntax: <code className="bg-muted px-1 py-0.5 rounded">{'{{basics.name}}'}</code>, <code className="bg-muted px-1 py-0.5 rounded">{'{{#each work}}...{{/each}}'}</code>
              </p>
            </TabsContent>

            <TabsContent value="css" className="mt-4">
              <div className="border rounded-lg overflow-hidden h-[500px]">
                <Editor
                  height="100%"
                  defaultLanguage="css"
                  language="css"
                  theme="vs-dark"
                  value={formData.cssStyles}
                  onChange={(value) => setFormData({ ...formData, cssStyles: value || '' })}
                  options={{
                    minimap: { enabled: false },
                    fontSize: 13,
                    wordWrap: 'on',
                    automaticLayout: true,
                    lineNumbers: 'on',
                    scrollBeyondLastLine: false,
                    formatOnPaste: true,
                    formatOnType: true,
                    tabSize: 2,
                  }}
                />
              </div>
            </TabsContent>
          </Tabs>
        </div>

        {/* Right Panel - Live Preview */}
        <div className="border-l bg-muted/20 overflow-hidden w-1/2">
            <ResumePreview
              resumeData={sampleResume}
              templateHtml={formData.htmlTemplate}
              templateCss={formData.cssStyles}
              showTemplateSelector={false}
              showCard={false}
              className="h-full"
            />
        </div>
      </div>

      {/* Import Modal */}
      <TemplateImportModal
        open={importModalOpen}
        onOpenChange={setImportModalOpen}
        onImportComplete={handleImportComplete}
      />

      {/* AI Enhancement Modal */}
      <AIEnhanceTemplateModalUnified
        open={templateEnhanceModalOpen}
        onOpenChange={setTemplateEnhanceModalOpen}
        originalHtml={formData.htmlTemplate}
        originalCss={formData.cssStyles}
        onAccept={(enhancedHtml: string, enhancedCss: string) =>
          setFormData({ ...formData, htmlTemplate: enhancedHtml, cssStyles: enhancedCss })
        }
      />
    </div>
  );
}
