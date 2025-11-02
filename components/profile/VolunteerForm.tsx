"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import type { Volunteer } from "@/lib/validations/jsonresume";
import { Trash2, Plus } from "lucide-react";

interface VolunteerFormProps {
  volunteer: Volunteer[];
  onChange: (volunteer: Volunteer[]) => void;
}

export function VolunteerForm({ volunteer, onChange }: VolunteerFormProps) {
  const [volunteerList, setVolunteerList] = useState<Volunteer[]>(volunteer);

  const handleAddVolunteer = () => {
    const newVolunteer: Volunteer = {
      organization: "",
      position: "",
      url: "",
      startDate: "",
      endDate: "",
      summary: "",
      highlights: [],
    };
    const updated = [...volunteerList, newVolunteer];
    setVolunteerList(updated);
    onChange(updated);
  };

  const handleRemoveVolunteer = (index: number) => {
    const updated = volunteerList.filter((_, i) => i !== index);
    setVolunteerList(updated);
    onChange(updated);
  };

  const handleVolunteerChange = (index: number, field: keyof Volunteer, value: string | string[]) => {
    const updated = volunteerList.map((vol, i) => {
      if (i === index) {
        return { ...vol, [field]: value };
      }
      return vol;
    });
    setVolunteerList(updated);
    onChange(updated);
  };

  const handleHighlightsChange = (index: number, value: string) => {
    const highlights = value.split("\n").filter((item) => item.trim() !== "");
    handleVolunteerChange(index, "highlights", highlights);
  };

  return (
    <div className="space-y-6">
      {volunteerList.map((vol, index) => (
        <div key={index} className="border rounded-md p-4 space-y-4">
          <div className="flex justify-between items-center">
            <h3 className="text-lg font-semibold">Volunteer Experience {index + 1}</h3>
            <Button
              type="button"
              variant="destructive"
              size="icon"
              onClick={() => handleRemoveVolunteer(index)}
            >
              <Trash2 className="h-4 w-4" />
            </Button>
          </div>

          <div className="grid gap-4 md:grid-cols-2">
            <div className="space-y-2">
              <Label htmlFor={`volunteer-organization-${index}`}>Organization *</Label>
              <Input
                id={`volunteer-organization-${index}`}
                value={vol.organization || ""}
                onChange={(e) => handleVolunteerChange(index, "organization", e.target.value)}
                placeholder="Red Cross"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor={`volunteer-position-${index}`}>Position *</Label>
              <Input
                id={`volunteer-position-${index}`}
                value={vol.position || ""}
                onChange={(e) => handleVolunteerChange(index, "position", e.target.value)}
                placeholder="Volunteer Coordinator"
              />
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor={`volunteer-url-${index}`}>Website URL</Label>
            <Input
              id={`volunteer-url-${index}`}
              value={vol.url || ""}
              onChange={(e) => handleVolunteerChange(index, "url", e.target.value)}
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
                onChange={(e) => handleVolunteerChange(index, "startDate", e.target.value)}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor={`volunteer-endDate-${index}`}>End Date</Label>
              <Input
                id={`volunteer-endDate-${index}`}
                type="date"
                value={vol.endDate || ""}
                onChange={(e) => handleVolunteerChange(index, "endDate", e.target.value)}
              />
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor={`volunteer-summary-${index}`}>Summary</Label>
            <Textarea
              id={`volunteer-summary-${index}`}
              value={vol.summary || ""}
              onChange={(e) => handleVolunteerChange(index, "summary", e.target.value)}
              placeholder="Brief description of your volunteer work"
              rows={3}
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor={`volunteer-highlights-${index}`}>Highlights (one per line)</Label>
            <Textarea
              id={`volunteer-highlights-${index}`}
              value={(vol.highlights || []).join("\n")}
              onChange={(e) => handleHighlightsChange(index, e.target.value)}
              placeholder="Organized fundraising events&#10;Managed team of 15 volunteers"
              rows={4}
            />
          </div>
        </div>
      ))}

      <Button type="button" onClick={handleAddVolunteer} variant="outline" className="w-full">
        <Plus className="mr-2 h-4 w-4" /> Add Volunteer Experience
      </Button>
    </div>
  );
}
