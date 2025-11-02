"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import type { Publication } from "@/lib/validations/jsonresume";
import { Trash2, Plus } from "lucide-react";

interface PublicationsFormProps {
  publications: Publication[];
  onChange: (publications: Publication[]) => void;
}

export function PublicationsForm({ publications, onChange }: PublicationsFormProps) {
  const [publicationsList, setPublicationsList] = useState<Publication[]>(publications);

  const handleAddPublication = () => {
    const newPublication: Publication = {
      name: "",
      publisher: "",
      releaseDate: "",
      url: "",
      summary: "",
    };
    const updated = [...publicationsList, newPublication];
    setPublicationsList(updated);
    onChange(updated);
  };

  const handleRemovePublication = (index: number) => {
    const updated = publicationsList.filter((_, i) => i !== index);
    setPublicationsList(updated);
    onChange(updated);
  };

  const handlePublicationChange = (index: number, field: keyof Publication, value: string) => {
    const updated = publicationsList.map((pub, i) => {
      if (i === index) {
        return { ...pub, [field]: value };
      }
      return pub;
    });
    setPublicationsList(updated);
    onChange(updated);
  };

  return (
    <div className="space-y-6">
      {publicationsList.map((pub, index) => (
        <div key={index} className="border rounded-md p-4 space-y-4">
          <div className="flex justify-between items-center">
            <h3 className="text-lg font-semibold">Publication {index + 1}</h3>
            <Button
              type="button"
              variant="destructive"
              size="icon"
              onClick={() => handleRemovePublication(index)}
            >
              <Trash2 className="h-4 w-4" />
            </Button>
          </div>

          <div className="grid gap-4 md:grid-cols-2">
            <div className="space-y-2">
              <Label htmlFor={`publication-name-${index}`}>Publication Name *</Label>
              <Input
                id={`publication-name-${index}`}
                value={pub.name || ""}
                onChange={(e) => handlePublicationChange(index, "name", e.target.value)}
                placeholder="Research Paper Title"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor={`publication-publisher-${index}`}>Publisher *</Label>
              <Input
                id={`publication-publisher-${index}`}
                value={pub.publisher || ""}
                onChange={(e) => handlePublicationChange(index, "publisher", e.target.value)}
                placeholder="Journal Name or Publisher"
              />
            </div>
          </div>

          <div className="grid gap-4 md:grid-cols-2">
            <div className="space-y-2">
              <Label htmlFor={`publication-releaseDate-${index}`}>Release Date</Label>
              <Input
                id={`publication-releaseDate-${index}`}
                type="date"
                value={pub.releaseDate || ""}
                onChange={(e) => handlePublicationChange(index, "releaseDate", e.target.value)}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor={`publication-url-${index}`}>URL</Label>
              <Input
                id={`publication-url-${index}`}
                value={pub.url || ""}
                onChange={(e) => handlePublicationChange(index, "url", e.target.value)}
                placeholder="https://publication-url.com"
              />
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor={`publication-summary-${index}`}>Summary</Label>
            <Textarea
              id={`publication-summary-${index}`}
              value={pub.summary || ""}
              onChange={(e) => handlePublicationChange(index, "summary", e.target.value)}
              placeholder="Brief description of the publication and its significance"
              rows={3}
            />
          </div>
        </div>
      ))}

      <Button type="button" onClick={handleAddPublication} variant="outline" className="w-full">
        <Plus className="mr-2 h-4 w-4" /> Add Publication
      </Button>
    </div>
  );
}
