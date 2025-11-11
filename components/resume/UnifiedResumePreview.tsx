/**
 * Unified Resume Preview Component
 * Provides consistent preview experience across all pages with template selection
 */

'use client';

import { useState, useEffect } from 'react';
import { PreviewTemplateSelector } from '@/components/templates/PreviewTemplateSelector';
import { useTemplatePreview } from '@/lib/hooks/useTemplatePreview';
import type { Resume } from '@/lib/validations/jsonresume';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { RefreshCw, Download } from 'lucide-react';
import { toast } from 'sonner';

interface UnifiedResumePreviewProps {
  /** Resume data to preview */
  resumeData: Resume;
  /** Optional resume ID for fetching data */
  resumeId?: string;
  /** Optional callback when template changes */
  onTemplateChange?: (templateId: string | null) => void;
  /** Show template selector */
  showTemplateSelector?: boolean;
  /** Show card wrapper */
  showCard?: boolean;
  /** Preview key for forcing refresh */
  previewKey?: number;
  /** Custom class name */
  className?: string;
}

export function UnifiedResumePreview({
  resumeData,
  resumeId,
  onTemplateChange,
  showTemplateSelector = true,
  showCard = true,
  previewKey = 0,
  className = '',
}: UnifiedResumePreviewProps) {
  const [selectedTemplateId, setSelectedTemplateId] = useState<string | null>(null);
  const [resume, setResume] = useState<Resume>(resumeData);
  const [localPreviewKey, setLocalPreviewKey] = useState(previewKey);
  const [isExportingPDF, setIsExportingPDF] = useState(false);

  // Fetch resume data if resumeId is provided
  useEffect(() => {
    if (resumeId) {
      const fetchResume = async () => {
        try {
          const response = await fetch(`/api/resumes/${resumeId}`);
          if (response.ok) {
            const data = await response.json();
            setResume(data.content as Resume);
          }
        } catch (error) {
          console.error('Error fetching resume:', error);
        }
      };
      fetchResume();
    }
  }, [resumeId, localPreviewKey]);

  // Update resume when resumeData prop changes
  useEffect(() => {
    setResume(resumeData);
  }, [resumeData]);

  // Update preview key when prop changes
  useEffect(() => {
    setLocalPreviewKey(previewKey);
  }, [previewKey]);

  // Hook for template preview rendering
  const { htmlContent, isLoading, error } = useTemplatePreview({
    templateId: selectedTemplateId,
    resumeData: resume,
  });

  const handleTemplateChange = (templateId: string | null) => {
    setSelectedTemplateId(templateId);
    if (onTemplateChange) {
      onTemplateChange(templateId);
    }
  };

  const handleRefresh = () => {
    setLocalPreviewKey(prev => prev + 1);
  };

  const handleExportPDF = async () => {
    if (!resumeId) {
      toast.error('Resume ID is required to export PDF');
      return;
    }

    try {
      setIsExportingPDF(true);

      const response = await fetch(`/api/resumes/${resumeId}/export`, {
        method: 'POST',
      });

      if (!response.ok) {
        throw new Error('Failed to export PDF');
      }

      const blob = await response.blob();
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `resume-${resumeId}.pdf`;
      document.body.appendChild(a);
      a.click();
      window.URL.revokeObjectURL(url);
      document.body.removeChild(a);
      
      toast.success('PDF exported successfully');
    } catch (err) {
      toast.error(err instanceof Error ? err.message : 'Failed to export PDF');
    } finally {
      setIsExportingPDF(false);
    }
  };

  const PreviewContent = () => (
    <>
      {/* Header with Template Selector */}
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-2">
          {showTemplateSelector && (
            <PreviewTemplateSelector
              selectedTemplateId={selectedTemplateId}
              onTemplateChange={handleTemplateChange}
              variant="outline"
              size="sm"
            />
          )}
        </div>
        <div className="flex items-center gap-2">
          {resumeId && (
            <Button
              variant="outline"
              size="sm"
              onClick={handleExportPDF}
              disabled={isExportingPDF}
            >
              <Download className="h-4 w-4 mr-2" />
              {isExportingPDF ? 'Exporting...' : 'Download PDF'}
            </Button>
          )}
          <Button
            variant="ghost"
            size="sm"
            onClick={handleRefresh}
          >
            <RefreshCw className="h-4 w-4 mr-2" />
            Refresh
          </Button>
        </div>
      </div>

      {/* Preview Area */}
      {selectedTemplateId ? (
        // Template-based preview
        <div className="bg-white rounded-lg shadow-lg overflow-hidden">
          {isLoading ? (
            <div className="p-8 text-center text-muted-foreground">
              Loading template...
            </div>
          ) : error ? (
            <div className="p-8 text-center text-destructive">
              {error}
            </div>
          ) : htmlContent ? (
            <iframe
              srcDoc={htmlContent}
              className="w-full h-[1000px] border-0"
              title="Template Preview"
              sandbox="allow-same-origin"
            />
          ) : (
            <div className="p-8 text-center text-muted-foreground">
              No preview available
            </div>
          )}
        </div>
      ) : (
        // Default simple preview
        <div className="bg-white rounded-lg shadow-lg p-8">
          <div className="space-y-6">
            {resume.basics && (
              <div className="border-b pb-4">
                <h1 className="text-3xl font-bold mb-2">{resume.basics.name || 'Your Name'}</h1>
                <p className="text-muted-foreground">
                  {resume.basics.email && <span>{resume.basics.email}</span>}
                  {resume.basics.phone && <span> | {resume.basics.phone}</span>}
                  {resume.basics.location?.city && <span> | {resume.basics.location.city}</span>}
                </p>
              </div>
            )}

            {resume.basics?.summary && (
              <div>
                <h2 className="text-xl font-bold mb-2">Professional Summary</h2>
                <p className="text-sm">{resume.basics.summary}</p>
              </div>
            )}

            {resume.work && resume.work.length > 0 && (
              <div>
                <h2 className="text-xl font-bold mb-3">Work Experience</h2>
                <div className="space-y-4">
                  {resume.work.map((job, idx) => (
                    <div key={idx} className="border-l-2 border-muted pl-4">
                      <h3 className="font-semibold">{job.position}</h3>
                      <p className="text-sm text-muted-foreground">{job.name}</p>
                      <p className="text-xs text-muted-foreground">
                        {job.startDate} - {job.endDate || 'Present'}
                      </p>
                      {job.highlights && job.highlights.length > 0 && (
                        <ul className="list-disc list-inside mt-2 text-sm">
                          {job.highlights.map((highlight, hIdx) => (
                            <li key={hIdx}>{highlight}</li>
                          ))}
                        </ul>
                      )}
                    </div>
                  ))}
                </div>
              </div>
            )}

            {resume.education && resume.education.length > 0 && (
              <div>
                <h2 className="text-xl font-bold mb-3">Education</h2>
                <div className="space-y-3">
                  {resume.education.map((edu, idx) => (
                    <div key={idx}>
                      <h3 className="font-semibold">{edu.studyType} in {edu.area}</h3>
                      <p className="text-sm text-muted-foreground">{edu.institution}</p>
                      <p className="text-xs text-muted-foreground">
                        {edu.startDate} - {edu.endDate || 'Present'}
                      </p>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {resume.skills && resume.skills.length > 0 && (
              <div>
                <h2 className="text-xl font-bold mb-3">Skills</h2>
                <div className="flex flex-wrap gap-2">
                  {resume.skills.map((skill, idx) => (
                    <span
                      key={idx}
                      className="px-3 py-1 bg-muted rounded-full text-sm"
                    >
                      {skill.name}
                    </span>
                  ))}
                </div>
              </div>
            )}
          </div>
        </div>
      )}
    </>
  );

  if (showCard) {
    return (
      <Card className={className}>
        <CardHeader>
          <CardTitle>Live Preview</CardTitle>
          <CardDescription>See how your resume looks with different templates</CardDescription>
        </CardHeader>
        <CardContent>
          <PreviewContent />
        </CardContent>
      </Card>
    );
  }

  return (
    <div className={className}>
      <PreviewContent />
    </div>
  );
}
