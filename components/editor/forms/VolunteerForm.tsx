"use client";

import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import type { Volunteer } from "@/lib/validations/jsonresume";
import { useListForm } from "@/hooks/use-list-form";
import { FormList } from "@/components/ui/form-list";

interface VolunteerFormProps {
  volunteer: Volunteer[];
  onChange: (volunteer: Volunteer[]) => void;
}

export function VolunteerForm({ volunteer, onChange }: VolunteerFormProps) {
  const { items, addItem, removeItem, updateItem } = useListForm<Volunteer>({
    initialItems: volunteer,
    onChange,
    newItemTemplate: {
      organization: "",
      position: "",
      url: "",
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
      addButtonText="Add Volunteer Experience"
      emptyMessage="No volunteer experience added yet. Click 'Add Volunteer Experience' to get started."
      renderItem={(vol, index) => (
        <div className="space-y-4">
          <div className="grid gap-4 md:grid-cols-2">
            <div className="space-y-2">
              <Label htmlFor={`volunteer-organization-${index}`}>Organization *</Label>
              <Input
                id={`volunteer-organization-${index}`}
                value={vol.organization || ""}
                onChange={(e) => updateItem(index, "organization", e.target.value)}
                placeholder="Red Cross"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor={`volunteer-position-${index}`}>Position *</Label>
              <Input
                id={`volunteer-position-${index}`}
                value={vol.position || ""}
                onChange={(e) => updateItem(index, "position", e.target.value)}
                placeholder="Volunteer Coordinator"
              />
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor={`volunteer-url-${index}`}>Website URL</Label>
            <Input
              id={`volunteer-url-${index}`}
              value={vol.url || ""}
              onChange={(e) => updateItem(index, "url", e.target.value)}
              placeholder="https://organization-website.org"
            />
          </div>

          <div className="grid gap-4 md:grid-cols-2">
            <div className="space-y-2">
              <Label htmlFor={`volunteer-startDate-${index}`}>Start Date</Label>
              <Input
                id={`volunteer-startDate-${index}`}
                type="date"
                value={vol.startDate || ""}
                onChange={(e) => updateItem(index, "startDate", e.target.value)}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor={`volunteer-endDate-${index}`}>End Date</Label>
              <Input
                id={`volunteer-endDate-${index}`}
                type="date"
                value={vol.endDate || ""}
                onChange={(e) => updateItem(index, "endDate", e.target.value)}
              />
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor={`volunteer-summary-${index}`}>Summary</Label>
            <Textarea
              id={`volunteer-summary-${index}`}
              value={vol.summary || ""}
              onChange={(e) => updateItem(index, "summary", e.target.value)}
              placeholder="Brief description of your volunteer work"
              rows={3}
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor={`volunteer-highlights-${index}`}>Highlights (one per line)</Label>
            <Textarea
              id={`volunteer-highlights-${index}`}
              value={(vol.highlights || []).join("\n")}
              onChange={(e) => {
                const highlights = e.target.value.split("\n").filter((item) => item.trim() !== "");
                updateItem(index, "highlights", highlights);
              }}
              placeholder="Organized fundraising events&#10;Managed team of 15 volunteers"
              rows={4}
            />
          </div>
        </div>
      )}
    />
  );
}
