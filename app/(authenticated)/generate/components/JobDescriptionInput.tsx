import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Sparkles } from "lucide-react";
import { Spinner } from "@/components/shared/Spinner";

interface JobDescriptionInputProps {
  value: string;
  onChange: (value: string) => void;
  isLoading: boolean;
  isDisabled: boolean;
  onGenerate: () => void;
  _hasAIProviders: boolean;
}

export function JobDescriptionInput({
  value,
  onChange,
  isLoading,
  isDisabled,
  onGenerate,
  _hasAIProviders
}: JobDescriptionInputProps) {
  return (
    <div className="space-y-6">
      <div>
        <label htmlFor="job-description" className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground block mb-2.5 ml-1">
          Job Description
        </label>
        <Textarea
          id="job-description"
          value={value}
          onChange={(e) => onChange(e.target.value)}
          placeholder="Paste the job description here..."
          rows={12}
          className="font-mono text-xs resize-none rounded-xl bg-background/50 border-primary/5 focus-visible:ring-primary/20 transition-all p-4"
        />
        <div className="flex justify-between items-center mt-2 px-1">
          <p className="text-[10px] text-muted-foreground font-medium">
            {value.length}/50 min characters
          </p>
        </div>
      </div>

      <Button
        className="w-full rounded-xl shadow-lg shadow-primary/20 hover:shadow-xl hover:shadow-primary/30 transition-all font-bold uppercase tracking-widest h-12"
        size="lg"
        disabled={isDisabled}
        onClick={onGenerate}
      >
        {isLoading ? (
          <><Spinner size="sm" className="mr-2" />Tailoring...</>
        ) : (
          <><Sparkles className="w-4 h-4 mr-2" />Generate Resume</>
        )}
      </Button>
    </div>
  );
}
