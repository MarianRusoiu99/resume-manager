"use client";

import { useState, useRef } from "react";
import { Button } from "@/components/ui/button";
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogHeader,
    DialogTitle,
} from "@/components/ui/dialog";
import { Textarea } from "@/components/ui/textarea";
import { FileText, Image, FileType, ClipboardPaste, Upload, ChevronDown } from "lucide-react";
import { toast } from "sonner";
import { resumeSchema } from "@/lib/validations/jsonresume";
import type { Resume } from "@/lib/validations/jsonresume";

interface ResumeImportButtonProps {
    onImportSuccess: (resume: Resume) => void;
}

export function ResumeImportButton({ onImportSuccess }: ResumeImportButtonProps) {
    const [isUploading, setIsUploading] = useState(false);
    const [showJsonDialog, setShowJsonDialog] = useState(false);
    const [jsonText, setJsonText] = useState("");
    const fileInputRef = useRef<HTMLInputElement>(null);
    const [currentFileType, setCurrentFileType] = useState<string>("");

    const handleFileSelect = (acceptedTypes: string, fileType: string) => {
        setCurrentFileType(fileType);
        if (fileInputRef.current) {
            fileInputRef.current.accept = acceptedTypes;
            fileInputRef.current.click();
        }
    };

    const handleFileChange = async (event: React.ChangeEvent<HTMLInputElement>) => {
        const file = event.target.files?.[0];
        if (!file) return;

        // Validate file size (max 10MB)
        if (file.size > 10 * 1024 * 1024) {
            toast.error("File size must be less than 10MB");
            return;
        }

        setIsUploading(true);
        const formData = new FormData();
        formData.append("file", file);
        formData.append("fileType", currentFileType);

        try {
            const response = await fetch("/api/resume/import", {
                method: "POST",
                body: formData,
            });

            if (!response.ok) {
                const error = await response.json();
                throw new Error(error.error || "Failed to import resume");
            }

            const data = await response.json();

            // Validate the extracted resume data
            const validation = resumeSchema.safeParse(data.resume);
            console.log("Validation result:", validation);
            if (!validation.success) {
                console.error("Validation errors:", validation.error.issues);
                toast.error("Extracted data doesn't match resume schema. Please try again or use JSON paste.");
                return;
            }

            onImportSuccess(validation.data);
            toast.success(`Resume imported successfully from ${currentFileType.toUpperCase()}!`);
        } catch (error) {
            console.error("Import error:", error);
            toast.error(error instanceof Error ? error.message : "Failed to import resume");
        } finally {
            setIsUploading(false);
            // Reset file input
            if (fileInputRef.current) {
                fileInputRef.current.value = "";
            }
        }
    };

    const handleJsonPaste = async () => {
        if (!jsonText.trim()) {
            toast.error("Please paste JSON content");
            return;
        }

        try {
            const parsedData = JSON.parse(jsonText);
            const validation = resumeSchema.safeParse(parsedData);

            if (!validation.success) {
                console.error("Validation errors:", validation.error.issues);
                const firstError = validation.error.issues[0];
                const errorMessage = firstError
                    ? `Invalid field: ${firstError.path.join(".")} - ${firstError.message}`
                    : "JSON doesn't match Resume schema.";
                toast.error(errorMessage);
                return;
            }

            onImportSuccess(validation.data);
            toast.success("Resume imported successfully from JSON!");
            setShowJsonDialog(false);
            setJsonText("");
        } catch (error) {
            toast.error("Invalid JSON format. Please check your input.");
        }
    };

    const handlePasteFromClipboard = async () => {
        try {
            const clipboardText = await navigator.clipboard.readText();
            setJsonText(clipboardText);
            setShowJsonDialog(true);
        } catch (error) {
            // If clipboard access fails, just open the dialog
            setShowJsonDialog(true);
            toast.info("Please paste your JSON Resume manually");
        }
    };

    return (
        <>
            <DropdownMenu>
                <DropdownMenuTrigger asChild>
                    <Button variant="outline" disabled={isUploading}>
                        {isUploading ? (
                            <>
                                <Upload className="h-4 w-4 mr-2 animate-spin" />
                                Importing...
                            </>
                        ) : (
                            <>
                                <Upload className="h-4 w-4 mr-2" />
                                Import Resume
                                <ChevronDown className="h-4 w-4 ml-2" />
                            </>
                        )}
                    </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end" className="w-56">
                    <DropdownMenuItem onClick={() => handleFileSelect(".pdf", "pdf")}>
                        <FileText className="h-4 w-4 mr-2" />
                        Import from PDF
                    </DropdownMenuItem>
                    <DropdownMenuItem onClick={() => handleFileSelect(".png,.jpg,.jpeg", "image")}>
                        <Image className="h-4 w-4 mr-2" />
                        Import from Image
                    </DropdownMenuItem>
                    <DropdownMenuItem onClick={() => handleFileSelect(".doc,.docx", "word")}>
                        <FileType className="h-4 w-4 mr-2" />
                        Import from Word
                    </DropdownMenuItem>
                    <DropdownMenuItem onClick={handlePasteFromClipboard}>
                        <ClipboardPaste className="h-4 w-4 mr-2" />
                        Paste JSON Resume
                    </DropdownMenuItem>
                </DropdownMenuContent>
            </DropdownMenu>

            {/* Hidden file input */}
            <input
                ref={fileInputRef}
                type="file"
                className="hidden"
                onChange={handleFileChange}
            />

            {/* JSON Paste Dialog */}
            <Dialog open={showJsonDialog} onOpenChange={setShowJsonDialog}>
                <DialogContent className="sm:max-w-[600px]">
                    <DialogHeader>
                        <DialogTitle>Paste JSON Resume</DialogTitle>
                        <DialogDescription>
                            Paste your resume in{" "}
                            <a
                                href="https://jsonresume.org/schema/"
                                target="_blank"
                                rel="noopener noreferrer"
                                className="text-primary underline"
                            >
                                JSON Resume format
                            </a>
                        </DialogDescription>
                    </DialogHeader>
                    <div className="space-y-4">
                        <Textarea
                            value={jsonText}
                            onChange={(e) => setJsonText(e.target.value)}
                            placeholder='{"basics": {"name": "John Doe", ...}}'
                            className="min-h-[300px] font-mono text-sm"
                        />
                        <div className="flex justify-end gap-2">
                            <Button variant="outline" onClick={() => setShowJsonDialog(false)}>
                                Cancel
                            </Button>
                            <Button onClick={handleJsonPaste}>Import</Button>
                        </div>
                    </div>
                </DialogContent>
            </Dialog>
        </>
    );
}
