import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Save, Edit2, Check, X, Share2 } from "lucide-react";
import { useState } from "react";
import { toast } from "sonner";

interface EditorHeaderProps {
    displayName: string;
    isDirty: boolean;
    isSaving: boolean;
    lastSavedAt: Date | null;
    onSave: () => Promise<void>;
    onDisplayNameChange?: (name: string) => Promise<void>;
    onTogglePublic?: () => Promise<void>;
    onShareClick?: () => void;
}

export function EditorHeader({
    displayName,
    isDirty,
    isSaving,
    lastSavedAt,
    onSave,
    onDisplayNameChange,
    onTogglePublic,
    onShareClick,
}: Readonly<EditorHeaderProps>) {
    const [isEditingName, setIsEditingName] = useState(false);
    const [localDisplayName, setLocalDisplayName] = useState("");

    const startEditing = () => {
        setLocalDisplayName(displayName || "");
        setIsEditingName(true);
    };

    const cancelEditing = () => {
        setIsEditingName(false);
        setLocalDisplayName("");
    };

    const handleSaveDisplayName = async () => {
        if (!localDisplayName.trim()) {
            toast.error("Name cannot be empty");
            return;
        }

        if (onDisplayNameChange) {
            await onDisplayNameChange(localDisplayName);
            setIsEditingName(false);
        }
    };

    return (
        <div className="flex items-center justify-between bg-background px-6 py-3">
            <div className="flex items-center gap-3">
                {isEditingName ? (
                    <div className="flex items-center gap-2">
                        <Input
                            value={localDisplayName}
                            onChange={(e) => setLocalDisplayName(e.target.value)}
                            onKeyDown={(e) => {
                                if (e.key === "Enter") handleSaveDisplayName();
                                if (e.key === "Escape") cancelEditing();
                            }}
                            className="text-lg font-semibold h-8"
                            autoFocus
                        />
                        <Button size="sm" variant="ghost" onClick={handleSaveDisplayName}>
                            <Check className="h-4 w-4" />
                        </Button>
                        <Button size="sm" variant="ghost" onClick={cancelEditing}>
                            <X className="h-4 w-4" />
                        </Button>
                    </div>
                ) : (
                    <div className="flex items-center gap-2">
                        <h2 className="text-lg font-semibold">
                            {displayName || "Untitled"}
                        </h2>
                        {onDisplayNameChange && (
                            <Button
                                size="sm"
                                variant="ghost"
                                onClick={startEditing}
                                className="h-6 w-6 p-0"
                            >
                                <Edit2 className="h-3 w-3" />
                            </Button>
                        )}
                    </div>
                )}
                {isDirty && (
                    <span className="text-xs text-muted-foreground">(Unsaved changes)</span>
                )}
            </div>

            <div className="flex items-center gap-2">
                {onTogglePublic && (
                    <Button
                        variant="outline"
                        size="sm"
                        onClick={onShareClick}
                    >
                        <Share2 className="h-4 w-4 mr-2" />
                        Share
                    </Button>
                )}

                {lastSavedAt && (
                    <span className="text-xs text-muted-foreground mr-2">
                        Saved {lastSavedAt.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                    </span>
                )}

                <Button
                    size="sm"
                    onClick={onSave}
                    disabled={isSaving || !isDirty}
                >
                    <Save className="h-4 w-4 mr-2" />
                    {isSaving ? "Saving..." : "Save"}
                </Button>
            </div>
        </div>
    );
}
