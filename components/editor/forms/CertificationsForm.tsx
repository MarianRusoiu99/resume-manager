'use client';

import React, { useState } from 'react';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Label } from '@/components/ui/label';
import type { Certificate } from '@/lib/validations/jsonresume';

interface CertificationsFormProps {
  certifications: Certificate[];
  onChange: (certifications: Certificate[]) => void;
  errors?: Record<string, string>;
}

export default function CertificationsForm({
  certifications = [],
  onChange,
  errors,
}: CertificationsFormProps) {
  const [isAdding, setIsAdding] = useState(false);
  const [editingIndex, setEditingIndex] = useState<number | null>(null);

  const emptyEntry: Certificate = {
    name: '',
    issuer: '',
    date: '',
    url: '',
  };

  const [newEntry, setNewEntry] = useState(emptyEntry);

  const handleAdd = () => {
    if (!newEntry.name?.trim() || !newEntry.issuer?.trim()) {
      return;
    }

    onChange([...certifications, newEntry]);
    setNewEntry(emptyEntry);
    setIsAdding(false);
  };

  const handleUpdate = (index: number) => {
    const updated = certifications.map((cert, i) =>
      i === index ? newEntry : cert
    );
    onChange(updated);
    setNewEntry(emptyEntry);
    setEditingIndex(null);
  };

  const handleDelete = (index: number) => {
    onChange(certifications.filter((_, i) => i !== index));
  };

  const startEdit = (cert: Certificate, index: number) => {
    setNewEntry({
      name: cert.name || '',
      issuer: cert.issuer || '',
      date: cert.date || '',
      url: cert.url || '',
    });
    setEditingIndex(index);
    setIsAdding(false);
  };

  const cancelEdit = () => {
    setNewEntry(emptyEntry);
    setEditingIndex(null);
    setIsAdding(false);
  };

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h3 className="text-lg font-medium text-gray-900">Certifications</h3>
        {!isAdding && editingIndex === null && (
          <Button
            type="button"
            onClick={() => setIsAdding(true)}
            variant="secondary"
            size="sm"
          >
            + Add Certification
          </Button>
        )}
      </div>

      {errors?.certifications && (
        <p className="text-sm text-red-600">{errors.certifications}</p>
      )}

      {/* List of existing certifications */}
      <div className="space-y-3">
        {certifications.map((cert, index) => (
          <Card key={index} className="p-4">
            {editingIndex === index ? (
              <div className="space-y-3">
                <div className="space-y-2">
                  <Label htmlFor="cert-name-edit">Certification Name</Label>
                  <Input
                    id="cert-name-edit"
                    value={newEntry.name || ''}
                    onChange={(e: React.ChangeEvent<HTMLInputElement>) =>
                      setNewEntry({ ...newEntry, name: e.target.value })
                    }
                    placeholder="e.g., AWS Solutions Architect"
                    required
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="cert-issuer-edit">Issuing Organization</Label>
                  <Input
                    id="cert-issuer-edit"
                    value={newEntry.issuer || ''}
                    onChange={(e: React.ChangeEvent<HTMLInputElement>) =>
                      setNewEntry({ ...newEntry, issuer: e.target.value })
                    }
                    placeholder="e.g., Amazon Web Services"
                    required
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="cert-date-edit">Issue Date</Label>
                  <Input
                    id="cert-date-edit"
                    type="month"
                    value={newEntry.date || ''}
                    onChange={(e: React.ChangeEvent<HTMLInputElement>) =>
                      setNewEntry({ ...newEntry, date: e.target.value })
                    }
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="cert-url-edit">Credential URL (optional)</Label>
                  <Input
                    id="cert-url-edit"
                    type="url"
                    value={newEntry.url || ''}
                    onChange={(e: React.ChangeEvent<HTMLInputElement>) =>
                      setNewEntry({ ...newEntry, url: e.target.value })
                    }
                    placeholder="https://..."
                  />
                </div>
                <div className="flex space-x-2">
                  <Button
                    type="button"
                    onClick={() => handleUpdate(index)}
                    disabled={!newEntry.name?.trim() || !newEntry.issuer?.trim()}
                  >
                    Save
                  </Button>
                  <Button
                    type="button"
                    onClick={cancelEdit}
                    variant="outline"
                  >
                    Cancel
                  </Button>
                </div>
              </div>
            ) : (
              <div>
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    <h4 className="font-medium text-gray-900">{cert.name}</h4>
                    <p className="text-sm text-gray-600">{cert.issuer}</p>
                    {cert.date && (
                      <p className="text-sm text-gray-500 mt-1">
                        Issued: {new Date(cert.date + '-01').toLocaleDateString('en-US', {
                          year: 'numeric',
                          month: 'long',
                        })}
                      </p>
                    )}
                    {cert.url && (
                      <a
                        href={cert.url}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="text-sm text-blue-600 hover:text-blue-800 mt-1 inline-block"
                      >
                        View Credential →
                      </a>
                    )}
                  </div>
                  <div className="flex space-x-2 ml-4">
                    <Button
                      type="button"
                      onClick={() => startEdit(cert, index)}
                      variant="secondary"
                      size="sm"
                    >
                      Edit
                    </Button>
                    <Button
                      type="button"
                      onClick={() => handleDelete(index)}
                      variant="destructive"
                      size="sm"
                    >
                      Delete
                    </Button>
                  </div>
                </div>
              </div>
            )}
          </Card>
        ))}
      </div>

      {/* Add new certification form */}
      {isAdding && (
        <Card className="p-4">
          <h4 className="font-medium mb-4">New Certification</h4>
          <div className="space-y-3">
            <div className="space-y-2">
              <Label htmlFor="cert-name-new">Certification Name</Label>
              <Input
                id="cert-name-new"
                value={newEntry.name}
                onChange={(e: React.ChangeEvent<HTMLInputElement>) =>
                  setNewEntry({ ...newEntry, name: e.target.value })
                }
                placeholder="e.g., AWS Solutions Architect"
                required
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="cert-issuer-new">Issuing Organization</Label>
              <Input
                id="cert-issuer-new"
                value={newEntry.issuer}
                onChange={(e: React.ChangeEvent<HTMLInputElement>) =>
                  setNewEntry({ ...newEntry, issuer: e.target.value })
                }
                placeholder="e.g., Amazon Web Services"
                required
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="cert-date-new">Issue Date</Label>
              <Input
                id="cert-date-new"
                type="month"
                value={newEntry.date}
                onChange={(e: React.ChangeEvent<HTMLInputElement>) =>
                  setNewEntry({ ...newEntry, date: e.target.value })
                }
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="cert-url-new">Credential URL (optional)</Label>
              <Input
                id="cert-url-new"
                type="url"
                value={newEntry.url}
                onChange={(e: React.ChangeEvent<HTMLInputElement>) =>
                  setNewEntry({ ...newEntry, url: e.target.value })
                }
                placeholder="https://..."
              />
            </div>
            <div className="flex space-x-2">
              <Button
                type="button"
                onClick={handleAdd}
                disabled={!newEntry.name?.trim() || !newEntry.issuer?.trim()}
              >
                Add Certification
              </Button>
              <Button
                type="button"
                onClick={cancelEdit}
                variant="outline"
              >
                Cancel
              </Button>
            </div>
          </div>
        </Card>
      )}

      {certifications.length === 0 && !isAdding && (
        <Card className="p-6 text-center">
          <p className="text-gray-500 mb-3">No certifications added yet</p>
          <Button
            type="button"
            onClick={() => setIsAdding(true)}
            variant="secondary"
            size="sm"
          >
            Add Your First Certification
          </Button>
        </Card>
      )}
    </div>
  );
}
