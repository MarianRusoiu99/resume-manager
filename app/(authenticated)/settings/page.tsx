'use client';

import { useState, useEffect } from 'react';
import { Page } from '@/components/layout/Page';
import {
  Card,
  Button,
  Input,
  Select,
  SelectTrigger,
  SelectValue,
  SelectContent,
  SelectItem,
  Badge,
  Tabs,
  TabsContent,
  TabsList,
  TabsTrigger,
  Alert,
  AlertDescription,
  AlertTitle,
} from '@/components/ui';
import {
  Key,
  Plus,
  Trash2,
  ExternalLink,
  Eye,
  EyeOff,
  AlertCircle,
  Loader2,
  Lock,
  Cpu,
  Save,
  RotateCcw,
  Sparkles,
  FileText,
  Mail,
  Search,
  UserCircle,
  AlertTriangle,
} from 'lucide-react';
import { useSettings } from '@/lib/contexts/SettingsContext';
import { apiV1 } from '@/lib/client';
import { toast } from 'sonner';
import { useRouter } from 'next/navigation';
import { deleteAccountAction } from '@/app/actions/auth';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Label } from '@/components/ui/label';

const PROVIDERS = [
  { id: 'openai', name: 'OpenAI', url: 'https://platform.openai.com/api-keys' },
  { id: 'anthropic', name: 'Anthropic', url: 'https://console.anthropic.com/settings/keys' },
  { id: 'google', name: 'Google (Gemini)', url: 'https://aistudio.google.com/app/apikey' },
];

const FEATURES = [
  { id: 'resume_optimize', name: 'Resume Optimization', icon: Sparkles, description: 'Enhancing existing bullet points and summaries' },
  { id: 'resume_generate', name: 'Resume Generation', icon: FileText, description: 'Generating content from scratch/import' },
  { id: 'cover_letter_generate', name: 'Cover Letter Generation', icon: Mail, description: 'Generating personalized cover letters' },
  { id: 'job_scan', name: 'Job Matching (Scan)', icon: Search, description: 'Analyzing resume against job description' },
];

export default function SettingsPage() {
  const router = useRouter();
  const { providers, refreshProviders, aiSettings, refreshAISettings } = useSettings();

  // API Keys state
  const [loadingKeys, setLoadingKeys] = useState(false);
  const [showKey, setShowKey] = useState<Record<string, boolean>>({});
  const [newProvider, setNewProvider] = useState('openai');
  const [newApiKey, setNewApiKey] = useState('');

  // AI Models state
  const [savingModels, setSavingModels] = useState(false);
  const [preferences, setPreferences] = useState<Record<string, string>>({});

  // Account state
  const [showDeleteDialog, setShowDeleteDialog] = useState(false);
  const [isDeletingAccount, setIsDeletingAccount] = useState(false);
  const [confirmDeleteText, setConfirmDeleteText] = useState('');

  useEffect(() => {
    if (aiSettings?.features) {
      const prefs: Record<string, string> = {};
      aiSettings.features.forEach(f => {
        if (f.modelId) {
          prefs[f.feature.id] = f.modelId;
        }
      });
      setPreferences(prefs);
    }
  }, [aiSettings]);

  const toggleShowKey = (id: string) => {
    setShowKey(prev => ({ ...prev, [id]: !prev[id] }));
  };

  const handleAddKey = async () => {
    if (!newApiKey.trim()) return;
    setLoadingKeys(true);
    try {
      const result = await apiV1.SETTINGS.API_PROVIDERS.post({
        provider: newProvider,
        apiKey: newApiKey.trim(),
      });
      if (!result.error) {
        toast.success(`${PROVIDERS.find(p => p.id === newProvider)?.name} key added`);
        setNewApiKey('');
        await refreshProviders();
      } else {
        toast.error(result.error);
      }
    } catch (error) {
      toast.error('An error occurred');
    } finally {
      setLoadingKeys(false);
    }
  };

  const handleDeleteKey = async (id: string, name: string) => {
    if (!confirm(`Remove ${name} key?`)) return;
    setLoadingKeys(true);
    try {
      const result = await apiV1.SETTINGS.API_PROVIDERS.query({ id }).delete();
      if (!result.error) {
        toast.success(`${name} key removed`);
        await refreshProviders();
      } else {
        toast.error(result.error);
      }
    } catch (error) {
      toast.error('An error occurred');
    } finally {
      setLoadingKeys(false);
    }
  };

  const handlePreferenceChange = (featureId: string, modelId: string) => {
    setPreferences(prev => ({ ...prev, [featureId]: modelId }));
  };

  const handleSaveModels = async () => {
    setSavingModels(true);
    try {
      const payload = Object.entries(preferences).map(([featureId, modelId]) => ({
        featureId,
        modelId,
      }));
      const result = await apiV1.SETTINGS.AI_MODELS.post(payload);
      if (!result.error) {
        toast.success('AI Model preferences saved');
        await refreshAISettings();
      } else {
        toast.error(result.error);
      }
    } catch (error) {
      toast.error('An error occurred');
    } finally {
      setSavingModels(false);
    }
  };

  const handleClearModels = async () => {
    if (!confirm('Clear all model preferences?')) return;
    setSavingModels(true);
    try {
      const result = await apiV1.SETTINGS.AI_MODELS.delete();
      if (!result.error) {
        toast.success('Preferences cleared');
        setPreferences({});
        await refreshAISettings();
      } else {
        toast.error(result.error);
      }
    } catch (error) {
      toast.error('An error occurred');
    } finally {
      setSavingModels(false);
    }
  };

  const handleDeleteAccount = async () => {
    try {
      setIsDeletingAccount(true);
      const result = await deleteAccountAction();
      if (result?.success) {
        toast.success('Account deleted');
        router.push('/login');
      } else {
        toast.error(result?.message || 'Failed to delete account');
      }
    } catch (error) {
      toast.error('An error occurred');
    } finally {
      setIsDeletingAccount(false);
      setShowDeleteDialog(false);
    }
  };

  const currentPrefs = (aiSettings?.features || []).reduce((acc: any, f) => ({ ...acc, [f.feature.id]: f.modelId }), {});
  const hasModelChanges = JSON.stringify(preferences) !== JSON.stringify(currentPrefs);

  return (
    <Page
      title="Settings"
      description="Manage your AI configurations and account preferences"
      breadcrumbs={[{ label: 'Settings' }]}
    >
      <Tabs defaultValue="ai" className="space-y-8">
        <TabsList className="bg-muted/40 p-1.5 rounded-2xl h-auto self-start">
          <TabsTrigger value="ai" className="rounded-xl px-6 py-2.5 data-[state=active]:bg-background data-[state=active]:shadow-sm font-bold uppercase tracking-widest text-[10px]">
            <Cpu className="h-4 w-4 mr-2" />
            AI Settings
          </TabsTrigger>
          <TabsTrigger value="account" className="rounded-xl px-6 py-2.5 data-[state=active]:bg-background data-[state=active]:shadow-sm font-bold uppercase tracking-widest text-[10px]">
            <UserCircle className="h-4 w-4 mr-2" />
            Account
          </TabsTrigger>
        </TabsList>

        <TabsContent value="ai" className="space-y-8 mt-0 focus-visible:ring-0">
          <section className="space-y-6">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-primary/10 rounded-xl">
                <Key className="h-5 w-5 text-primary" />
              </div>
              <h2 className="font-black text-[11px] uppercase tracking-[0.2em] text-primary">API Providers</h2>
            </div>

            <Card className="p-8 rounded-[2rem] border-none shadow-none bg-card/40 backdrop-blur-sm">
              <div className="grid grid-cols-1 md:grid-cols-4 gap-6 items-end">
                <div className="md:col-span-1 space-y-2.5">
                  <label className="text-[10px] font-black uppercase tracking-[0.15em] text-muted-foreground ml-1">Provider</label>
                  <Select value={newProvider} onValueChange={setNewProvider}>
                    <SelectTrigger className="rounded-2xl bg-background/50 border-none h-12 transition-all shadow-sm">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent className="rounded-2xl border-none shadow-2xl">
                      {PROVIDERS.map(p => (
                        <SelectItem key={p.id} value={p.id} className="rounded-xl">{p.name}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                <div className="md:col-span-2 space-y-2.5">
                  <label className="text-[10px] font-black uppercase tracking-[0.15em] text-muted-foreground ml-1">API Key</label>
                  <div className="relative">
                    <Input
                      type="password"
                      placeholder="Paste security key"
                      value={newApiKey}
                      onChange={(e) => setNewApiKey(e.target.value)}
                      className="pr-12 rounded-2xl bg-background/50 border-none h-12 transition-all shadow-sm"
                    />
                    <Lock className="absolute right-4 top-4 h-4 w-4 text-muted-foreground/30" />
                  </div>
                </div>

                <Button
                  onClick={handleAddKey}
                  disabled={loadingKeys || !newApiKey.trim()}
                  className="w-full h-12 rounded-2xl font-black uppercase tracking-[0.15em] text-[10px] shadow-lg shadow-primary/10"
                >
                  {loadingKeys ? <Loader2 className="h-4 w-4 animate-spin" /> : <><Plus className="h-4 w-4 mr-2" /> Connect</>}
                </Button>
              </div>
            </Card>

            {providers.length > 0 && (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {providers.map((p) => (
                  <Card key={p.id} className="p-5 flex items-center justify-between group rounded-[1.5rem] border-none shadow-none bg-card/60 hover:bg-card transition-all">
                    <div className="flex items-center gap-4">
                      <div className="h-10 w-10 bg-primary/5 flex items-center justify-center rounded-xl">
                        <Key className="h-5 w-5 text-primary opacity-70" />
                      </div>
                      <div>
                        <div className="flex items-center gap-2">
                          <span className="font-bold text-[11px] uppercase tracking-wider">
                            {PROVIDERS.find(prov => prov.id === p.provider)?.name || p.provider}
                          </span>
                          {p.isActive && <Badge className="h-4 bg-green-500/10 text-green-600 border-none px-2 text-[8px] font-black uppercase tracking-widest">Active</Badge>}
                        </div>
                        <div className="flex items-center gap-2 font-mono text-[9px] text-muted-foreground mt-1 opacity-60">
                          {showKey[p.id] ? p.keyPreview : '••••••••••••••••'}
                          <button onClick={() => toggleShowKey(p.id)} className="hover:text-primary transition-colors">
                            {showKey[p.id] ? <EyeOff className="h-3 w-3" /> : <Eye className="h-3 w-3" />}
                          </button>
                        </div>
                      </div>
                    </div>
                    <Button
                      variant="ghost"
                      size="icon"
                      className="h-8 w-8 text-destructive hover:bg-destructive/10 rounded-xl opacity-0 group-hover:opacity-100 transition-all"
                      onClick={() => handleDeleteKey(p.id, p.provider)}
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </Card>
                ))}
              </div>
            )}
          </section>

          <section className="space-y-6">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="p-2 bg-primary/10 rounded-xl">
                  <Cpu className="h-5 w-5 text-primary" />
                </div>
                <h2 className="font-black text-[11px] uppercase tracking-[0.2em] text-primary">Intelligence Mapping</h2>
              </div>
              <div className="flex gap-2">
                <Button variant="ghost" size="sm" onClick={handleClearModels} disabled={savingModels} className="rounded-xl font-black uppercase tracking-widest text-[9px] h-8">
                  <RotateCcw className="h-3 w-3 mr-1.5" /> Reset
                </Button>
                <Button size="sm" onClick={handleSaveModels} disabled={savingModels || !hasModelChanges} className="rounded-xl font-black uppercase tracking-widest text-[9px] h-8 px-4 shadow-lg shadow-primary/10">
                  {savingModels ? <Loader2 className="h-3 w-3 animate-spin" /> : <><Save className="h-3 w-3 mr-1.5" /> Update</>}
                </Button>
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {FEATURES.map((feature) => (
                <Card key={feature.id} className="p-6 rounded-[1.5rem] border-none shadow-none bg-card/40 backdrop-blur-sm group hover:bg-card/60 transition-all">
                  <div className="space-y-6">
                    <div className="flex items-start gap-4">
                      <div className="p-3 bg-primary/5 text-primary rounded-xl group-hover:bg-primary/10 transition-colors">
                        <feature.icon className="h-5 w-5" />
                      </div>
                      <div>
                        <h3 className="font-bold text-[10px] uppercase tracking-widest mb-1 text-primary/80">{feature.name}</h3>
                        <p className="text-[10px] text-muted-foreground/80 leading-snug font-medium">{feature.description}</p>
                      </div>
                    </div>

                    <div className="space-y-2">
                      <Select
                        value={preferences[feature.id] || ''}
                        onValueChange={(val) => handlePreferenceChange(feature.id, val)}
                      >
                        <SelectTrigger className="bg-background/40 rounded-xl border-none h-10 shadow-sm text-[11px] font-bold">
                          <SelectValue placeholder="System Default" />
                        </SelectTrigger>
                        <SelectContent className="rounded-2xl border-none shadow-2xl">
                          <SelectItem value="auto" className="rounded-xl font-black text-[9px] uppercase tracking-widest">Recommended (Auto)</SelectItem>
                          {aiSettings?.availableProviders.flatMap(p => p.models).map(model => (
                            <SelectItem key={model.id} value={model.id} className="rounded-xl text-xs">{model.name}</SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                      <p className="text-[8px] font-black uppercase tracking-widest text-muted-foreground/40 ml-1">
                        Current: <span className="text-primary/60">{currentPrefs[feature.id] || 'Default'}</span>
                      </p>
                    </div>
                  </div>
                </Card>
              ))}
            </div>
          </section>
        </TabsContent>

        <TabsContent value="account" className="mt-0 focus-visible:ring-0">
          <section className="space-y-6">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-destructive/10 rounded-xl">
                <Trash2 className="h-5 w-5 text-destructive" />
              </div>
              <h2 className="font-black text-[11px] uppercase tracking-[0.2em] text-destructive">Danger Zone</h2>
            </div>

            <Card className="p-8 rounded-[2rem] border-none shadow-none bg-destructive/5 backdrop-blur-sm">
              <div className="flex flex-col md:flex-row items-center gap-8">
                <div className="flex-1 space-y-2 text-center md:text-left">
                  <h3 className="text-sm font-black uppercase tracking-widest text-destructive">Terminate Account</h3>
                  <p className="text-[11px] text-destructive/70 leading-relaxed font-medium">
                    Once deleted, all your resumes, cover letters, and configurations will be permanently purged. This action is irreversible.
                  </p>
                </div>
                <Button
                  variant="destructive"
                  className="rounded-2xl h-12 px-8 font-black uppercase tracking-widest text-[10px] shadow-lg shadow-destructive/10"
                  onClick={() => setShowDeleteDialog(true)}
                >
                  Delete Infrastructure
                </Button>
              </div>
            </Card>
          </section>
        </TabsContent>
      </Tabs>

      <Dialog open={showDeleteDialog} onOpenChange={setShowDeleteDialog}>
        <DialogContent className="rounded-[2rem] border-none shadow-2xl p-8">
          <DialogHeader>
            <DialogTitle className="text-xl font-black uppercase tracking-widest text-destructive">Final Confirmation</DialogTitle>
            <DialogDescription className="text-xs font-medium leading-relaxed">
              This will permanently destroy all data associated with this identity.
            </DialogDescription>
          </DialogHeader>
          <div className="py-6 space-y-4">
            <Label className="text-[10px] font-black uppercase tracking-widest text-muted-foreground block text-center">
              Type <span className="text-destructive select-all">DELETE</span> to authorize
            </Label>
            <Input
              className="bg-muted/50 border-none h-12 rounded-2xl text-center font-black uppercase tracking-widest"
              placeholder="AUTHORIZATION CODE"
              value={confirmDeleteText}
              onChange={(e) => setConfirmDeleteText(e.target.value)}
            />
          </div>
          <DialogFooter className="gap-3">
            <Button variant="ghost" onClick={() => setShowDeleteDialog(false)} className="rounded-2xl font-black uppercase tracking-widest text-[10px] h-12 px-6">Abort</Button>
            <Button
              variant="destructive"
              onClick={handleDeleteAccount}
              disabled={isDeletingAccount || confirmDeleteText !== 'DELETE'}
              className="rounded-2xl font-black uppercase tracking-widest text-[10px] h-12 px-8 flex-1 sm:flex-none"
            >
              {isDeletingAccount ? <Loader2 className="animate-spin h-4 w-4" /> : 'Confirm Deletion'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </Page>
  );
}
