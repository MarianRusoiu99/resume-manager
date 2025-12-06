'use client';

/**
 * Template Import Modal Component
 * Allows users to upload template images for AI extraction
 */

import { useState, useCallback } from 'react';
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
import { Upload, Image, Loader2, AlertCircle, CheckCircle } from 'lucide-react';
import { toast } from 'sonner';

interface ExtractedTemplate {
    htmlTemplate: string;
    cssStyles: string;
    name?: string;
    category?: string;
    description?: string;
}

interface TemplateImportModalProps {
    open: boolean;
    onOpenChange: (open: boolean) => void;
    onImportComplete: (template: ExtractedTemplate) => void;
}

type ImportStatus = 'idle' | 'uploading' | 'processing' | 'success' | 'error';

export function TemplateImportModal({
    open,
    onOpenChange,
    onImportComplete,
}: TemplateImportModalProps) {
    const [status, setStatus] = useState<ImportStatus>('idle');
    const [progress, setProgress] = useState(0);
    const [error, setError] = useState<string | null>(null);
    const [selectedFile, setSelectedFile] = useState<File | null>(null);
    const [preview, setPreview] = useState<string | null>(null);

    const resetState = () => {
        setStatus('idle');
        setProgress(0);
        setError(null);
        setSelectedFile(null);
        setPreview(null);
    };

    const handleClose = () => {
        if (status !== 'uploading' && status !== 'processing') {
            resetState();
            onOpenChange(false);
        }
    };

    const onDrop = useCallback((acceptedFiles: File[]) => {
        const file = acceptedFiles[0];
        if (file) {
            setSelectedFile(file);
            setError(null);

            // Create preview
            const reader = new FileReader();
            reader.onload = () => {
                setPreview(reader.result as string);
            };
            reader.readAsDataURL(file);
        }
    }, []);

    const { getRootProps, getInputProps, isDragActive } = useDropzone({
        onDrop,
        accept: {
            'image/png': ['.png'],
            'image/jpeg': ['.jpg', '.jpeg'],
            'image/webp': ['.webp'],
            'image/gif': ['.gif'],
        },
        maxFiles: 1,
        maxSize: 10 * 1024 * 1024, // 10MB
        disabled: status === 'uploading' || status === 'processing',
    });

    const handleImport = async () => {
        if (!selectedFile) return;

        try {
            setStatus('uploading');
            setProgress(20);
            setError(null);

            const formData = new FormData();
            formData.append('file', selectedFile);

            setStatus('processing');
            setProgress(40);

            // Simulate progress during AI processing
            const progressInterval = setInterval(() => {
                setProgress((prev) => Math.min(prev + 10, 90));
            }, 1000);

            const response = await fetch('/api/template/import', {
                method: 'POST',
                body: formData,
            });

            clearInterval(progressInterval);

            if (!response.ok) {
                const errorData = await response.json();
                throw new Error(errorData.error || 'Failed to import template');
            }

            const data = await response.json();

            setProgress(100);
            setStatus('success');

            toast.success('Template extracted successfully!');

            // Wait a moment to show success state
            setTimeout(() => {
                onImportComplete(data.template);
                handleClose();
            }, 500);
        } catch (err) {
            setStatus('error');
            const errorMessage = err instanceof Error ? err.message : 'Failed to import template';
            setError(errorMessage);
            toast.error(errorMessage);
        }
    };

    return (
        <Dialog open={open} onOpenChange={handleClose}>
            <DialogContent className="sm:max-w-lg">
                <DialogHeader>
                    <DialogTitle className="flex items-center gap-2">
                        <Image className="h-5 w-5" />
                        Import Template from Image
                    </DialogTitle>
                    <DialogDescription>
                        Upload a screenshot or image of a resume template. Our AI will analyze
                        the layout and generate a matching Handlebars template.
                    </DialogDescription>
                </DialogHeader>

                <div className="space-y-4">
                    {/* Dropzone */}
                    {!preview && status === 'idle' && (
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
                                    ? 'Drop the image here...'
                                    : 'Drag & drop a template image, or click to browse'}
                            </p>
                            <p className="text-xs text-muted-foreground mt-2">
                                PNG, JPEG, WebP, GIF up to 10MB
                            </p>
                        </div>
                    )}

                    {/* Preview */}
                    {preview && status !== 'success' && (
                        <div className="space-y-4">
                            <div className="relative rounded-lg overflow-hidden border bg-muted/20">
                                {/* eslint-disable-next-line @next/next/no-img-element */}
                                <img
                                    src={preview}
                                    alt="Template preview"
                                    className="w-full h-48 object-contain"
                                />
                                {status === 'idle' && (
                                    <button
                                        onClick={(e) => {
                                            e.stopPropagation();
                                            setSelectedFile(null);
                                            setPreview(null);
                                        }}
                                        className="absolute top-2 right-2 p-1 bg-background/80 rounded-full hover:bg-background"
                                    >
                                        <AlertCircle className="h-4 w-4" />
                                    </button>
                                )}
                            </div>

                            {selectedFile && (
                                <p className="text-sm text-muted-foreground text-center">
                                    {selectedFile.name} ({(selectedFile.size / 1024).toFixed(1)} KB)
                                </p>
                            )}
                        </div>
                    )}

                    {/* Progress */}
                    {(status === 'uploading' || status === 'processing') && (
                        <div className="space-y-3">
                            <Progress value={progress} className="h-2" />
                            <div className="flex items-center justify-center gap-2 text-sm text-muted-foreground">
                                <Loader2 className="h-4 w-4 animate-spin" />
                                {status === 'uploading' && 'Uploading image...'}
                                {status === 'processing' && 'AI is analyzing the template...'}
                            </div>
                        </div>
                    )}

                    {/* Success */}
                    {status === 'success' && (
                        <div className="flex items-center justify-center gap-2 text-sm text-green-600">
                            <CheckCircle className="h-5 w-5" />
                            Template extracted successfully!
                        </div>
                    )}

                    {/* Error */}
                    {status === 'error' && error && (
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
                            disabled={status === 'uploading' || status === 'processing'}
                        >
                            Cancel
                        </Button>
                        {status === 'idle' && selectedFile && (
                            <Button onClick={handleImport}>
                                <Image className="mr-2 h-4 w-4" />
                                Extract Template
                            </Button>
                        )}
                        {status === 'error' && (
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
