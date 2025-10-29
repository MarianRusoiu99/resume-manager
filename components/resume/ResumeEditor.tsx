/**
 * Resume Editor Component
 * Allows inline editing of resume content with section management
 * Keyboard shortcuts: Ctrl+S/Cmd+S to save, Esc to close
 */

'use client';

import { useState } from 'react';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { Textarea } from '@/components/ui/Textarea';
import { toast } from 'sonner';
import { useSaveShortcut, useEscapeKey } from '@/lib/hooks/useKeyboardShortcut';

interface ResumeContent {
  personalInfo: {
    name: string;
    email: string;
    phone?: string;
    location?: string;
    links?: string[];
  };
  summary: string;
  experience: Array<{
    company: string;
    position: string;
    startDate: string;
    endDate: string | null;
    description: string;
    bulletPoints: string[];
  }>;
  education: Array<{
    institution: string;
    degree: string;
    field: string;
    startDate: string;
    endDate: string | null;
    gpa?: string;
  }>;
  skills?: {
    technical?: string[];
    soft?: string[];
  };
  certifications?: Array<{
    name: string;
    issuer: string;
    date: string;
    credentialUrl?: string;
  }>;
  languages?: Array<{
    language: string;
    proficiency: string;
  }>;
}

interface ResumeEditorProps {
  resumeId: string;
  initialContent: ResumeContent;
  aiGeneratedContent: ResumeContent;
  onSave: () => void;
  onClose: () => void;
}

export function ResumeEditor({
  resumeId,
  initialContent,
  aiGeneratedContent,
  onSave,
  onClose,
}: ResumeEditorProps) {
  // Normalize content to ensure all required fields exist
  const normalizeContent = (content: ResumeContent): ResumeContent => {
    return {
      ...content,
      skills: {
        technical: content.skills?.technical || [],
        soft: content.skills?.soft || [],
      },
      personalInfo: {
        ...content.personalInfo,
        links: content.personalInfo?.links || [],
      },
    };
  };

  const [content, setContent] = useState<ResumeContent>(normalizeContent(initialContent));
  const [isSaving, setIsSaving] = useState(false);
  const [hasChanges, setHasChanges] = useState(false);

  // Update summary
  const updateSummary = (summary: string) => {
    setContent({ ...content, summary });
    setHasChanges(true);
  };

  // Update experience entry
  const updateExperience = (index: number, field: string, value: string | null) => {
    const newExperience = [...content.experience];
    newExperience[index] = { ...newExperience[index], [field]: value };
    setContent({ ...content, experience: newExperience });
    setHasChanges(true);
  };

  // Update experience bullet point
  const updateBulletPoint = (expIndex: number, bulletIndex: number, value: string) => {
    const newExperience = [...content.experience];
    const newBulletPoints = [...newExperience[expIndex].bulletPoints];
    newBulletPoints[bulletIndex] = value;
    newExperience[expIndex] = {
      ...newExperience[expIndex],
      bulletPoints: newBulletPoints,
    };
    setContent({ ...content, experience: newExperience });
    setHasChanges(true);
  };

  // Add bullet point
  const addBulletPoint = (expIndex: number) => {
    const newExperience = [...content.experience];
    newExperience[expIndex].bulletPoints.push('');
    setContent({ ...content, experience: newExperience });
    setHasChanges(true);
  };

  // Remove bullet point
  const removeBulletPoint = (expIndex: number, bulletIndex: number) => {
    const newExperience = [...content.experience];
    newExperience[expIndex].bulletPoints.splice(bulletIndex, 1);
    setContent({ ...content, experience: newExperience });
    setHasChanges(true);
  };

  // Update education entry
  const updateEducation = (index: number, field: string, value: string) => {
    const newEducation = [...content.education];
    newEducation[index] = { ...newEducation[index], [field]: value };
    setContent({ ...content, education: newEducation });
    setHasChanges(true);
  };

  // Update skills
  const updateSkills = (category: 'technical' | 'soft', value: string) => {
    const skills = value.split(',').map((s) => s.trim()).filter(Boolean);
    setContent({
      ...content,
      skills: { 
        technical: content.skills?.technical || [],
        soft: content.skills?.soft || [],
        [category]: skills 
      },
    });
    setHasChanges(true);
  };

  // Revert to AI version
  const revertToAI = () => {
    if (confirm('Are you sure you want to revert to the AI-generated version? All your changes will be lost.')) {
      setContent(aiGeneratedContent);
      setHasChanges(true);
      toast.success('Reverted to AI-generated version');
    }
  };

  // Keyboard shortcuts
  useSaveShortcut(() => {
    if (hasChanges && !isSaving) {
      handleSave();
    }
  });

  useEscapeKey(() => {
    if (!isSaving) {
      onClose();
    }
  });

  // Save changes
  const handleSave = async () => {
    setIsSaving(true);
    try {
      const response = await fetch(`/api/resumes/${resumeId}/content`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ content }),
      });

      if (!response.ok) {
        throw new Error('Failed to save changes');
      }

      toast.success('Resume updated successfully');
      setHasChanges(false);
      onSave();
    } catch (error) {
      console.error('Error saving resume:', error);
      toast.error('Failed to save changes. Please try again.');
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4 overflow-y-auto">
      <div className="bg-white rounded-lg max-w-5xl w-full max-h-[90vh] overflow-hidden flex flex-col">
        {/* Header */}
        <div className="border-b px-6 py-4 flex items-center justify-between shrink-0">
          <div>
            <h2 className="text-2xl font-bold">Edit Resume</h2>
            <p className="text-sm text-gray-600">
              Make changes to your resume content
            </p>
          </div>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-gray-600 text-2xl leading-none"
            aria-label="Close editor"
          >
            ×
          </button>
        </div>

        {/* Content */}
        <div className="flex-1 overflow-y-auto p-6 space-y-8">
          {/* Summary Section */}
          <section>
            <h3 className="text-lg font-semibold mb-3">Professional Summary</h3>
            <Textarea
              value={content.summary}
              onChange={(e) => updateSummary(e.target.value)}
              rows={4}
              className="w-full"
              placeholder="Brief professional summary..."
            />
          </section>

          {/* Experience Section */}
          <section>
            <h3 className="text-lg font-semibold mb-3">Professional Experience</h3>
            <div className="space-y-6">
              {content.experience.map((exp, expIndex) => (
                <div key={expIndex} className="border rounded-lg p-4 space-y-3">
                  <div className="grid grid-cols-2 gap-3">
                    <Input
                      label="Position"
                      value={exp.position}
                      onChange={(e) =>
                        updateExperience(expIndex, 'position', e.target.value)
                      }
                    />
                    <Input
                      label="Company"
                      value={exp.company}
                      onChange={(e) =>
                        updateExperience(expIndex, 'company', e.target.value)
                      }
                    />
                    <Input
                      label="Start Date"
                      value={exp.startDate}
                      onChange={(e) =>
                        updateExperience(expIndex, 'startDate', e.target.value)
                      }
                      placeholder="MM/YYYY"
                    />
                    <Input
                      label="End Date"
                      value={exp.endDate || 'Present'}
                      onChange={(e) =>
                        updateExperience(
                          expIndex,
                          'endDate',
                          e.target.value === 'Present' ? null : e.target.value
                        )
                      }
                      placeholder="MM/YYYY or Present"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Key Achievements
                    </label>
                    <div className="space-y-2">
                      {exp.bulletPoints.map((bullet, bulletIndex) => (
                        <div key={bulletIndex} className="flex gap-2">
                          <Input
                            value={bullet}
                            onChange={(e) =>
                              updateBulletPoint(expIndex, bulletIndex, e.target.value)
                            }
                            placeholder="Achievement or responsibility..."
                            className="flex-1"
                          />
                          <button
                            onClick={() => removeBulletPoint(expIndex, bulletIndex)}
                            className="px-3 py-2 text-red-600 hover:bg-red-50 rounded"
                            title="Remove"
                          >
                            ✕
                          </button>
                        </div>
                      ))}
                      <button
                        onClick={() => addBulletPoint(expIndex)}
                        className="text-sm text-blue-600 hover:text-blue-700"
                      >
                        + Add Achievement
                      </button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </section>

          {/* Education Section */}
          <section>
            <h3 className="text-lg font-semibold mb-3">Education</h3>
            <div className="space-y-4">
              {content.education.map((edu, eduIndex) => (
                <div key={eduIndex} className="border rounded-lg p-4 space-y-3">
                  <div className="grid grid-cols-2 gap-3">
                    <Input
                      label="Institution"
                      value={edu.institution}
                      onChange={(e) =>
                        updateEducation(eduIndex, 'institution', e.target.value)
                      }
                    />
                    <Input
                      label="Degree"
                      value={edu.degree}
                      onChange={(e) =>
                        updateEducation(eduIndex, 'degree', e.target.value)
                      }
                    />
                    <Input
                      label="Field of Study"
                      value={edu.field}
                      onChange={(e) =>
                        updateEducation(eduIndex, 'field', e.target.value)
                      }
                    />
                    <Input
                      label="GPA (optional)"
                      value={edu.gpa || ''}
                      onChange={(e) =>
                        updateEducation(eduIndex, 'gpa', e.target.value)
                      }
                      placeholder="e.g., 3.8/4.0"
                    />
                  </div>
                </div>
              ))}
            </div>
          </section>

          {/* Skills Section */}
          <section>
            <h3 className="text-lg font-semibold mb-3">Skills</h3>
            <div className="space-y-3">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Technical Skills
                </label>
                <Input
                  value={(content.skills?.technical || []).join(', ')}
                  onChange={(e) => updateSkills('technical', e.target.value)}
                  placeholder="Comma-separated skills..."
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Soft Skills
                </label>
                <Input
                  value={(content.skills?.soft || []).join(', ')}
                  onChange={(e) => updateSkills('soft', e.target.value)}
                  placeholder="Comma-separated skills..."
                />
              </div>
            </div>
          </section>
        </div>

        {/* Footer */}
        <div className="border-t px-6 py-4 flex justify-between shrink-0">
          <button
            onClick={revertToAI}
            className="px-4 py-2 text-gray-700 hover:bg-gray-100 rounded-md transition"
            disabled={isSaving}
          >
            Revert to AI Version
          </button>
          <div className="flex gap-3">
            <Button
              onClick={onClose}
              variant="secondary"
              disabled={isSaving}
            >
              Cancel
            </Button>
            <Button
              onClick={handleSave}
              disabled={isSaving || !hasChanges}
            >
              {isSaving ? 'Saving...' : 'Save Changes'}
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
}
