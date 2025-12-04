"use client";

import { useEffect } from "react";
import { Tabs } from "@/components/ui/tabs";
import { useEditor } from "@/lib/contexts";
import { EditorSidebar } from "./EditorSidebar";
import { ProfileEditorContent } from "./ProfileEditorContent";

export interface EditorUIProps {
    /** Show resume parser (only for profile editing) */
    showParser?: boolean;
    /** Custom parser component */
    parserComponent?: React.ReactNode;
}

/**
 * Unified Editor UI Component
 * 
 * Renders all resume editing sections using the editor context.
 * Can be used for both profile and individual resume editing.
 */
export function EditorUI({ showParser, parserComponent }: Readonly<EditorUIProps>) {
    const { isDirty } = useEditor();

    // Warn user about unsaved changes when navigating away
    useEffect(() => {
        const handleBeforeUnload = (e: BeforeUnloadEvent) => {
            if (isDirty) {
                e.preventDefault();
            }
        };

        window.addEventListener('beforeunload', handleBeforeUnload);
        return () => window.removeEventListener('beforeunload', handleBeforeUnload);
    }, [isDirty]);

    return (
        <Tabs defaultValue="basics" className="w-full">
            <EditorSidebar />
            <ProfileEditorContent showParser={showParser} parserComponent={parserComponent} />
        </Tabs>
    );
}

