"use client";

import { SimpleFormField } from "@/components/ui/simple-form-field";
import type { Certificate } from "@/lib/validations/jsonresume";
import { useListForm } from "@/hooks/use-list-form";
import { FormList } from "@/components/ui/form-list";

interface CertificationsFormProps {
  certifications: Certificate[];
  onChange: (certifications: Certificate[]) => void;
}

export default function CertificationsForm({
  certifications = [],
  onChange,
}: CertificationsFormProps) {
  const { items, addItem, removeItem, updateItem } = useListForm<Certificate>({
    initialItems: certifications,
    onChange,
    newItemTemplate: {
      name: "",
      issuer: "",
      date: "",
      url: "",
    },
  });

  return (
    <FormList
      items={items}
      onAdd={addItem}
      onRemove={removeItem}
      addButtonText="Add Certification"
      emptyMessage="No certifications added yet. Click 'Add Certification' to get started."
      renderItem={(cert, index) => (
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
          <SimpleFormField
            id={`cert-name-${index}`}
            label="Certification Name"
            value={cert.name || ""}
            onChange={(value) => updateItem(index, "name", value)}
            placeholder="e.g., AWS Solutions Architect"
            required
          />

          <SimpleFormField
            id={`cert-issuer-${index}`}
            label="Issuing Organization"
            value={cert.issuer || ""}
            onChange={(value) => updateItem(index, "issuer", value)}
            placeholder="e.g., Amazon Web Services"
            required
          />

          <SimpleFormField
            id={`cert-date-${index}`}
            label="Issue Date"
            value={cert.date || ""}
            onChange={(value) => updateItem(index, "date", value)}
            type="month"
          />

          <SimpleFormField
            id={`cert-url-${index}`}
            label="Credential URL"
            value={cert.url || ""}
            onChange={(value) => updateItem(index, "url", value)}
            type="url"
            placeholder="https://..."
            description="Optional: Link to verify credential"
          />
        </div>
      )}
    />
  );
}
