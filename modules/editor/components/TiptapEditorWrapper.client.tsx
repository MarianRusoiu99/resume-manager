'use client';

import { forwardRef, useImperativeHandle, memo, useEffect } from 'react';
import { useEditor, EditorContent, type Content, type JSONContent, type Editor } from '@tiptap/react';
import { BubbleMenu } from '@tiptap/react/menus';
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
import { 
  Bold, 
  Italic, 
  Underline as UnderlineIcon, 
  Strikethrough
} from 'lucide-react';
import ExtensionBubbleMenu from '@tiptap/extension-bubble-menu';
import { Markdown } from 'tiptap-markdown';

// Define the shape of our markdown storage
interface MarkdownStorage {
  getMarkdown: () => string;
}

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

// Helper to determine if we should show the bubble menu
const shouldShowBubbleMenu = (props: { editor: Editor }) => {
  const { state } = props.editor;
  const { selection } = state;
  const { empty } = selection;

  // Don't show if selection is empty
  if (empty) return false;

  // Don't show if we are in code block (optional)
  if (props.editor.isActive('codeBlock')) return false;

  return true;
};

const TiptapEditorWrapperComponent = forwardRef<TiptapEditorMethods, TiptapEditorWrapperProps>(
  ({ markdown, jsonContent, onChange, onJSONChange, className = '', placeholder = 'Start typing...', readOnly = false }, ref) => {
    const log = useComponentLogger('TiptapEditorWrapper');

    const editor = useEditor({
      extensions: [
        StarterKit,
        Underline,
        ExtensionBubbleMenu.configure({
           pluginKey: 'bubbleMenu',
           shouldShow: shouldShowBubbleMenu,
        }),
        TextAlign.configure({
          types: ['heading', 'paragraph'],
        }),
        Link.configure({
          openOnClick: false,
          HTMLAttributes: {
            class: 'text-primary underline cursor-pointer',
          },
        }),
        Placeholder.configure({
          placeholder,
          emptyEditorClass: 'is-editor-empty before:content-[attr(data-placeholder)] before:text-muted-foreground before:float-left before:pointer-events-none before:h-0',
        }),
        Table.configure({
          resizable: true,
          HTMLAttributes: {
            class: 'border-collapse table-auto w-full',
          },
        }),
        TableRow,
        TableHeader,
        TableCell,
        TaskList,
        TaskItem.configure({
          nested: true,
        }),
        Markdown.configure({
           html: false, // Don't render HTML tags
           transformPastedText: true,
           transformCopiedText: true,
        }),
      ],
      editorProps: {
        attributes: {
          class: 'focus:outline-none min-h-[100px] px-3 py-2 text-foreground [&_p]:text-foreground [&_li]:text-foreground [&_h1]:text-foreground [&_h2]:text-foreground [&_h3]:text-foreground [&_h4]:text-foreground [&_strong]:text-foreground [&_b]:text-foreground',
        },
      },
      content: jsonContent ? JSON.parse(jsonContent) : (markdown || ''),
      editable: !readOnly,
      onUpdate: ({ editor }) => {
        if (onJSONChange) {
          onJSONChange(JSON.stringify(editor.getJSON()));
        }
        if (onChange) {
           const storage = (editor.storage as { markdown?: MarkdownStorage }).markdown;
           const markdownOutput = storage?.getMarkdown() || editor.getHTML();
           onChange(markdownOutput);
        }
      },
      immediatelyRender: false,
    });

    useEffect(() => {
      if (editor && markdown !== undefined) {
         // Only update if content is different to avoid cursor jumps or loops
         const currentMarkdown = (editor.storage as { markdown?: MarkdownStorage }).markdown?.getMarkdown();
         if (currentMarkdown !== markdown) {
             editor.commands.setContent(markdown);
         }
      }
    }, [markdown, editor]);

    useImperativeHandle(ref, () => ({
      getMarkdown: async () => {
        const storage = (editor?.storage as { markdown?: MarkdownStorage } | undefined)?.markdown;
        return storage?.getMarkdown() || editor?.getHTML() || '';
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
      <div className={`relative w-full ${className}`}>
        {editor && !readOnly && (
          <BubbleMenu 
            editor={editor}
            shouldShow={shouldShowBubbleMenu}
            className="flex items-center gap-1 p-1 rounded-md border bg-popover text-popover-foreground shadow-md"
          >
            <button
              onClick={() => editor.chain().focus().toggleBold().run()}
              className={`p-1 rounded hover:bg-muted ${editor.isActive('bold') ? 'bg-muted text-foreground' : 'text-muted-foreground'}`}
              type="button"
            >
              <Bold className="h-4 w-4" />
            </button>
            <button
              onClick={() => editor.chain().focus().toggleItalic().run()}
              className={`p-1 rounded hover:bg-muted ${editor.isActive('italic') ? 'bg-muted text-foreground' : 'text-muted-foreground'}`}
              type="button"
            >
              <Italic className="h-4 w-4" />
            </button>
            <button
              onClick={() => editor.chain().focus().toggleUnderline().run()}
              className={`p-1 rounded hover:bg-muted ${editor.isActive('underline') ? 'bg-muted text-foreground' : 'text-muted-foreground'}`}
              type="button"
            >
              <UnderlineIcon className="h-4 w-4" />
            </button>
            <button
              onClick={() => editor.chain().focus().toggleStrike().run()}
              className={`p-1 rounded hover:bg-muted ${editor.isActive('strike') ? 'bg-muted text-foreground' : 'text-muted-foreground'}`}
              type="button"
            >
              <Strikethrough className="h-4 w-4" />
            </button>
          </BubbleMenu>
        )}

        <EditorContent editor={editor} />
      </div>
    );
  }
);

TiptapEditorWrapperComponent.displayName = 'TiptapEditorWrapper';

export const TiptapEditorWrapper = memo(TiptapEditorWrapperComponent);
