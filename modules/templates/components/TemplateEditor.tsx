'use client';

/**
 * Template Editor Component
 * Rich editor for creating/editing templates with HTML/Handlebars syntax highlighting
 * and live resume preview
 */

import { useState, useEffect, useCallback, memo } from 'react';
import { useRouter } from 'next/navigation';
import dynamic from 'next/dynamic';
import type { ResumeTemplate } from '@/lib/templates/template';
import { Button } from '@/components/ui/button';
import {
  Tabs,
  TabsContent,
} from '@/components/ui/tabs';
import { Save, ImagePlus, Settings2 } from 'lucide-react';
import { toast } from 'sonner';
import {
  createTemplate,
  updateTemplate,
} from '@/app/actions/template';
import { TemplateImportModal } from './TemplateImportModal';
import { AIEnhanceTemplateModal } from '@/modules/ai-enhance/modals/AIEnhanceTemplateModal';
import { Page } from '@/components/layout/Page';
import { TemplateSettingsDialog } from './editor/TemplateSettingsDialog';
import { TemplatePreviewFrame } from './editor/TemplatePreviewFrame';
import { TemplateEditorToolbar } from './editor/TemplateEditorToolbar';
import { useTemplatePreviewLegacy as useTemplatePreview } from "@/hooks";
import { useTemplatePersistence } from './editor/hooks/useTemplatePersistence';

import type { OnMount } from '@monaco-editor/react';

// Dynamically import Monaco Editor (client-side only)
const Editor = dynamic(() => import('@monaco-editor/react'), {
  ssr: false,
  loading: () => (
    <div className="h-full w-full flex items-center justify-center bg-muted/20 rounded-lg">
      <div className="text-center">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-foreground mx-auto mb-2 opacity-20"></div>
        <p className="text-sm text-muted-foreground">Loading editor...</p>
      </div>
    </div>
  ),
});

const EDITOR_OPTIONS = {
  minimap: { enabled: false },
  fontSize: 14,
  wordWrap: 'on' as const,
  automaticLayout: true,
  lineNumbers: 'on' as const,
  scrollBeyondLastLine: false,
  formatOnPaste: true,
  formatOnType: true,
  tabSize: 2,
  padding: { top: 10 },
  fixedOverflowWidgets: true,
  glyphMargin: false,
  folding: true,
  lineDecorationsWidth: 0,
  lineNumbersMinChars: 3,
};

interface TemplateEditorProps {
  readonly template?: ResumeTemplate;
  readonly isNew?: boolean;
}

export const TemplateEditor = memo(function TemplateEditor({ template, isNew = false }: Readonly<TemplateEditorProps>) {
  const router = useRouter();
  const [saving, setSaving] = useState(false);
  const [importModalOpen, setImportModalOpen] = useState(false);
  const [templateEnhanceModalOpen, setTemplateEnhanceModalOpen] = useState(false);
  const [settingsModalOpen, setSettingsModalOpen] = useState(false);
  const [isFullscreen, setIsFullscreen] = useState(false);

  const {
    profiles,
    selectedProfileId,
    setSelectedProfileId,
    previewResume,
    isLoadingProfile,
  } = useTemplatePreview();

  const {
    formData,
    setFormData,
    clearDraft,
  } = useTemplatePersistence(isNew, {
    name: template?.name || '',
    description: template?.description || '',
    htmlTemplate: template?.htmlTemplate || '',
    isPublic: template?.isPublic ?? true,
  });

  // Handle imported template data
  const handleImportComplete = useCallback((importedTemplate: {
    htmlTemplate: string;
    name?: string;
    description?: string;
  }) => {
    setFormData((prev) => ({
      ...prev,
      htmlTemplate: importedTemplate.htmlTemplate,
      name: importedTemplate.name || prev.name,
      description: importedTemplate.description || prev.description,
    }));
    setImportModalOpen(false);
  }, [setFormData]);

  const handleSave = useCallback(async () => {
    setSaving(true);
    try {
      const payload = {
        name: formData.name || (isNew ? 'New Template' : 'Unnamed Template'),
        description: formData.description,
        htmlTemplate: formData.htmlTemplate,
        isPublic: formData.isPublic,
      };

      let result;
      if (isNew) {
        result = await createTemplate(payload);
      } else if (template?.id) {
        result = await updateTemplate(template.id, payload);
      }

      if (result && !result.success) {
        toast.error(result.error);
      } else {
        toast.success(`Template ${isNew ? 'created' : 'updated'} successfully`);
        if (isNew) {
          clearDraft();
          router.push('/templates');
          router.refresh();
        }
      }
    } catch {
      toast.error('An unexpected error occurred');
    } finally {
      setSaving(false);
    }
  }, [formData, isNew, template?.id, clearDraft, router]);

  // Add mount state to ensure editor loads on client
  const [mounted, setMounted] = useState(false);
  useEffect(() => {
    setMounted(true);
  }, []);

  const handleEditorDidMount: OnMount = useCallback((editor) => {
    // Force a layout refresh after a short delay to ensure container is ready
    setTimeout(() => {
      editor.layout();
    }, 0);
  }, []);

  return (
    <Page
      title={
        <div className="flex items-center gap-2">
          <span>{formData.name || (isNew ? 'New Template' : 'Unnamed Template')}</span>
          <Button
            variant="ghost"
            size="sm"
            className="h-7 w-7 p-0 shrink-0 hover:bg-muted"
            onClick={() => setSettingsModalOpen(true)}
          >
            <Settings2 className="h-4 w-4 text-muted-foreground" />
          </Button>
        </div>
      }
      description={formData.description || 'No description provided'}
      breadcrumbs={[
        { label: 'Templates', href: '/templates' },
        { label: isNew ? 'New' : formData.name || 'Edit' }
      ]}
      maxWidth="full"
      className="p-0"
      scrollable={false}
      actions={
        <div className="flex gap-2 shrink-0">
          {isNew && (
            <Button
              variant="secondary"
              size="sm"
              onClick={() => setImportModalOpen(true)}
              className="shrink-0 font-semibold"
            >
              <ImagePlus className="mr-2 h-4 w-4" />
              Import
            </Button>
          )}
          <Button
            variant="ghost"
            size="sm"
            onClick={() => router.back()}
            className="hover:bg-muted"
          >
            Cancel
          </Button>
          <Button size="sm" onClick={handleSave} disabled={saving} className="font-semibold shadow-sm">
            <Save className="mr-2 h-4 w-4" />
            {saving ? 'Saving...' : 'Save'}
          </Button>
        </div>
      }
    >
      <div className={`flex-1 min-h-0 flex flex-col md:flex-row bg-transparent gap-4 p-4 ${isFullscreen ? 'fixed inset-0 z-50 bg-background p-0' : ''}`}>
        {/* Left Panel - Code Editor */}
        <div className={`flex flex-col min-h-0 w-full md:w-1/2 bg-card rounded-2xl overflow-hidden shadow-sm ${isFullscreen ? 'md:w-full rounded-none' : ''}`}>
          {/* Code Editors */}
          <Tabs defaultValue="html" className="flex-1 flex flex-col min-h-0">
            <TemplateEditorToolbar
              htmlTemplate={formData.htmlTemplate}
              isFullscreen={isFullscreen}
              setIsFullscreen={setIsFullscreen}
              setTemplateEnhanceModalOpen={setTemplateEnhanceModalOpen}
              handleSave={handleSave}
              saving={saving}
            />

            <TabsContent value="html" className="flex-1 mt-0 relative min-h-0 overflow-hidden">
              {mounted && (
                <div className="absolute inset-0">
                  <Editor
                    height="100%"
                    defaultLanguage="html"
                    language="html"
                    theme="vs-dark"
                    value={formData.htmlTemplate}
                    onMount={handleEditorDidMount}
                    onChange={(value) => setFormData({ ...formData, htmlTemplate: value || '' })}
                    options={EDITOR_OPTIONS}
                  />
                </div>
              )}
            </TabsContent>
          </Tabs>
        </div>

        {/* Right Panel - Live Preview */}
        {!isFullscreen && (
          <TemplatePreviewFrame
            isLoadingProfile={isLoadingProfile}
            previewResume={previewResume}
            htmlTemplate={formData.htmlTemplate}
            selectedProfileId={selectedProfileId}
            setSelectedProfileId={setSelectedProfileId}
            profiles={profiles}
          />
        )}
      </div>

      {/* Settings Modal */}
      <TemplateSettingsDialog
        open={settingsModalOpen}
        onOpenChange={setSettingsModalOpen}
        formData={formData}
        setFormData={(data) => setFormData({ ...formData, ...data })}
      />

      {/* Import Modal */}
      <TemplateImportModal
        open={importModalOpen}
        onOpenChange={setImportModalOpen}
        onImportComplete={handleImportComplete}
      />

      {/* AI Enhancement Modal */}
      <AIEnhanceTemplateModal
        open={templateEnhanceModalOpen}
        onOpenChange={setTemplateEnhanceModalOpen}
        originalHtml={formData.htmlTemplate}
        onAccept={(enhancedHtml: string) =>
          setFormData({ ...formData, htmlTemplate: enhancedHtml })
        }
      />
    </Page>
  );
});
