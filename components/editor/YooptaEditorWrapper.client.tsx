'use client';

import YooptaEditor, { createYooptaEditor, YooptaContentValue } from '@yoopta/editor';
import { useMemo, forwardRef, useImperativeHandle, useState } from 'react';

// Plugins
import Paragraph from '@yoopta/paragraph';
import Blockquote from '@yoopta/blockquote';
import { HeadingOne, HeadingTwo, HeadingThree } from '@yoopta/headings';
import { NumberedList, BulletedList, TodoList } from '@yoopta/lists';

// Marks
import { Bold, Italic, CodeMark, Underline, Strike, Highlight } from '@yoopta/marks';

// Tools
import LinkTool, { DefaultLinkToolRender } from '@yoopta/link-tool';
import ActionMenu, { DefaultActionMenuRender } from '@yoopta/action-menu-list';
import Toolbar, { DefaultToolbarRender } from '@yoopta/toolbar';

// Exports for markdown conversion
import { markdown } from '@yoopta/exports';

// Import custom Yoopta styles
import './yoopta-editor.css';

// Define plugins outside component for stability
const PLUGINS = [
  Paragraph,
  HeadingOne,
  HeadingTwo,
  HeadingThree,
  Blockquote,
  NumberedList,
  BulletedList,
  TodoList,
];

// Define marks outside component
const MARKS = [Bold, Italic, CodeMark, Underline, Strike, Highlight];

// Define tools outside component
const TOOLS = {
  Toolbar: {
    tool: Toolbar,
    render: DefaultToolbarRender,
  },
  ActionMenu: {
    tool: ActionMenu,
    render: DefaultActionMenuRender,
  },
  LinkTool: {
    tool: LinkTool,
    render: DefaultLinkToolRender,
  },
};

export interface YooptaEditorMethods {
  getMarkdown: () => string;
  setMarkdown: (markdownString: string) => void;
  getValue: () => YooptaContentValue;
  setValue: (value: YooptaContentValue) => void;
  getJSON: () => string; // Add JSON export
  setJSON: (jsonString: string) => void; // Add JSON import
}

interface YooptaEditorWrapperProps {
  markdown?: string;
  jsonContent?: string; // Add JSON content prop for better formatting preservation
  onChange?: (value: string) => void;
  onJSONChange?: (value: string) => void; // Add JSON change callback
  className?: string;
  placeholder?: string;
  readOnly?: boolean;
}

export const YooptaEditorWrapper = forwardRef<YooptaEditorMethods, YooptaEditorWrapperProps>(
  ({ markdown: initialMarkdown, jsonContent, onChange, onJSONChange, className = '', placeholder = 'Type text...', readOnly = false }, ref) => {
    const editor = useMemo(() => createYooptaEditor(), []);
    
    // Compute initial value - prefer JSON over markdown for better formatting preservation
    const initialValue = useMemo(() => {
      console.log('[YooptaEditor] Computing initialValue:', { 
        hasMarkdown: !!initialMarkdown,
        hasJSON: !!jsonContent,
        markdownLength: initialMarkdown?.length,
        jsonLength: jsonContent?.length
      });
      
      // Try JSON first (preserves formatting perfectly)
      if (jsonContent && editor) {
        try {
          const parsed = JSON.parse(jsonContent);
          console.log('[YooptaEditor] Loaded from JSON:', Object.keys(parsed).length, 'blocks');
          return parsed;
        } catch (error) {
          console.error('Failed to parse JSON content:', error);
        }
      }
      
      // Fallback to markdown
      if (initialMarkdown && editor) {
        try {
          // Use Yoopta's markdown deserializer
          const deserialized = markdown.deserialize(editor, initialMarkdown);
          console.log('[YooptaEditor] Deserialized content:', deserialized);
          
          // If deserialization returns empty object or nothing, create basic content
          if (!deserialized || Object.keys(deserialized).length === 0) {
            console.warn('[YooptaEditor] Markdown deserializer returned empty, creating basic content');
            // Fallback: create simple paragraph structure
            const lines = initialMarkdown.trim().split('\n\n').filter(Boolean);
            const content: YooptaContentValue = {};
            
            lines.forEach((line, index) => {
              const id = `paragraph-${index}`;
              content[id] = {
                id,
                type: 'Paragraph',
                value: [{
                  id: `${id}-text`,
                  type: 'paragraph',
                  children: [{
                    text: line.trim()
                  }],
                  props: {
                    nodeType: 'block'
                  }
                }],
                meta: {
                  order: index,
                  depth: 0
                }
              };
            });
            return content;
          }
          
          return deserialized;
        } catch (error) {
          console.error('Failed to deserialize markdown:', error);
          return undefined;
        }
      }
      console.log('[YooptaEditor] No content to process');
      return undefined;
    }, [initialMarkdown, jsonContent, editor]);

    const [value, setValue] = useState<YooptaContentValue | undefined>(initialValue);

    // Expose imperative methods via ref
    useImperativeHandle(ref, () => ({
      getMarkdown: () => {
        try {
          const value = editor.getEditorValue();
          return markdown.serialize(editor, value);
        } catch (error) {
          console.error('Failed to serialize markdown:', error);
          return '';
        }
      },
      setMarkdown: (markdownString: string) => {
        try {
          const content = markdown.deserialize(editor, markdownString);
          editor.setEditorValue(content);
        } catch (error) {
          console.error('Failed to set markdown:', error);
        }
      },
      getValue: () => {
        return editor.getEditorValue();
      },
      setValue: (value: YooptaContentValue) => {
        editor.setEditorValue(value);
      },
      getJSON: () => {
        try {
          const value = editor.getEditorValue();
          return JSON.stringify(value);
        } catch (error) {
          console.error('Failed to serialize JSON:', error);
          return '{}';
        }
      },
      setJSON: (jsonString: string) => {
        try {
          const content = JSON.parse(jsonString);
          editor.setEditorValue(content);
          setValue(content);
        } catch (error) {
          console.error('Failed to parse JSON:', error);
        }
      },
    }));

    const handleChange = (newValue: YooptaContentValue) => {
      setValue(newValue);
      
      // Call markdown onChange if provided
      if (onChange) {
        try {
          const markdownString = markdown.serialize(editor, newValue);
          onChange(markdownString);
        } catch (error) {
          console.error('Failed to serialize on change:', error);
        }
      }
      
      // Call JSON onChange if provided (preserves formatting better)
      if (onJSONChange) {
        try {
          const jsonString = JSON.stringify(newValue);
          onJSONChange(jsonString);
        } catch (error) {
          console.error('Failed to serialize JSON on change:', error);
        }
      }
    };

    return (
      <div className={`yoopta-editor`}>
        <YooptaEditor
          editor={editor}
          plugins={PLUGINS}
          className={className}
          marks={MARKS}
          tools={TOOLS}
          placeholder={placeholder}
          value={value}
          onChange={handleChange}
          readOnly={readOnly}
          autoFocus={!readOnly}
          
          style={{ width: '100%', paddingBottom: '20px', minHeight: '200px', color: 'var(--yoopta-foreground)', backgroundColor: 'var(--yoopta-background)' }}
        />
      </div>
    );
  }
);

YooptaEditorWrapper.displayName = 'YooptaEditorWrapper';
