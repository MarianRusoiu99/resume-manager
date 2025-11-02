"use client";

import { useState, useCallback } from "react";
import { Upload, FileText, AlertCircle, CheckCircle2, Loader2 } from "lucide-react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Label } from "@/components/ui/label";
import { Progress } from "@/components/ui/progress";
import { parseResume, type ParserResult, type ParserOptions } from "@/lib/services/resume-parser.service";
import type { Resume } from "@/lib/validations/jsonresume";

interface ResumeParserProps {
  onParsed: (resume: Resume, tokensUsed?: number) => void;
  existingResume?: Resume;
  model?: string;
}

type ParsingState = "idle" | "uploading" | "extracting" | "parsing" | "success" | "error";

export function ResumeParser({ onParsed, existingResume, model = "gpt-4o-mini" }: ResumeParserProps) {
  const [state, setState] = useState<ParsingState>("idle");
  const [progress, setProgress] = useState(0);
  const [error, setError] = useState<string | null>(null);
  const [result, setResult] = useState<ParserResult | null>(null);
  const [mergeStrategy, setMergeStrategy] = useState<"preserve" | "overwrite">("preserve");
  const [isDragging, setIsDragging] = useState(false);

  const resetState = () => {
    setState("idle");
    setProgress(0);
    setError(null);
    setResult(null);
  };

  const handleFileSelect = useCallback(async (file: File) => {
    resetState();
    setState("uploading");
    setProgress(10);

    try {
      // Extract text
      setState("extracting");
      setProgress(30);

      // Parse with AI
      setState("parsing");
      setProgress(60);

      const options: ParserOptions = {
        model,
        overwrite: mergeStrategy === "overwrite",
        existingResume,
      };

      const parserResult = await parseResume(file, options);

      if (!parserResult.success || !parserResult.resume) {
        throw new Error(parserResult.error || "Failed to parse resume");
      }

      setProgress(100);
      setState("success");
      setResult(parserResult);
    } catch (err) {
      console.error("Resume parsing failed:", err);
      setState("error");
      setError(err instanceof Error ? err.message : "Failed to parse resume");
    }
  }, [existingResume, mergeStrategy, model]);

  const handleFileInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      handleFileSelect(file);
    }
  };

  const handleDragOver = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(true);
  }, []);

  const handleDragLeave = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
  }, []);

  const handleDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);

    const file = e.dataTransfer.files[0];
    if (file) {
      handleFileSelect(file);
    }
  }, [handleFileSelect]);

  const handleApply = () => {
    if (result?.resume) {
      onParsed(result.resume, result.tokensUsed);
      resetState();
    }
  };

  const getProgressMessage = () => {
    switch (state) {
      case "uploading":
        return "Uploading file...";
      case "extracting":
        return "Extracting text from document...";
      case "parsing":
        return "Analyzing resume with AI...";
      case "success":
        return "Resume parsed successfully!";
      default:
        return "";
    }
  };

  return (
    <Card className="border-2 border-dashed">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Upload className="h-5 w-5" />
          Import Resume
        </CardTitle>
        <CardDescription>
          Upload your existing resume (PDF, DOCX, or TXT) to automatically fill your profile.
          <br />
          <span className="text-xs text-muted-foreground mt-1 block">
            Note: Requires an OpenAI API key configured in Settings. If you haven&apos;t added one yet, you&apos;ll be prompted when uploading.
          </span>
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Merge Strategy Selection */}
        {state === "idle" && (
          <div className="space-y-3">
            <Label>How should we handle existing data?</Label>
            <RadioGroup
              value={mergeStrategy}
              onValueChange={(value) => setMergeStrategy(value as "preserve" | "overwrite")}
            >
              <div className="flex items-center space-x-2">
                <RadioGroupItem value="preserve" id="preserve" />
                <Label htmlFor="preserve" className="font-normal cursor-pointer">
                  Fill empty fields only (preserve existing data)
                </Label>
              </div>
              <div className="flex items-center space-x-2">
                <RadioGroupItem value="overwrite" id="overwrite" />
                <Label htmlFor="overwrite" className="font-normal cursor-pointer">
                  Replace all data (overwrite existing)
                </Label>
              </div>
            </RadioGroup>
          </div>
        )}

        {/* File Upload Area */}
        {state === "idle" && (
          <div
            onDragOver={handleDragOver}
            onDragLeave={handleDragLeave}
            onDrop={handleDrop}
            className={`
              relative border-2 border-dashed rounded-lg p-8 text-center transition-colors
              ${isDragging ? "border-primary bg-primary/5" : "border-muted-foreground/25"}
              hover:border-primary hover:bg-primary/5 cursor-pointer
            `}
          >
            <input
              type="file"
              accept=".pdf,.docx,.txt"
              onChange={handleFileInputChange}
              className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
            />
            <FileText className="mx-auto h-12 w-12 text-muted-foreground mb-4" />
            <p className="text-sm font-medium mb-1">
              Drop your resume here or click to browse
            </p>
            <p className="text-xs text-muted-foreground">
              Supports PDF, DOCX, and TXT files (max 10MB)
            </p>
          </div>
        )}

        {/* Progress Indicator */}
        {["uploading", "extracting", "parsing"].includes(state) && (
          <div className="space-y-3">
            <div className="flex items-center gap-3">
              <Loader2 className="h-5 w-5 animate-spin text-primary" />
              <p className="text-sm font-medium">{getProgressMessage()}</p>
            </div>
            <Progress value={progress} className="h-2" />
          </div>
        )}

        {/* Success State */}
        {state === "success" && result?.resume && (
          <Alert className="border-green-500/50 bg-green-50 dark:bg-green-950/20">
            <CheckCircle2 className="h-4 w-4 text-green-600 dark:text-green-400" />
            <AlertDescription className="ml-2">
              <p className="font-medium text-green-900 dark:text-green-100">
                Resume parsed successfully!
              </p>
              <p className="text-sm text-green-700 dark:text-green-300 mt-1">
                {result.tokensUsed ? `Used ${result.tokensUsed.toLocaleString()} tokens. ` : ""}
                Click &quot;Apply Data&quot; to fill your profile.
              </p>
            </AlertDescription>
          </Alert>
        )}

        {/* Error State */}
        {state === "error" && error && (
          <Alert variant="destructive">
            <AlertCircle className="h-4 w-4" />
            <AlertDescription className="ml-2">
              <p className="font-medium">Failed to parse resume</p>
              <p className="text-sm mt-1">{error}</p>
            </AlertDescription>
          </Alert>
        )}

        {/* Action Buttons */}
        <div className="flex gap-2 justify-end">
          {state === "success" && (
            <>
              <Button variant="outline" onClick={resetState}>
                Try Another File
              </Button>
              <Button onClick={handleApply}>
                Apply Data
              </Button>
            </>
          )}
          {state === "error" && (
            <Button variant="outline" onClick={resetState}>
              Try Again
            </Button>
          )}
        </div>
      </CardContent>
    </Card>
  );
}
