import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { ReactNode } from "react";

interface FormListProps<T> {
    items: T[];
    onAdd: () => void;
    onRemove: (index: number) => void;
    renderItem: (item: T, index: number) => ReactNode;
    addButtonText?: string;
    emptyMessage?: string;
    className?: string;
    title?: string;
    description?: string;
}

export function FormList<T>({
    items,
    onAdd,
    onRemove,
    renderItem,
    addButtonText = "Add Item",
    emptyMessage = "No items yet. Click below to add one.",
    className,
    title,
    description,
}: FormListProps<T>) {
    return (
        <div className={cn("space-y-6", className)}>
            {title && (
                <div className="space-y-1">
                    <h3 className="text-lg font-medium">{title}</h3>
                    {description && (
                        <p className="text-sm text-muted-foreground">{description}</p>
                    )}
                </div>
            )}

            {items.map((item, index) => (
                <div
                    key={index}
                    className="p-4 border rounded-lg space-y-4 relative group bg-card text-card-foreground"
                >
                    <div className="absolute top-4 right-4">
                        <button
                            type="button"
                            onClick={() => onRemove(index)}
                            className="text-destructive hover:text-destructive/80 text-sm font-medium transition-colors"
                        >
                            Remove
                        </button>
                    </div>
                    {renderItem(item, index)}
                </div>
            ))}

            <Button type="button" variant="outline" onClick={onAdd} className="w-full sm:w-auto">
                + {addButtonText}
            </Button>

            {items.length === 0 && (
                <p className="text-sm text-muted-foreground text-center py-8 border-2 border-dashed rounded-lg">
                    {emptyMessage}
                </p>
            )}
        </div>
    );
}
