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
import { SectionHeader } from '@/components/shared/SectionHeader';
import { GlassCard } from '@/components/shared/GlassCard';
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
import { addApiProvider, deleteApiProvider } from '@/app/actions/api-provider';
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

/**
 * Settings Page
 * Unified management of API providers and account security.
 */
export default function SettingsPage() {
  const router = useRouter();
  const { providers, refreshProviders } = useSettings();

  // API Keys state
  const [loadingKeys, setLoadingKeys] = useState(false);
  const [showKey, setShowKey] = useState<Record<string, boolean>>({});
  const [newProvider, setNewProvider] = useState('openai');
  const [newApiKey, setNewApiKey] = useState('');

  // Account state
  const [showDeleteDialog, setShowDeleteDialog] = useState(false);
  const [isDeletingAccount, setIsDeletingAccount] = useState(false);
  const [confirmDeleteText, setConfirmDeleteText] = useState('');

  const toggleShowKey = (id: string) => {
    setShowKey(prev => ({ ...prev, [id]: !prev[id] }));
  };

  const handleAddKey = async () => {
    if (!newApiKey.trim()) return;
    setLoadingKeys(true);
    try {
      const providerInfo = PROVIDERS.find(p => p.id === newProvider);
      const result = await addApiProvider({
        name: providerInfo?.name || newProvider,
        provider: newProvider,
        apiKey: newApiKey.trim(),
      });
      if (result.success) {
        toast.success(`${providerInfo?.name} key added`);
        setNewApiKey('');
        await refreshProviders();
      } else {
        toast.error((result as any).error);
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
      const result = await deleteApiProvider(id);
      if (result.success) {
        toast.success(`${name} key removed`);
        await refreshProviders();
      } else {
        toast.error((result as any).error);
      }
    } catch (error) {
      toast.error('An error occurred');
    } finally {
      setLoadingKeys(false);
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


  return (
    <Page
      title="Settings"
      description="Manage your AI configurations and account preferences"
    >
      <Tabs defaultValue="ai" className="space-y-8">
        <TabsList className="bg-muted/40 p-1.5 rounded-xl h-auto self-start border border-primary/5">
          <TabsTrigger value="ai" className="rounded-lg px-6 py-2.5 data-[state=active]:bg-background data-[state=active]:shadow-sm font-bold uppercase tracking-widest text-[10px] text-muted-foreground data-[state=active]:text-primary transition-all">
            <Cpu className="h-4 w-4 mr-2" />
            AI Settings
          </TabsTrigger>
          <TabsTrigger value="account" className="rounded-lg px-6 py-2.5 data-[state=active]:bg-background data-[state=active]:shadow-sm font-bold uppercase tracking-widest text-[10px] text-muted-foreground data-[state=active]:text-primary transition-all">
            <UserCircle className="h-4 w-4 mr-2" />
            Account
          </TabsTrigger>
        </TabsList>

        <TabsContent value="ai" className="space-y-8 mt-0 focus-visible:ring-0">
          <section className="space-y-6">
            <SectionHeader
              icon={Key}
              title="API Providers"
              className="[&>div:last-child>h2]:text-sm [&>div:last-child>h2]:text-primary [&>div:last-child>h2]:font-bold [&>div:last-child>h2]:uppercase [&>div:last-child>h2]:tracking-widest"
            />

            <GlassCard className="p-8 border border-primary/5">
              <div className="grid grid-cols-1 md:grid-cols-4 gap-6 items-end">
                <div className="md:col-span-1 space-y-2.5">
                  <label className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground ml-1">Provider</label>
                  <Select value={newProvider} onValueChange={setNewProvider}>
                    <SelectTrigger className="rounded-xl bg-background/50 border border-primary/5 h-12 transition-all shadow-sm focus:ring-1 focus:ring-primary/20">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent className="rounded-xl border border-primary/5 shadow-2xl bg-background/95 backdrop-blur-xl">
                      {PROVIDERS.map(p => (
                        <SelectItem key={p.id} value={p.id} className="rounded-lg focus:bg-primary/5 focus:text-primary transition-colors">{p.name}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                <div className="md:col-span-2 space-y-2.5">
                  <label className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground ml-1">API Key</label>
                  <div className="relative">
                    <Input
                      type="password"
                      placeholder="Paste security key"
                      value={newApiKey}
                      onChange={(e) => setNewApiKey(e.target.value)}
                      className="pr-12 rounded-xl bg-background/50 border border-primary/5 h-12 transition-all shadow-sm focus-visible:ring-1 focus-visible:ring-primary/20"
                    />
                    <Lock className="absolute right-4 top-4 h-4 w-4 text-muted-foreground/30" />
                  </div>
                </div>

                <Button
                  onClick={handleAddKey}
                  disabled={loadingKeys || !newApiKey.trim()}
                  className="w-full h-12 rounded-xl font-bold uppercase tracking-widest text-[10px] shadow-lg shadow-primary/10 hover:shadow-primary/20 hover:scale-[1.01] active:scale-[0.99] transition-all"
                >
                  {loadingKeys ? <Loader2 className="h-4 w-4 animate-spin" /> : <><Plus className="h-4 w-4 mr-2" /> Connect</>}
                </Button>
              </div>
            </GlassCard>

            {providers.length > 0 && (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {providers.map((p) => (
                  <GlassCard key={p.id} className="p-5 flex items-center justify-between group bg-background/50 hover:bg-primary/5 transition-all border border-primary/5 hover:border-primary/10 active:scale-[0.99] cursor-pointer">
                    <div className="flex items-center gap-4">
                      <div className="h-10 w-10 bg-primary/10 flex items-center justify-center rounded-lg group-hover:bg-primary/20 transition-colors">
                        <Key className="h-5 w-5 text-primary opacity-80" />
                      </div>
                      <div>
                        <div className="flex items-center gap-2">
                          <span className="font-bold text-[11px] uppercase tracking-widest text-primary/80">
                            {PROVIDERS.find(prov => prov.id === p.provider)?.name || p.provider}
                          </span>
                          {p.isActive && <Badge className="h-4 bg-green-500/10 text-green-600 border-none px-2 text-[8px] font-bold uppercase tracking-widest rounded-full">Active</Badge>}
                        </div>
                        <div className="flex items-center gap-2 font-mono text-[10px] text-muted-foreground mt-1 opacity-70">
                          {showKey[p.id] ? p.keyPreview : '••••••••••••••••'}
                          <button onClick={(e) => { e.stopPropagation(); toggleShowKey(p.id); }} className="hover:text-primary transition-colors p-1">
                            {showKey[p.id] ? <EyeOff className="h-3.5 w-3.5" /> : <Eye className="h-3.5 w-3.5" />}
                          </button>
                        </div>
                      </div>
                    </div>
                    <Button
                      variant="ghost"
                      size="icon"
                      className="h-9 w-9 text-destructive hover:bg-destructive/10 rounded-xl opacity-0 group-hover:opacity-100 transition-all active:scale-90"
                      onClick={(e) => { e.stopPropagation(); handleDeleteKey(p.id, p.provider); }}
                    >
                      <Trash2 className="h-4.5 w-4.5" />
                    </Button>
                  </GlassCard>
                ))}
              </div>
            )}
          </section>

        </TabsContent>

        <TabsContent value="account" className="mt-0 focus-visible:ring-0">
          <section className="space-y-6">
            <SectionHeader
              icon={Trash2}
              title="Danger Zone"
              className="text-destructive [&>div:first-child]:bg-destructive/10 [&>div:first-child>svg]:text-destructive [&>div:last-child>h2]:text-destructive"
            />

            <Card className="p-8 rounded-xl border-none shadow-none bg-destructive/5 backdrop-blur-sm">
              <div className="flex flex-col md:flex-row items-center gap-8">
                <div className="flex-1 space-y-2 text-center md:text-left">
                  <h3 className="text-sm font-black uppercase tracking-widest text-destructive">Terminate Account</h3>
                  <p className="text-[11px] text-destructive/70 leading-relaxed font-medium">
                    Once deleted, all your resumes, cover letters, and configurations will be permanently purged. This action is irreversible.
                  </p>
                </div>
                <Button
                  variant="destructive"
                  className="rounded-xl h-12 px-8 font-black uppercase tracking-widest text-[10px] shadow-lg shadow-destructive/10"
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
        <DialogContent className="rounded-xl border-none shadow-2xl p-8">
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
              className="bg-muted/50 border-none h-12 rounded-xl text-center font-black uppercase tracking-widest"
              placeholder="AUTHORIZATION CODE"
              value={confirmDeleteText}
              onChange={(e) => setConfirmDeleteText(e.target.value)}
            />
          </div>
          <DialogFooter className="gap-3">
            <Button variant="ghost" onClick={() => setShowDeleteDialog(false)} className="rounded-xl font-black uppercase tracking-widest text-[10px] h-12 px-6">Abort</Button>
            <Button
              variant="destructive"
              onClick={handleDeleteAccount}
              disabled={isDeletingAccount || confirmDeleteText !== 'DELETE'}
              className="rounded-xl font-black uppercase tracking-widest text-[10px] h-12 px-8 flex-1 sm:flex-none"
            >
              {isDeletingAccount ? <Loader2 className="animate-spin h-4 w-4" /> : 'Confirm Deletion'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </Page>
  );
}
