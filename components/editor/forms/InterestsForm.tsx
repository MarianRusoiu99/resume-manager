"use client";


import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import type { Interest } from "@/lib/validations/jsonresume";
import { Trash2, Plus } from "lucide-react";

interface InterestsFormProps {
  interests: Interest[];
  onChange: (interests: Interest[]) => void;
}

export function InterestsForm({ interests, onChange }: InterestsFormProps) {
  // Use interests directly from props - controlled component pattern
  const interestsList = interests;

  const handleAddInterest = () => {
    const newInterest: Interest = {
      name: "",
      keywords: [],
    };
    onChange([...interestsList, newInterest]);
  };

  const handleRemoveInterest = (index: number) => {
    onChange(interestsList.filter((_, i) => i !== index));
  };

  const handleInterestChange = (index: number, field: keyof NonNullable<Interest>, value: string | string[]) => {
    const updated = interestsList.map((interest, i) => {
      if (i === index && interest) {
        return { ...interest, [field]: value };
      }
      return interest;
    });
    onChange(updated);
  };

  const handleKeywordsChange = (index: number, value: string) => {
    const keywords = value.split("\n").filter((item) => item.trim() !== "");
    handleInterestChange(index, "keywords", keywords);
  };

  return (
    <div className="space-y-6">
      {interestsList.filter(interest => interest).map((interest, index) => (
        <div key={index} className="border rounded-md p-4 space-y-4">
          <div className="flex justify-between items-center">
            <h3 className="text-lg font-semibold">Interest {index + 1}</h3>
            <Button
              type="button"
              variant="destructive"
              size="icon"
              onClick={() => handleRemoveInterest(index)}
            >
              <Trash2 className="h-4 w-4" />
            </Button>
          </div>

          <div className="space-y-2">
            <Label htmlFor={`interest-name-${index}`}>Interest Name *</Label>
            <Input
              id={`interest-name-${index}`}
              value={interest!.name || ""}
              onChange={(e) => handleInterestChange(index, "name", e.target.value)}
              placeholder="Photography, Hiking, Open Source, etc."
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor={`interest-keywords-${index}`}>Related Keywords (one per line)</Label>
            <Textarea
              id={`interest-keywords-${index}`}
              value={(interest!.keywords || []).join("\n")}
              onChange={(e) => handleKeywordsChange(index, e.target.value)}
              placeholder="Landscape&#10;Wildlife&#10;Portrait"
              rows={4}
            />
          </div>
        </div>
      ))}

      <Button type="button" onClick={handleAddInterest} variant="outline" className="w-full">
        <Plus className="mr-2 h-4 w-4" /> Add Interest
      </Button>
    </div>
  );
}
