"use client";

import { useState } from "react";
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
import { FileText, ClipboardPaste, Upload, ChevronDown, Loader2 } from "lucide-react";
import { toast } from "sonner";
import { useToastAction } from "@/hooks/useToastAction";
import { resumeSchema } from "@/lib/validations/jsonresume";
import type { Resume } from "@/lib/validations/jsonresume";
import { createComponentLogger } from "@/lib/utils/client-logger";
import { ResumeImportModal } from "./ResumeImportModal";

interface ResumeImportButtonProps {
    onImportSuccess: (resume: Resume) => void;
}

export function ResumeImportButton({ onImportSuccess }: Readonly<ResumeImportButtonProps>) {
    const log = createComponentLogger("ResumeImportButton");
    const { runWithToast } = useToastAction();
    const [isUploading] = useState(false);
    const [showJsonDialog, setShowJsonDialog] = useState(false);
    const [showImportModal, setShowImportModal] = useState(false);
    const [jsonText, setJsonText] = useState("");

    const handleJsonPaste = async () => {

        if (!jsonText.trim()) {
            toast.error("Please paste JSON content");
            return;
        }

        const result = await runWithToast(
            async () => {
                const parsedData = JSON.parse(jsonText);
                const validation = resumeSchema.safeParse(parsedData);

                if (!validation.success) {
                    log.error("Validation errors", undefined, { issues: validation.error.issues });
                    const firstError = validation.error.issues[0];
                    const errorMessage = firstError
                        ? `Invalid field: ${firstError.path.join(".")} - ${firstError.message}`
                        : "JSON doesn't match Resume schema.";
                    throw new Error(errorMessage);
                }

                return validation.data;
            },
            {
                successMessage: 'Resume imported successfully from JSON!',
                errorMessage: 'Invalid JSON format. Please check your input.',
            }
        );

        if (result) {
            onImportSuccess(result);
            setShowJsonDialog(false);
            setJsonText("");
        }
    };

    const handlePasteFromClipboard = async () => {
        try {
            const clipboardText = await navigator.clipboard.readText();
            setJsonText(clipboardText);
        } catch (error) {
            log.debug("Clipboard access failed", { error });
            toast.info("Please paste your JSON Resume manually");
        } finally {
            setShowJsonDialog(true);
        }
    };

    return (
        <>
            <DropdownMenu>
                <DropdownMenuTrigger asChild>
                    <Button variant="outline" disabled={isUploading}>
                        {isUploading ? (
                            <>
                                <Loader2 className="h-4 w-4 mr-2 animate-spin" />
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
                    <DropdownMenuItem onClick={() => setShowImportModal(true)}>
                        <FileText className="h-4 w-4 mr-2" />
                        Import from Document
                    </DropdownMenuItem>
                    <DropdownMenuItem onClick={handlePasteFromClipboard}>
                        <ClipboardPaste className="h-4 w-4 mr-2" />
                        Paste JSON Resume
                    </DropdownMenuItem>
                </DropdownMenuContent>
            </DropdownMenu>

            <ResumeImportModal 
                open={showImportModal}
                onOpenChange={setShowImportModal}
                onImportComplete={onImportSuccess}
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
