"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import type { Reference } from "@/lib/validations/jsonresume";
import { Trash2, Plus } from "lucide-react";

interface ReferencesFormProps {
  references: Reference[];
  onChange: (references: Reference[]) => void;
}

export function ReferencesForm({ references, onChange }: ReferencesFormProps) {
  const [referencesList, setReferencesList] = useState<Reference[]>(references);

  const handleAddReference = () => {
    const newReference: Reference = {
      name: "",
      reference: "",
    };
    const updated = [...referencesList, newReference];
    setReferencesList(updated);
    onChange(updated);
  };

  const handleRemoveReference = (index: number) => {
    const updated = referencesList.filter((_, i) => i !== index);
    setReferencesList(updated);
    onChange(updated);
  };

  const handleReferenceChange = (index: number, field: keyof Reference, value: string) => {
    const updated = referencesList.map((ref, i) => {
      if (i === index) {
        return { ...ref, [field]: value };
      }
      return ref;
    });
    setReferencesList(updated);
    onChange(updated);
  };

  return (
    <div className="space-y-6">
      {referencesList.map((ref, index) => (
        <div key={index} className="border rounded-md p-4 space-y-4">
          <div className="flex justify-between items-center">
            <h3 className="text-lg font-semibold">Reference {index + 1}</h3>
            <Button
              type="button"
              variant="destructive"
              size="icon"
              onClick={() => handleRemoveReference(index)}
            >
              <Trash2 className="h-4 w-4" />
            </Button>
          </div>

          <div className="space-y-2">
            <Label htmlFor={`reference-name-${index}`}>Reference Name *</Label>
            <Input
              id={`reference-name-${index}`}
              value={ref.name || ""}
              onChange={(e) => handleReferenceChange(index, "name", e.target.value)}
              placeholder="John Doe"
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor={`reference-reference-${index}`}>Reference Statement *</Label>
            <Textarea
              id={`reference-reference-${index}`}
              value={ref.reference || ""}
              onChange={(e) => handleReferenceChange(index, "reference", e.target.value)}
              placeholder="John is an excellent developer with strong problem-solving skills..."
              rows={4}
            />
          </div>
        </div>
      ))}

      <Button type="button" onClick={handleAddReference} variant="outline" className="w-full">
        <Plus className="mr-2 h-4 w-4" /> Add Reference
      </Button>
    </div>
  );
}
