/**
 * Section Order Manager Component
 * Allows drag-and-drop reordering of resume sections
 */

'use client';

import { useState } from 'react';
import {
  DndContext,
  closestCenter,
  KeyboardSensor,
  PointerSensor,
  useSensor,
  useSensors,
  DragEndEvent,
} from '@dnd-kit/core';
import {
  arrayMove,
  SortableContext,
  sortableKeyboardCoordinates,
  verticalListSortingStrategy,
  useSortable,
} from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';
import { Button } from '@/components/ui';
import { toast } from 'sonner';

interface Section {
  id: string;
  label: string;
  icon?: string;
}

interface SectionOrderManagerProps {
  resumeId: string;
  initialOrder?: string[];
  onClose: () => void;
  onSave: () => void;
}

const DEFAULT_SECTIONS: Section[] = [
  { id: 'summary', label: 'Professional Summary', icon: '📝' },
  { id: 'experience', label: 'Work Experience', icon: '💼' },
  { id: 'education', label: 'Education', icon: '🎓' },
  { id: 'skills', label: 'Skills', icon: '⚡' },
  { id: 'certifications', label: 'Certifications', icon: '🏆' },
  { id: 'languages', label: 'Languages', icon: '🌐' },
];

function SortableSection({ section }: { section: Section }) {
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging,
  } = useSortable({ id: section.id });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    opacity: isDragging ? 0.5 : 1,
  };

  return (
    <div
      ref={setNodeRef}
      style={style}
      {...attributes}
      {...listeners}
      className="bg-white border rounded-lg p-4 cursor-move hover:bg-gray-50 flex items-center gap-3 shadow-sm"
    >
      <span className="text-2xl">{section.icon}</span>
      <div className="flex-1">
        <h4 className="font-medium">{section.label}</h4>
      </div>
      <div className="text-gray-400">
        <svg
          width="20"
          height="20"
          viewBox="0 0 20 20"
          fill="currentColor"
        >
          <circle cx="7" cy="5" r="1.5" />
          <circle cx="13" cy="5" r="1.5" />
          <circle cx="7" cy="10" r="1.5" />
          <circle cx="13" cy="10" r="1.5" />
          <circle cx="7" cy="15" r="1.5" />
          <circle cx="13" cy="15" r="1.5" />
        </svg>
      </div>
    </div>
  );
}

export function SectionOrderManager({
  resumeId,
  initialOrder,
  onClose,
  onSave,
}: SectionOrderManagerProps) {
  // Initialize section order
  const [sectionOrder, setSectionOrder] = useState<string[]>(() => {
    if (initialOrder && initialOrder.length > 0) {
      return initialOrder;
    }
    return DEFAULT_SECTIONS.map((s) => s.id);
  });

  const [isSaving, setIsSaving] = useState(false);

  // Get ordered sections
  const orderedSections = sectionOrder
    .map((id) => DEFAULT_SECTIONS.find((s) => s.id === id))
    .filter((s): s is Section => s !== undefined);

  // Setup sensors for drag and drop
  const sensors = useSensors(
    useSensor(PointerSensor),
    useSensor(KeyboardSensor, {
      coordinateGetter: sortableKeyboardCoordinates,
    })
  );

  // Handle drag end
  const handleDragEnd = (event: DragEndEvent) => {
    const { active, over } = event;

    if (over && active.id !== over.id) {
      setSectionOrder((items) => {
        const oldIndex = items.indexOf(active.id as string);
        const newIndex = items.indexOf(over.id as string);
        return arrayMove(items, oldIndex, newIndex);
      });
    }
  };

  // Reset to default order
  const handleReset = () => {
    setSectionOrder(DEFAULT_SECTIONS.map((s) => s.id));
    toast.success('Section order reset to default');
  };

  // Save section order
  const handleSave = async () => {
    setIsSaving(true);
    try {
      const response = await fetch(`/api/resumes/${resumeId}/section-order`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ sectionOrder }),
      });

      if (!response.ok) {
        throw new Error('Failed to save section order');
      }

      toast.success('Section order saved successfully');
      onSave();
      onClose();
    } catch (error) {
      console.error('Error saving section order:', error);
      toast.error('Failed to save section order. Please try again.');
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-lg max-w-2xl w-full max-h-[90vh] overflow-hidden flex flex-col">
        {/* Header */}
        <div className="border-b px-6 py-4 flex items-center justify-between shrink-0">
          <div>
            <h2 className="text-2xl font-bold">Reorder Resume Sections</h2>
            <p className="text-sm text-gray-600">
              Drag sections to change their order in your resume
            </p>
          </div>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-gray-600 text-2xl leading-none"
            aria-label="Close"
          >
            ×
          </button>
        </div>

        {/* Content */}
        <div className="flex-1 overflow-y-auto p-6">
          <DndContext
            sensors={sensors}
            collisionDetection={closestCenter}
            onDragEnd={handleDragEnd}
          >
            <SortableContext
              items={sectionOrder}
              strategy={verticalListSortingStrategy}
            >
              <div className="space-y-3">
                {orderedSections.map((section) => (
                  <SortableSection key={section.id} section={section} />
                ))}
              </div>
            </SortableContext>
          </DndContext>

          <div className="mt-6 p-4 bg-blue-50 rounded-lg">
            <p className="text-sm text-blue-800">
              <strong>Tip:</strong> Click and drag sections to reorder them. The
              new order will be applied to your resume PDF export.
            </p>
          </div>
        </div>

        {/* Footer */}
        <div className="border-t px-6 py-4 flex items-center justify-between shrink-0">
          <Button
            variant="secondary"
            onClick={handleReset}
            disabled={isSaving}
          >
            Reset to Default
          </Button>
          <div className="flex gap-3">
            <Button
              variant="secondary"
              onClick={onClose}
              disabled={isSaving}
            >
              Cancel
            </Button>
            <Button
              onClick={handleSave}
              disabled={isSaving}
            >
              {isSaving ? 'Saving...' : 'Save Order'}
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
}
