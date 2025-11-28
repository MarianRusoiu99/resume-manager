'use client';

import { useEffect, forwardRef, useImperativeHandle, useRef, useState } from 'react';
import { Block, PartialBlock } from '@blocknote/core';
import { useCreateBlockNote } from '@blocknote/react';
import { BlockNoteView } from '@blocknote/mantine';
import '@blocknote/mantine/style.css';
import '@blocknote/core/fonts/inter.css';

export interface BlockNoteEditorMethods {
  getMarkdown: () => Promise<string>;
  setMarkdown: (markdownString: string) => Promise<void>;
  getValue: () => Block[];
  setValue: (blocks: Block[]) => void;
  getJSON: () => string;
  setJSON: (jsonString: string) => void;
  getHTML: () => Promise<string>;
}

interface BlockNoteEditorWrapperProps {
  markdown?: string;
  jsonContent?: string;
  onChange?: (value: string) => void;
  onJSONChange?: (value: string) => void;
  className?: string;
  placeholder?: string;
  readOnly?: boolean;
}

export const BlockNoteEditorWrapper = forwardRef<BlockNoteEditorMethods, BlockNoteEditorWrapperProps>(
  ({ markdown: initialMarkdown, jsonContent, onChange, onJSONChange, className = '', placeholder = 'Type / for commands...', readOnly = false }, ref) => {
    
    // Track if initial content has been loaded to prevent re-initialization
    const hasInitialized = useRef(false);
    const [initialBlocks, setInitialBlocks] = useState<PartialBlock[] | undefined>(undefined);
    
    // Parse initial content only once
    useEffect(() => {
      if (hasInitialized.current) return;
      
      const parseInitialContent = async () => {
        // Try JSON first (preserves formatting perfectly)
        if (jsonContent) {
          try {
            const parsed = JSON.parse(jsonContent);
            console.log('[BlockNote] Loaded from JSON:', parsed.length, 'blocks');
            setInitialBlocks(parsed);
            hasInitialized.current = true;
            return;
          } catch (error) {
            console.error('[BlockNote] Failed to parse JSON content:', error);
          }
        }
        
        // We'll let BlockNote parse markdown in a separate effect
        hasInitialized.current = true;
      };
      
      parseInitialContent();
    }, [jsonContent]);

    // Create BlockNote editor instance with initial blocks
    const editor = useCreateBlockNote({
      initialContent: initialBlocks,
      uploadFile: async () => {
        // Disable file uploads for now
        return '';
      },
    });

    // Parse markdown if provided (ONLY ONCE after editor is ready)
    const hasLoadedMarkdown = useRef(false);
    useEffect(() => {
      if (!editor || hasLoadedMarkdown.current || !initialMarkdown || jsonContent) {
        return;
      }
      
      hasLoadedMarkdown.current = true;
      
      (async () => {
        try {
          const blocks = await editor.tryParseMarkdownToBlocks(initialMarkdown);
          editor.replaceBlocks(editor.document, blocks);
          console.log('[BlockNote] Loaded from markdown:', blocks.length, 'blocks');
        } catch (error) {
          console.error('[BlockNote] Failed to parse markdown:', error);
        }
      })();
    }, [editor, initialMarkdown, jsonContent]);

    // Handle content changes - debounce to avoid excessive updates
    useEffect(() => {
      if (!editor) return;

      const handleChange = async () => {
        try {
          const blocks = editor.document;
          
          // Emit JSON change if callback exists
          if (onJSONChange) {
            const jsonString = JSON.stringify(blocks, null, 2);
            onJSONChange(jsonString);
          }
          
          // Emit markdown change if callback exists
          if (onChange) {
            const markdownString = await editor.blocksToMarkdownLossy(blocks);
            onChange(markdownString);
          }
        } catch (error) {
          console.error('[BlockNote] Failed to handle content change:', error);
        }
      };

      // Subscribe to editor changes
      return editor.onChange(handleChange);
    }, [editor, onChange, onJSONChange]);

    // Expose imperative methods via ref
    useImperativeHandle(ref, () => ({
      getMarkdown: async () => {
        try {
          const blocks = editor.document;
          return await editor.blocksToMarkdownLossy(blocks);
        } catch (error) {
          console.error('[BlockNote] Failed to serialize markdown:', error);
          return '';
        }
      },
      setMarkdown: async (markdownString: string) => {
        try {
          const blocks = await editor.tryParseMarkdownToBlocks(markdownString);
          editor.replaceBlocks(editor.document, blocks);
        } catch (error) {
          console.error('[BlockNote] Failed to parse markdown:', error);
        }
      },
      getValue: () => {
        return editor.document;
      },
      setValue: (blocks: Block[]) => {
        editor.replaceBlocks(editor.document, blocks);
      },
      getJSON: () => {
        try {
          const blocks = editor.document;
          return JSON.stringify(blocks, null, 2);
        } catch (error) {
          console.error('[BlockNote] Failed to serialize JSON:', error);
          return '[]';
        }
      },
      setJSON: (jsonString: string) => {
        try {
          const blocks = JSON.parse(jsonString) as Block[];
          editor.replaceBlocks(editor.document, blocks);
        } catch (error) {
          console.error('[BlockNote] Failed to parse JSON:', error);
        }
      },
      getHTML: async () => {
        try {
          const blocks = editor.document;
          return await editor.blocksToHTMLLossy(blocks);
        } catch (error) {
          console.error('[BlockNote] Failed to serialize HTML:', error);
          return '';
        }
      },
    }), [editor]);

    if (!editor) {
      return <div>Loading editor...</div>;
    }

    return (
      <div className={className}>
        <BlockNoteView 
          editor={editor} 
          editable={!readOnly}
          theme="light"
          data-placeholder={placeholder}
        />
      </div>
    );
  }
);

BlockNoteEditorWrapper.displayName = 'BlockNoteEditorWrapper';
