'use client';

import { forwardRef, useImperativeHandle, memo } from 'react';
import { useEditor, EditorContent, type Content, type JSONContent } from '@tiptap/react';
import StarterKit from '@tiptap/starter-kit';
import Placeholder from '@tiptap/extension-placeholder';
import Underline from '@tiptap/extension-underline';
import Link from '@tiptap/extension-link';
import TextAlign from '@tiptap/extension-text-align';
import { Table } from '@tiptap/extension-table';
import { TableRow } from '@tiptap/extension-table-row';
import { TableCell } from '@tiptap/extension-table-cell';
import { TableHeader } from '@tiptap/extension-table-header';
import { TaskList } from '@tiptap/extension-task-list';
import { TaskItem } from '@tiptap/extension-task-item';
import { useComponentLogger } from "@/hooks";
import { generateHTML } from '@tiptap/html';

export interface TiptapEditorMethods {
  getMarkdown: () => Promise<string>;
  setMarkdown: (markdownString: string) => Promise<void>;
  getValue: () => JSONContent | undefined;
  setValue: (content: Content) => void;
  getJSON: () => string;
  setJSON: (jsonString: string) => void;
  getHTML: () => Promise<string>;
}

interface TiptapEditorWrapperProps {
  markdown?: string;
  jsonContent?: string;
  onChange?: (value: string) => void;
  onJSONChange?: (value: string) => void;
  className?: string;
  placeholder?: string;
  readOnly?: boolean;
}

const TiptapEditorWrapperComponent = forwardRef<TiptapEditorMethods, TiptapEditorWrapperProps>(
  ({ markdown, jsonContent, onChange, onJSONChange, className = '', placeholder = 'Start typing...', readOnly = false }, ref) => {
    const log = useComponentLogger('TiptapEditorWrapper');

    const editor = useEditor({
      extensions: [
        StarterKit,
        Underline,
        TextAlign.configure({
          types: ['heading', 'paragraph'],
        }),
        Link.configure({
          openOnClick: false,
        }),
        Placeholder.configure({
          placeholder,
        }),
        Table.configure({
          resizable: true,
        }),
        TableRow,
        TableHeader,
        TableCell,
        TaskList,
        TaskItem.configure({
          nested: true,
        }),
      ],
      content: jsonContent ? JSON.parse(jsonContent) : (markdown || ''),
      editable: !readOnly,
      onUpdate: ({ editor }) => {
        if (onJSONChange) {
          onJSONChange(JSON.stringify(editor.getJSON()));
        }
        if (onChange) {
          onChange(editor.getHTML());
        }
      },
      immediatelyRender: false,
    });

    useImperativeHandle(ref, () => ({
      getMarkdown: async () => {
        return editor?.getHTML() || '';
      },
      setMarkdown: async (content: string) => {
        editor?.commands.setContent(content);
      },
      getValue: () => {
        return editor?.getJSON();
      },
      setValue: (content: Content) => {
        editor?.commands.setContent(content);
      },
      getJSON: () => {
        return JSON.stringify(editor?.getJSON() || {});
      },
      setJSON: (jsonString: string) => {
        try {
          editor?.commands.setContent(JSON.parse(jsonString));
        } catch (e) {
          log.error('Failed to parse JSON', e);
        }
      },
      getHTML: async () => {
        return editor?.getHTML() || '';
      },
    }), [editor, log]);

    if (!editor) {
      return null;
    }

    return (
      <div className={className}>
        <EditorContent editor={editor} />
      </div>
    );
  }
);

TiptapEditorWrapperComponent.displayName = 'TiptapEditorWrapper';

export const TiptapEditorWrapper = memo(TiptapEditorWrapperComponent);
