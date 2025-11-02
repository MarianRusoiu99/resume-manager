"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import type { Award } from "@/lib/validations/jsonresume";
import { Trash2, Plus } from "lucide-react";

interface AwardsFormProps {
  awards: Award[];
  onChange: (awards: Award[]) => void;
}

export function AwardsForm({ awards, onChange }: AwardsFormProps) {
  const [awardsList, setAwardsList] = useState<Award[]>(awards);

  const handleAddAward = () => {
    const newAward: Award = {
      title: "",
      date: "",
      awarder: "",
      summary: "",
    };
    const updated = [...awardsList, newAward];
    setAwardsList(updated);
    onChange(updated);
  };

  const handleRemoveAward = (index: number) => {
    const updated = awardsList.filter((_, i) => i !== index);
    setAwardsList(updated);
    onChange(updated);
  };

  const handleAwardChange = (index: number, field: keyof Award, value: string) => {
    const updated = awardsList.map((award, i) => {
      if (i === index) {
        return { ...award, [field]: value };
      }
      return award;
    });
    setAwardsList(updated);
    onChange(updated);
  };

  return (
    <div className="space-y-6">
      {awardsList.map((award, index) => (
        <div key={index} className="border rounded-md p-4 space-y-4">
          <div className="flex justify-between items-center">
            <h3 className="text-lg font-semibold">Award {index + 1}</h3>
            <Button
              type="button"
              variant="destructive"
              size="icon"
              onClick={() => handleRemoveAward(index)}
            >
              <Trash2 className="h-4 w-4" />
            </Button>
          </div>

          <div className="grid gap-4 md:grid-cols-2">
            <div className="space-y-2">
              <Label htmlFor={`award-title-${index}`}>Award Title *</Label>
              <Input
                id={`award-title-${index}`}
                value={award.title || ""}
                onChange={(e) => handleAwardChange(index, "title", e.target.value)}
                placeholder="Employee of the Year"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor={`award-awarder-${index}`}>Awarded By *</Label>
              <Input
                id={`award-awarder-${index}`}
                value={award.awarder || ""}
                onChange={(e) => handleAwardChange(index, "awarder", e.target.value)}
                placeholder="Company Name"
              />
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor={`award-date-${index}`}>Date Received</Label>
            <Input
              id={`award-date-${index}`}
              type="date"
              value={award.date || ""}
              onChange={(e) => handleAwardChange(index, "date", e.target.value)}
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor={`award-summary-${index}`}>Summary</Label>
            <Textarea
              id={`award-summary-${index}`}
              value={award.summary || ""}
              onChange={(e) => handleAwardChange(index, "summary", e.target.value)}
              placeholder="Brief description of the award and what it recognizes"
              rows={3}
            />
          </div>
        </div>
      ))}

      <Button type="button" onClick={handleAddAward} variant="outline" className="w-full">
        <Plus className="mr-2 h-4 w-4" /> Add Award
      </Button>
    </div>
  );
}
