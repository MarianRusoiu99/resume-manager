/**
 * VersionHistory Component
 * Displays version history comparing AI-generated content with edited content
 */

'use client';

import { useState } from 'react';
import { Button } from '@/components/ui/Button';
import { Card } from '@/components/ui/Card';

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
    expiryDate?: string;
  }>;
  languages?: Array<{
    language: string;
    proficiency: string;
  }>;
}

interface VersionHistoryProps {
  currentContent: ResumeContent;
  aiGeneratedContent: ResumeContent;
  onClose: () => void;
  onRestore: () => void;
}

export function VersionHistory({
  currentContent,
  aiGeneratedContent,
  onClose,
  onRestore,
}: VersionHistoryProps) {
  const [selectedVersion, setSelectedVersion] = useState<'current' | 'ai'>('current');
  
  const displayContent = selectedVersion === 'current' ? currentContent : aiGeneratedContent;
  
  // Check if content has been edited
  const isEdited = JSON.stringify(currentContent) !== JSON.stringify(aiGeneratedContent);

  const formatDate = (dateString: string | null) => {
    if (!dateString) return 'Present';
    const date = new Date(dateString);
    return date.toLocaleDateString('en-US', {
      month: 'short',
      year: 'numeric'
    });
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-lg shadow-xl max-w-5xl w-full max-h-[90vh] overflow-hidden flex flex-col">
        {/* Header */}
        <div className="px-6 py-4 border-b border-gray-200 flex justify-between items-center">
          <div>
            <h2 className="text-2xl font-bold">Version History</h2>
            <p className="text-sm text-gray-600 mt-1">
              {isEdited ? 'Compare original AI-generated content with your edits' : 'No edits made yet'}
            </p>
          </div>
          <Button variant="ghost" onClick={onClose}>
            ✕
          </Button>
        </div>

        {/* Version Tabs */}
        <div className="px-6 py-3 border-b border-gray-200 flex gap-4">
          <button
            onClick={() => setSelectedVersion('current')}
            className={`px-4 py-2 rounded-lg font-medium transition-colors ${
              selectedVersion === 'current'
                ? 'bg-blue-100 text-blue-700'
                : 'text-gray-600 hover:bg-gray-100'
            }`}
          >
            Current Version
            {isEdited && <span className="ml-2 text-xs">(Edited)</span>}
          </button>
          <button
            onClick={() => setSelectedVersion('ai')}
            className={`px-4 py-2 rounded-lg font-medium transition-colors ${
              selectedVersion === 'ai'
                ? 'bg-blue-100 text-blue-700'
                : 'text-gray-600 hover:bg-gray-100'
            }`}
          >
            AI-Generated Version
          </button>
        </div>

        {/* Content Display */}
        <div className="flex-1 overflow-y-auto px-6 py-4">
          <div className="space-y-6">
            {/* Summary */}
            <Card className="p-4">
              <h3 className="text-lg font-semibold mb-3">Professional Summary</h3>
              <p className="text-gray-700 leading-relaxed">{displayContent.summary}</p>
            </Card>

            {/* Experience */}
            <Card className="p-4">
              <h3 className="text-lg font-semibold mb-4">Experience</h3>
              <div className="space-y-4">
                {displayContent.experience.map((exp, index) => (
                  <div key={index} className="border-b border-gray-200 last:border-0 pb-4 last:pb-0">
                    <div className="flex justify-between items-start mb-2">
                      <div>
                        <h4 className="font-semibold text-gray-900">{exp.position}</h4>
                        <p className="text-gray-600">{exp.company}</p>
                      </div>
                      <span className="text-sm text-gray-500">
                        {formatDate(exp.startDate)} - {formatDate(exp.endDate)}
                      </span>
                    </div>
                    <p className="text-gray-700 mb-2">{exp.description}</p>
                    <ul className="list-disc list-inside space-y-1">
                      {exp.bulletPoints.map((point, idx) => (
                        <li key={idx} className="text-gray-700">{point}</li>
                      ))}
                    </ul>
                  </div>
                ))}
              </div>
            </Card>

            {/* Education */}
            <Card className="p-4">
              <h3 className="text-lg font-semibold mb-4">Education</h3>
              <div className="space-y-3">
                {displayContent.education.map((edu, index) => (
                  <div key={index} className="border-b border-gray-200 last:border-0 pb-3 last:pb-0">
                    <div className="flex justify-between items-start">
                      <div>
                        <h4 className="font-semibold text-gray-900">{edu.degree} in {edu.field}</h4>
                        <p className="text-gray-600">{edu.institution}</p>
                        {edu.gpa && <p className="text-sm text-gray-500">GPA: {edu.gpa}</p>}
                      </div>
                      <span className="text-sm text-gray-500">
                        {formatDate(edu.startDate)} - {formatDate(edu.endDate)}
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            </Card>

            {/* Skills */}
            {displayContent.skills && (displayContent.skills.technical?.length || displayContent.skills.soft?.length) && (
              <Card className="p-4">
                <h3 className="text-lg font-semibold mb-4">Skills</h3>
                <div className="space-y-3">
                  {displayContent.skills.technical && displayContent.skills.technical.length > 0 && (
                    <div>
                      <h4 className="font-medium text-gray-900 mb-2">Technical Skills</h4>
                      <div className="flex flex-wrap gap-2">
                        {displayContent.skills.technical.map((skill, index) => (
                          <span
                            key={index}
                            className="px-3 py-1 bg-blue-100 text-blue-700 rounded-full text-sm"
                          >
                            {skill}
                          </span>
                        ))}
                      </div>
                    </div>
                  )}
                  {displayContent.skills.soft && displayContent.skills.soft.length > 0 && (
                    <div>
                      <h4 className="font-medium text-gray-900 mb-2">Soft Skills</h4>
                      <div className="flex flex-wrap gap-2">
                        {displayContent.skills.soft.map((skill, index) => (
                          <span
                            key={index}
                            className="px-3 py-1 bg-green-100 text-green-700 rounded-full text-sm"
                          >
                            {skill}
                          </span>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              </Card>
            )}

            {/* Certifications (if any) */}
            {displayContent.certifications && displayContent.certifications.length > 0 && (
              <Card className="p-4">
                <h3 className="text-lg font-semibold mb-3">Certifications</h3>
                <div className="space-y-2">
                  {displayContent.certifications.map((cert, index) => (
                    <div key={index} className="flex justify-between items-start">
                      <div>
                        <h4 className="font-medium text-gray-900">{cert.name}</h4>
                        <p className="text-sm text-gray-600">{cert.issuer}</p>
                      </div>
                      <span className="text-sm text-gray-500">
                        {cert.date}
                        {cert.expiryDate && ` - ${cert.expiryDate}`}
                      </span>
                    </div>
                  ))}
                </div>
              </Card>
            )}

            {/* Languages (if any) */}
            {displayContent.languages && displayContent.languages.length > 0 && (
              <Card className="p-4">
                <h3 className="text-lg font-semibold mb-3">Languages</h3>
                <div className="flex flex-wrap gap-3">
                  {displayContent.languages.map((lang, index) => (
                    <div key={index} className="text-gray-700">
                      <span className="font-medium">{lang.language}</span>
                      <span className="text-gray-500 ml-2">({lang.proficiency})</span>
                    </div>
                  ))}
                </div>
              </Card>
            )}
          </div>
        </div>

        {/* Footer Actions */}
        <div className="px-6 py-4 border-t border-gray-200 flex justify-between items-center">
          <div className="text-sm text-gray-600">
            {selectedVersion === 'ai' && isEdited && (
              <span>This is the original AI-generated version</span>
            )}
          </div>
          <div className="flex gap-3">
            {selectedVersion === 'ai' && isEdited && (
              <Button variant="secondary" onClick={onRestore}>
                Restore This Version
              </Button>
            )}
            <Button onClick={onClose}>Close</Button>
          </div>
        </div>
      </div>
    </div>
  );
}
