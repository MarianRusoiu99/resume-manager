import { ProfileListItem } from "@/lib/actions/types";
import { ModelSelector } from "@/components/ai/ModelSelector";

interface GenerationSettingsProps {
  profiles: ProfileListItem[];
  selectedProfileId: string;
  onProfileChange: (id: string) => void;
  modelId: string | null;
  onModelChange: (modelId: string, providerId: string) => void;
  isModelLoading: boolean;
}

export function GenerationSettings({
  profiles,
  selectedProfileId,
  onProfileChange,
  modelId,
  onModelChange,
  isModelLoading
}: GenerationSettingsProps) {
  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
      <div className="space-y-2.5">
        <label htmlFor="profile-source" className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground ml-1">
          Profile Source
        </label>
        <select
          id="profile-source"
          className="w-full h-10 px-4 rounded-xl border border-primary/5 bg-background/50 text-sm focus:ring-2 focus:ring-primary/20 outline-none transition-all appearance-none cursor-pointer"
          value={selectedProfileId}
          onChange={(e) => onProfileChange(e.target.value)}
        >
          {profiles.map(p => (
            <option key={p.id} value={p.id}>{p.name}</option>
          ))}
        </select>
      </div>
      <div className="space-y-2.5">
        <label htmlFor="ai-model-selector" className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground ml-1">
          AI Model Preference
        </label>
        <ModelSelector
          data-test="ai-model-selector"
          value={modelId || ""}
          onValueChange={onModelChange}
          feature="resume"
          requiresStructuredOutput={true}
          isLoading={isModelLoading}
          className="w-full"
        />
      </div>
    </div>
  );
}
