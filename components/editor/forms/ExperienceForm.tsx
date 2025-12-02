"use client";

import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Work } from "@/lib/validations/jsonresume";
import { useListForm } from "@/hooks/use-list-form";
import { FormList } from "@/components/ui/form-list";

interface ExperienceFormProps {
  experiences: Work[];
  onChange: (experiences: Work[]) => void;
}

export function ExperienceForm({ experiences, onChange }: ExperienceFormProps) {
  const { items, addItem, removeItem, updateItem } = useListForm<Work>({
    initialItems: experiences,
    onChange,
    newItemTemplate: {
      name: "",
      position: "",
      startDate: "",
      endDate: "",
      summary: "",
      highlights: [],
    },
  });

  return (
    <FormList
      items={items}
      onAdd={addItem}
      onRemove={removeItem}
      addButtonText="Add Experience"
      emptyMessage="No experience entries yet. Click 'Add Experience' to get started."
      renderItem={(experience, index) => (
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
          <div className="space-y-2">
            <Label htmlFor={`name-${index}`}>Company *</Label>
            <Input
              id={`name-${index}`}
              value={experience.name || ""}
              onChange={(e) => updateItem(index, "name", e.target.value)}
              required
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor={`position-${index}`}>Job Title *</Label>
            <Input
              id={`position-${index}`}
              value={experience.position || ""}
              onChange={(e) => updateItem(index, "position", e.target.value)}
              required
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor={`start-${index}`}>Start Date *</Label>
            <Input
              id={`start-${index}`}
              type="month"
              value={experience.startDate || ""}
              onChange={(e) => updateItem(index, "startDate", e.target.value)}
              required
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor={`end-${index}`}>End Date</Label>
            <Input
              id={`end-${index}`}
              type="month"
              value={experience.endDate || ""}
              onChange={(e) => updateItem(index, "endDate", e.target.value)}
              placeholder="Leave empty if current"
            />
          </div>

          <div className="sm:col-span-2 space-y-2">
            <Label htmlFor={`summary-${index}`}>Summary</Label>
            <Textarea
              id={`summary-${index}`}
              value={experience.summary || ""}
              onChange={(e) => updateItem(index, "summary", e.target.value)}
              rows={3}
              placeholder="Brief description of your role..."
            />
            <p className="text-sm text-muted-foreground">Describe your key responsibilities</p>
          </div>

          <div className="sm:col-span-2 space-y-2">
            <Label htmlFor={`highlights-${index}`}>Key Achievements</Label>
            <Textarea
              id={`highlights-${index}`}
              value={experience.highlights?.join("\n") || ""}
              onChange={(e) => {
                const highlightsArray = e.target.value.split("\n").filter(h => h.trim());
                updateItem(index, "highlights", highlightsArray);
              }}
              rows={4}
              placeholder="• Achievement 1&#10;• Achievement 2&#10;• Achievement 3"
            />
            <p className="text-sm text-muted-foreground">One achievement per line</p>
          </div>
        </div>
      )}
    />
  );
}
