'use client';

import React, { useState } from 'react';
import { Input, Button, Card } from '@/components/ui';

export interface Certification {
  id: string;
  name: string;
  issuer: string;
  date: string;
  url?: string;
}

interface CertificationsFormProps {
  certifications: Certification[];
  onChange: (certifications: Certification[]) => void;
  errors?: Record<string, string>;
}

export default function CertificationsForm({
  certifications,
  onChange,
  errors,
}: CertificationsFormProps) {
  const [isAdding, setIsAdding] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);

  const emptyEntry: Omit<Certification, 'id'> = {
    name: '',
    issuer: '',
    date: '',
    url: '',
  };

  const [newEntry, setNewEntry] = useState(emptyEntry);

  const handleAdd = () => {
    if (!newEntry.name.trim() || !newEntry.issuer.trim()) {
      return;
    }

    const certification: Certification = {
      id: Date.now().toString(),
      ...newEntry,
    };

    onChange([...certifications, certification]);
    setNewEntry(emptyEntry);
    setIsAdding(false);
  };

  const handleUpdate = (id: string) => {
    const updated = certifications.map((cert) =>
      cert.id === id ? { ...cert, ...newEntry } : cert
    );
    onChange(updated);
    setNewEntry(emptyEntry);
    setEditingId(null);
  };

  const handleDelete = (id: string) => {
    onChange(certifications.filter((cert) => cert.id !== id));
  };

  const startEdit = (cert: Certification) => {
    setNewEntry({
      name: cert.name,
      issuer: cert.issuer,
      date: cert.date,
      url: cert.url || '',
    });
    setEditingId(cert.id);
    setIsAdding(false);
  };

  const cancelEdit = () => {
    setNewEntry(emptyEntry);
    setEditingId(null);
    setIsAdding(false);
  };

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h3 className="text-lg font-medium text-gray-900">Certifications</h3>
        {!isAdding && !editingId && (
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
        {certifications.map((cert) => (
          <Card key={cert.id} className="p-4">
            {editingId === cert.id ? (
              <div className="space-y-3">
                <Input
                  label="Certification Name"
                  value={newEntry.name}
                  onChange={(e: React.ChangeEvent<HTMLInputElement>) =>
                    setNewEntry({ ...newEntry, name: e.target.value })
                  }
                  placeholder="e.g., AWS Solutions Architect"
                  required
                />
                <Input
                  label="Issuing Organization"
                  value={newEntry.issuer}
                  onChange={(e: React.ChangeEvent<HTMLInputElement>) =>
                    setNewEntry({ ...newEntry, issuer: e.target.value })
                  }
                  placeholder="e.g., Amazon Web Services"
                  required
                />
                <Input
                  label="Issue Date"
                  type="month"
                  value={newEntry.date}
                  onChange={(e: React.ChangeEvent<HTMLInputElement>) =>
                    setNewEntry({ ...newEntry, date: e.target.value })
                  }
                />
                <Input
                  label="Credential URL (optional)"
                  type="url"
                  value={newEntry.url}
                  onChange={(e: React.ChangeEvent<HTMLInputElement>) =>
                    setNewEntry({ ...newEntry, url: e.target.value })
                  }
                  placeholder="https://..."
                />
                <div className="flex space-x-2">
                  <Button
                    type="button"
                    onClick={() => handleUpdate(cert.id)}
                    disabled={!newEntry.name.trim() || !newEntry.issuer.trim()}
                  >
                    Save
                  </Button>
                  <Button
                    type="button"
                    onClick={cancelEdit}
                    variant="secondary"
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
                      onClick={() => startEdit(cert)}
                      variant="secondary"
                      size="sm"
                    >
                      Edit
                    </Button>
                    <Button
                      type="button"
                      onClick={() => handleDelete(cert.id)}
                      variant="danger"
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
          <h4 className="font-medium text-gray-900 mb-4">New Certification</h4>
          <div className="space-y-3">
            <Input
              label="Certification Name"
              value={newEntry.name}
              onChange={(e: React.ChangeEvent<HTMLInputElement>) =>
                setNewEntry({ ...newEntry, name: e.target.value })
              }
              placeholder="e.g., AWS Solutions Architect"
              required
            />
            <Input
              label="Issuing Organization"
              value={newEntry.issuer}
              onChange={(e: React.ChangeEvent<HTMLInputElement>) =>
                setNewEntry({ ...newEntry, issuer: e.target.value })
              }
              placeholder="e.g., Amazon Web Services"
              required
            />
            <Input
              label="Issue Date"
              type="month"
              value={newEntry.date}
              onChange={(e: React.ChangeEvent<HTMLInputElement>) =>
                setNewEntry({ ...newEntry, date: e.target.value })
              }
            />
            <Input
              label="Credential URL (optional)"
              type="url"
              value={newEntry.url}
              onChange={(e: React.ChangeEvent<HTMLInputElement>) =>
                setNewEntry({ ...newEntry, url: e.target.value })
              }
              placeholder="https://..."
            />
            <div className="flex space-x-2">
              <Button
                type="button"
                onClick={handleAdd}
                disabled={!newEntry.name.trim() || !newEntry.issuer.trim()}
              >
                Add Certification
              </Button>
              <Button
                type="button"
                onClick={cancelEdit}
                variant="secondary"
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
