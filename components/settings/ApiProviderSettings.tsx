'use client';

import { 
  Key, 
  Plus, 
  Loader2, 
  Lock, 
  Eye, 
  EyeOff, 
  Trash2 
} from 'lucide-react';
import { 
  Button, 
  Input, 
  Select, 
  SelectTrigger, 
  SelectValue, 
  SelectContent, 
  SelectItem, 
  Badge 
} from '@/components/ui';
import { SectionHeader } from '@/components/shared/SectionHeader';
import { GlassCard } from '@/components/shared/GlassCard';

const PROVIDERS = [
  { id: 'openai', name: 'OpenAI', url: 'https://platform.openai.com/api-keys' },
  { id: 'anthropic', name: 'Anthropic', url: 'https://console.anthropic.com/settings/keys' },
  { id: 'google', name: 'Google (Gemini)', url: 'https://aistudio.google.com/app/apikey' },
];

interface ApiProviderSettingsProps {
  providers: any[];
  loadingKeys: boolean;
  newProvider: string;
  setNewProvider: (value: string) => void;
  newApiKey: string;
  setNewApiKey: (value: string) => void;
  onAddKey: () => void;
  onDeleteKey: (id: string, name: string) => void;
  showKey: Record<string, boolean>;
  toggleShowKey: (id: string) => void;
}

export function ApiProviderSettings({
  providers,
  loadingKeys,
  newProvider,
  setNewProvider,
  newApiKey,
  setNewApiKey,
  onAddKey,
  onDeleteKey,
  showKey,
  toggleShowKey,
}: ApiProviderSettingsProps) {
  return (
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
            onClick={onAddKey}
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
                onClick={(e) => { e.stopPropagation(); onDeleteKey(p.id, p.provider); }}
              >
                <Trash2 className="h-4.5 w-4.5" />
              </Button>
            </GlassCard>
          ))}
        </div>
      )}
    </section>
  );
}
