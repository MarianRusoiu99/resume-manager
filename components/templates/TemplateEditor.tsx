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
  Tabs,
  TabsContent,
  TabsList,
  TabsTrigger,
} from '@/components/ui/tabs';
import { Save, Code, ImagePlus, Check, Maximize2, Minimize2, Settings2, Download, Loader2 } from 'lucide-react';
import { useExportPDF } from '@/components/preview/useExportPDF';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter
} from '@/components/ui/dialog';
import { toast } from 'sonner';
import { apiV1, type ProfileListItem, type ProfileDto } from '@/lib/client';
import { sampleResume } from '@/lib/templates/constants/sample-resume';
import type { Resume } from '@/lib/validations/jsonresume';
import { ResumePreview } from '../resume/ResumePreview';
import { TemplateImportModal } from './TemplateImportModal';
import { AIEnhanceButton, AIEnhanceTemplateModal } from '@/components/ai-enhance';
import { Page } from '@/components/layout/Page';

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

export function TemplateEditor({ template, isNew = false }: Readonly<TemplateEditorProps>) {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [saving, setSaving] = useState(false);
  const [importModalOpen, setImportModalOpen] = useState(false);
  const [templateEnhanceModalOpen, setTemplateEnhanceModalOpen] = useState(false);
  const [settingsModalOpen, setSettingsModalOpen] = useState(false);
  const [isFullscreen, setIsFullscreen] = useState(false);

  const { isExportingPDF, handleExportPDF } = useExportPDF();

  const [formData, setFormData] = useState({
    name: template?.name || '',
    description: template?.description || '',
    htmlTemplate: template?.htmlTemplate || '',
    isPublic: template?.isPublic ?? true,
  });

  // Profile selection for preview
  const [profiles, setProfiles] = useState<ProfileListItem[]>([]);
  const [selectedProfileId, setSelectedProfileId] = useState<string>('sample');
  const [previewResume, setPreviewResume] = useState<Resume>(sampleResume as Resume);
  const [isLoadingProfile, setIsLoadingProfile] = useState(false);

  useEffect(() => {
    const loadProfiles = async () => {
      const result = await apiV1.PROFILE.LIST.get<ProfileListItem[]>();
      if (!result.error && result.data) {
        setProfiles(result.data);
      }
    };
    loadProfiles();
  }, []);

  useEffect(() => {
    if (selectedProfileId === 'sample') {
      setPreviewResume(sampleResume as Resume);
      return;
    }

    const loadProfileData = async () => {
      setIsLoadingProfile(true);
      try {
        const result = await apiV1.PROFILE.GET(selectedProfileId).get<ProfileDto>();
        if (!result.error && result.data?.resume) {
          setPreviewResume(result.data.resume as Resume);
        }
      } catch (err) {
        toast.error('Failed to load profile for preview');
      } finally {
        setIsLoadingProfile(false);
      }
    };
    loadProfileData();
  }, [selectedProfileId]);

  // Handle imported template data
  const handleImportComplete = (importedTemplate: {
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
  };

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
        result = await apiV1.TEMPLATE.CREATE.post(payload);
      } else if (template?.id) {
        result = await apiV1.TEMPLATE.UPDATE(template.id).patch(payload);
      }

      if (result?.error) {
        toast.error(result.error);
      } else {
        toast.success(`Template ${isNew ? 'created' : 'updated'} successfully`);
        if (isNew) {
          localStorage.removeItem('template-editor-draft');
          router.push('/templates');
          router.refresh();
        }
      }
    } catch (err) {
      toast.error('An unexpected error occurred');
    } finally {
      setSaving(false);
    }
  };

  // Add mount state to ensure editor loads on client
  const [mounted, setMounted] = useState(false);
  useEffect(() => {
    setMounted(true);
  }, []);

  const handleEditorDidMount = (editor: any) => {
    // Force a layout refresh after a short delay to ensure container is ready
    setTimeout(() => {
      editor.layout();
    }, 0);
  };

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
            <div className="flex items-center justify-end bg-muted/40 px-4 py-1.5 shrink-0">
              <TabsList className="bg-transparent gap-1 mr-auto">
                <TabsTrigger value="html" className="text-xs data-[state=active]:bg-background data-[state=active]:shadow-sm px-3 py-1 font-bold rounded-lg transition-all">
                  <Code className="mr-1.5 h-3.5 w-3.5" />
                  HTML
                </TabsTrigger>
              </TabsList>
              <div className="flex items-center gap-1">
                <AIEnhanceButton
                  onClick={() => setTemplateEnhanceModalOpen(true)}
                  disabled={!formData.htmlTemplate.trim()}
                  variant="ghost"
                  size="sm"
                  className="h-8 w-auto px-2 rounded-xl hover:bg-primary/10 hover:text-primary transition-all"
                />
                <Button
                  variant="ghost"
                  size="sm"
                  className="h-8 w-8 p-0 hover:bg-muted rounded-xl"
                  onClick={() => setIsFullscreen(!isFullscreen)}
                >
                  {isFullscreen ? <Minimize2 className="h-4 w-4" /> : <Maximize2 className="h-4 w-4" />}
                </Button>
                {isFullscreen && (
                  <Button onClick={handleSave} disabled={saving} size="sm" className="h-8 px-4 ml-2 font-bold uppercase tracking-widest text-[10px] rounded-xl">
                    <Save className="mr-2 h-3.5 w-3.5" />
                    {saving ? 'Saving...' : 'Save'}
                  </Button>
                )}
              </div>
            </div>

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
          <div className="bg-card rounded-2xl overflow-hidden shadow-sm w-full md:w-1/2 flex flex-col min-h-0">
            <div className="flex-1 relative bg-muted/5 overflow-auto p-0 flex flex-col min-h-0">
              {isLoadingProfile && (
                <div className="absolute inset-0 z-50 bg-background/50 flex items-center justify-center pointer-events-none">
                  <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-primary"></div>
                </div>
              )}
              <ResumePreview
                resumeData={previewResume}
                templateHtml={formData.htmlTemplate}
                showTemplateSelector={false}
                showCard={false}
                disableScaling={false}
                className="h-full"
                headerTitle={
                  <div className="flex items-center gap-2">
                    <div className="w-2 h-2 rounded-full bg-green-500 animate-pulse" />
                    <span className="text-[10px] font-black uppercase tracking-[0.2em] text-muted-foreground">Live Preview</span>
                  </div>
                }
                headerActions={
                  <div className="flex items-center gap-2">
                    <div className="w-px h-4 bg-muted-foreground/10 mr-1" />
                    <span className="text-[9px] text-muted-foreground uppercase tracking-widest font-black opacity-50">Context</span>
                    <select
                      className="text-[11px] border-none bg-background/50 rounded-lg px-3 py-1 shadow-sm font-bold uppercase tracking-wider focus:ring-1 focus:ring-primary outline-none transition-all cursor-pointer hover:bg-background/80"
                      value={selectedProfileId}
                      onChange={(e) => setSelectedProfileId(e.target.value)}
                    >
                      <option value="sample">Sample Data</option>
                      {profiles.map(p => (
                        <option key={p.id} value={p.id}>{p.name}</option>
                      ))}
                    </select>
                  </div>
                }
              />
            </div>
          </div>
        )}
      </div>

      {/* Settings Modal */}
      <Dialog open={settingsModalOpen} onOpenChange={setSettingsModalOpen}>
        <DialogContent className="sm:max-w-[425px]">
          <DialogHeader>
            <DialogTitle>Template Settings</DialogTitle>
            <DialogDescription>
              Configure your template's basic information and visibility.
            </DialogDescription>
          </DialogHeader>
          <div className="grid gap-4 py-4">
            <div className="grid gap-2">
              <Label htmlFor="modal-name">Name</Label>
              <Input
                id="modal-name"
                value={formData.name}
                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                placeholder="Modern Professional"
              />
            </div>
            <div className="grid gap-2">
              <Label htmlFor="modal-description">Description</Label>
              <Textarea
                id="modal-description"
                value={formData.description}
                onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                placeholder="Describe your template..."
                rows={3}
              />
            </div>
            <div className="flex items-center gap-2">
              <div
                className="flex items-center justify-center w-5 h-5 border rounded cursor-pointer"
                style={{
                  backgroundColor: formData.isPublic ? 'var(--primary)' : 'transparent',
                  borderColor: formData.isPublic ? 'var(--primary)' : 'var(--input)'
                }}
                onClick={() => setFormData({ ...formData, isPublic: !formData.isPublic })}
              >
                {formData.isPublic && <Check className="w-3.5 h-3.5 text-primary-foreground" />}
              </div>
              <Label
                className="cursor-pointer select-none"
                onClick={() => setFormData({ ...formData, isPublic: !formData.isPublic })}
              >
                Make template public
              </Label>
            </div>
          </div>
          <DialogFooter>
            <Button onClick={() => setSettingsModalOpen(false)}>Done</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

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
}
