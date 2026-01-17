import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Sparkles } from "lucide-react";
import { Spinner } from "@/components/core/feedback/Spinner";

interface CoverLetterInputProps {
  jobDescription: string;
  onJobDescriptionChange: (value: string) => void;
  personalInstructions: string;
  onPersonalInstructionsChange: (value: string) => void;
  isLoading: boolean;
  isDisabled: boolean;
  onGenerate: () => void;
}

export function CoverLetterInput({
  jobDescription,
  onJobDescriptionChange,
  personalInstructions,
  onPersonalInstructionsChange,
  isLoading,
  isDisabled,
  onGenerate
}: CoverLetterInputProps) {
  return (
    <div className="space-y-6">
      <div>
        <label htmlFor="job-description" className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground block mb-2.5 ml-1">
          Job Description
        </label>
        <Textarea
          id="job-description"
          value={jobDescription}
          onChange={(e) => onJobDescriptionChange(e.target.value)}
          placeholder="Paste the job description here..."
          rows={12}
          className="font-mono text-xs resize-none rounded-xl bg-background/50 border-primary/5 focus-visible:ring-primary/20 transition-all p-4"
        />
      </div>

      <div>
        <label htmlFor="personal-instructions" className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground block mb-2.5 ml-1">
          Personal Touch
        </label>
        <Textarea
          id="personal-instructions"
          value={personalInstructions}
          onChange={(e) => onPersonalInstructionsChange(e.target.value)}
          placeholder="e.g. Highlight my leadership experience. Use an energetic but professional tone."
          rows={4}
          className="text-xs resize-none rounded-xl bg-background/50 border-primary/5 focus-visible:ring-primary/20 transition-all p-4"
        />
      </div>

      <div className="flex gap-4 pt-4">
        <Button
          className="flex-1 rounded-xl shadow-lg shadow-primary/20 hover:shadow-xl hover:shadow-primary/30 transition-all font-bold uppercase tracking-widest h-12"
          size="lg"
          disabled={isDisabled}
          onClick={onGenerate}
        >
          {isLoading ? (
            <><Spinner size="sm" className="mr-2" />Drafting...</>
          ) : (
            <><Sparkles className="w-4 h-4 mr-2" />Generate Letter</>
          )}
        </Button>
      </div>
    </div>
  );
}
