"use client";

import { SimpleFormField, SimpleFormFieldList } from "@/components/ui/simple-form-field";
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
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
          <SimpleFormField
            id={`volunteer-organization-${index}`}
            label="Organization"
            value={vol.organization || ""}
            onChange={(value) => updateItem(index, "organization", value)}
            placeholder="Red Cross"
            required
          />

          <SimpleFormField
            id={`volunteer-position-${index}`}
            label="Position"
            value={vol.position || ""}
            onChange={(value) => updateItem(index, "position", value)}
            placeholder="Volunteer Coordinator"
            required
          />

          <div className="sm:col-span-2">
            <SimpleFormField
              id={`volunteer-url-${index}`}
              label="Website URL"
              value={vol.url || ""}
              onChange={(value) => updateItem(index, "url", value)}
              type="url"
              placeholder="https://organization-website.org"
            />
          </div>

          <SimpleFormField
            id={`volunteer-startDate-${index}`}
            label="Start Date"
            value={vol.startDate || ""}
            onChange={(value) => updateItem(index, "startDate", value)}
            type="date"
          />

          <SimpleFormField
            id={`volunteer-endDate-${index}`}
            label="End Date"
            value={vol.endDate || ""}
            onChange={(value) => updateItem(index, "endDate", value)}
            type="date"
          />

          <div className="sm:col-span-2">
            <SimpleFormField
              id={`volunteer-summary-${index}`}
              label="Summary"
              value={vol.summary || ""}
              onChange={(value) => updateItem(index, "summary", value)}
              type="textarea"
              rows={3}
              placeholder="Brief description of your volunteer work"
            />
          </div>

          <div className="sm:col-span-2">
            <SimpleFormFieldList
              id={`volunteer-highlights-${index}`}
              label="Highlights"
              value={vol.highlights || []}
              onChange={(value) => updateItem(index, "highlights", value)}
              separator="newline"
              type="textarea"
              rows={4}
              placeholder="Organized fundraising events&#10;Managed team of 15 volunteers"
              description="One highlight per line"
            />
          </div>
        </div>
      )}
    />
  );
}
