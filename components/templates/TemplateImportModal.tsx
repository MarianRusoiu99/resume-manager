'use client';

/**
 * Refactored Template Import Modal Component
 * Uses the new useTemplateGeneration hook for AI extraction.
 */

import React, { useState, useCallback, useRef, useEffect } from 'react';
import NextImage from 'next/image';
import { useDropzone } from 'react-dropzone';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Progress } from '@/components/ui/progress';
import { Upload, Image as ImageIcon, Loader2, AlertCircle, CheckCircle } from 'lucide-react';
import { toast } from 'sonner';
import { useTemplateGeneration } from '../ai-enhance/hooks/useTemplateGeneration';
import type { ExtractedTemplate } from '@/lib/ai/template-parser';

interface TemplateImportModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onImportComplete: (template: ExtractedTemplate) => void;
}

export function TemplateImportModal({
  open,
  onOpenChange,
  onImportComplete,
}: Readonly<TemplateImportModalProps>) {
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [preview, setPreview] = useState<string | null>(null);
  const [progress, setProgress] = useState(0);
  const progressIntervalRef = useRef<NodeJS.Timeout | null>(null);

  const { generate, template, isLoading, error, reset } = useTemplateGeneration();

  // Handle completion
  useEffect(() => {
    if (template) {
      setProgress(100);
      if (progressIntervalRef.current) {
        clearInterval(progressIntervalRef.current);
      }
      
      toast.success('Template extracted successfully!');
      
      const timer = setTimeout(() => {
        onImportComplete(template);
        handleClose();
      }, 800);
      
      return () => clearTimeout(timer);
    }
  }, [template, onImportComplete]);

  // Handle errors
  useEffect(() => {
    if (error) {
      if (progressIntervalRef.current) {
        clearInterval(progressIntervalRef.current);
      }
      setProgress(0);
    }
  }, [error]);

  const handleClose = useCallback(() => {
    if (!isLoading) {
      reset();
      setSelectedFile(null);
      setPreview(null);
      setProgress(0);
      if (progressIntervalRef.current) {
        clearInterval(progressIntervalRef.current);
      }
      onOpenChange(false);
    }
  }, [isLoading, onOpenChange, reset]);

  const onDrop = useCallback((acceptedFiles: File[]) => {
    const file = acceptedFiles[0];
    if (file) {
      setSelectedFile(file);
      
      // Create preview
      if (file.type.startsWith('image/')) {
        const reader = new FileReader();
        reader.onload = () => {
          setPreview(reader.result as string);
        };
        reader.readAsDataURL(file);
      } else if (file.type === 'application/pdf') {
        // Use a placeholder for PDF preview for now
        setPreview('pdf-placeholder');
      }
    }
  }, []);

  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    onDrop,
    accept: {
      'image/png': ['.png'],
      'image/jpeg': ['.jpg', '.jpeg'],
      'image/webp': ['.webp'],
      'image/gif': ['.gif'],
      'application/pdf': ['.pdf'],
    },
    maxFiles: 1,
    maxSize: 10 * 1024 * 1024, // 10MB
    disabled: isLoading,
  });

  const handleImport = async () => {
    if (!selectedFile) return;

    setProgress(10);
    
    // Start progress simulation
    progressIntervalRef.current = setInterval(() => {
      setProgress((prev) => {
        if (prev >= 90) return 90;
        return prev + 5;
      });
    }, 1500);

    await generate(selectedFile);
  };

  return (
    <Dialog open={open} onOpenChange={handleClose}>
      <DialogContent className="sm:max-w-lg">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <ImageIcon className="h-5 w-5" />
            Import Template
          </DialogTitle>
          <DialogDescription>
            Upload a screenshot, image, or PDF of a resume template. Our AI will analyze
            the layout and generate a matching Handlebars template.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4">
          {/* Dropzone */}
          {!preview && !isLoading && (
            <div
              {...getRootProps()}
              className={`
                border-2 border-dashed rounded-lg p-8 text-center cursor-pointer
                transition-colors duration-200
                ${isDragActive
                  ? 'border-primary bg-primary/5'
                  : 'border-muted-foreground/25 hover:border-primary/50'
                }
              `}
            >
              <input {...getInputProps()} />
              <Upload className="h-10 w-10 mx-auto mb-4 text-muted-foreground" />
              <p className="text-sm text-muted-foreground">
                {isDragActive
                  ? 'Drop the file here...'
                  : 'Drag & drop a template file, or click to browse'}
              </p>
              <p className="text-xs text-muted-foreground mt-2">
                PNG, JPEG, WebP, GIF or PDF up to 10MB
              </p>
            </div>
          )}

          {/* Preview */}
          {preview && (
            <div className="space-y-4">
              <div className="relative rounded-lg overflow-hidden border bg-muted/20 min-h-[12rem] flex items-center justify-center">
                {preview === 'pdf-placeholder' ? (
                  <div className="flex flex-col items-center gap-2 text-muted-foreground">
                    <Upload className="h-12 w-12" />
                    <p className="text-sm font-medium">PDF Document Selected</p>
                  </div>
                ) : (
                  <NextImage
                    src={preview}
                    alt="Template preview"
                    width={800}
                    height={192}
                    className="w-full h-48 object-contain"
                    unoptimized
                  />
                )}
                {!isLoading && (
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      setSelectedFile(null);
                      setPreview(null);
                    }}
                    className="absolute top-2 right-2 p-1 bg-background/80 rounded-full hover:bg-background"
                    title="Clear selected file"
                  >
                    <AlertCircle className="h-4 w-4" />
                  </button>
                )}
              </div>

              {selectedFile && !isLoading && (
                <p className="text-sm text-muted-foreground text-center">
                  {selectedFile.name} ({(selectedFile.size / 1024).toFixed(1)} KB)
                </p>
              )}
            </div>
          )}

          {/* Progress */}
          {isLoading && (
            <div className="space-y-3">
              <Progress value={progress} className="h-2" />
              <div className="flex items-center justify-center gap-2 text-sm text-muted-foreground">
                <Loader2 className="h-4 w-4 animate-spin" />
                AI is analyzing the template...
              </div>
            </div>
          )}

          {/* Success */}
          {template && (
            <div className="flex items-center justify-center gap-2 text-sm text-green-600">
              <CheckCircle className="h-5 w-5" />
              Template extracted successfully!
            </div>
          )}

          {/* Error */}
          {error && (
            <div className="flex items-center gap-2 p-3 rounded-lg bg-destructive/10 text-destructive text-sm">
              <AlertCircle className="h-5 w-5 flex-shrink-0" />
              <span>{error}</span>
            </div>
          )}

          {/* Actions */}
          <div className="flex justify-end gap-2 pt-2">
            <Button
              variant="outline"
              onClick={handleClose}
              disabled={isLoading}
            >
              Cancel
            </Button>
            {!isLoading && selectedFile && !template && (
              <Button onClick={handleImport}>
                <ImageIcon className="mr-2 h-4 w-4" />
                Extract Template
              </Button>
            )}
            {error && !isLoading && (
              <Button onClick={handleImport}>
                Try Again
              </Button>
            )}
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
