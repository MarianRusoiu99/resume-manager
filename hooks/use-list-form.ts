import { useState, useCallback } from "react";

export interface UseListFormProps<T> {
    initialItems?: T[];
    onChange: (items: T[]) => void;
    newItemTemplate: T;
}

export function useListForm<T>({
    initialItems = [],
    onChange,
    newItemTemplate,
}: UseListFormProps<T>) {
    // We rely on props for the source of truth (controlled component),
    // but we can keep a local version if needed for optimistic updates or just use the props directly.
    // Since the original code used `localExperiences` derived from props, we'll stick to that pattern
    // but actually, for a controlled component, we should just use the props.
    // However, to make it easy to use, we'll provide helpers that call onChange.

    const items = initialItems.length > 0 ? initialItems : [];

    const addItem = useCallback(() => {
        onChange([...items, newItemTemplate]);
    }, [items, newItemTemplate, onChange]);

    const removeItem = useCallback(
        (index: number) => {
            onChange(items.filter((_, i) => i !== index));
        },
        [items, onChange]
    );

    const updateItem = useCallback(
        (index: number, field: keyof T, value: any) => {
            const updated = items.map((item, i) => {
                if (i === index) {
                    return { ...item, [field]: value };
                }
                return item;
            });
            onChange(updated);
        },
        [items, onChange]
    );

    return {
        items,
        addItem,
        removeItem,
        updateItem,
    };
}
