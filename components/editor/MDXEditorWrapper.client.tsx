/**
 * MDXEditor Wrapper Component
 * Wraps MDXEditor with all necessary plugins and configuration
 */

'use client';

import {
  MDXEditor,
  headingsPlugin,
  listsPlugin,
  quotePlugin,
  thematicBreakPlugin,
  markdownShortcutPlugin,
  toolbarPlugin,
  BoldItalicUnderlineToggles,
  UndoRedo,
  BlockTypeSelect,
  ListsToggle,
} from '@mdxeditor/editor';
 import './mdxEditor.css';

export interface MDXEditorWrapperProps {
  markdown: string;
  onChange: (value: string) => void;
  readOnly?: boolean;
  placeholder?: string;
  className?: string;
}

export function MDXEditorWrapper({
  markdown,
  onChange,
  readOnly = false,
  placeholder = 'Start typing...',
  className = 'min-h-[200px] p-4 text-foreground ',
}: MDXEditorWrapperProps) {
  return (
    <MDXEditor
      markdown={markdown}
      onChange={onChange}
      readOnly={readOnly}
      placeholder={placeholder}
      plugins={[
        headingsPlugin(),
        listsPlugin(),
        quotePlugin(),
        thematicBreakPlugin(),
        markdownShortcutPlugin(),
        toolbarPlugin({
          toolbarContents: () => (
            <>
              <UndoRedo />
              <BlockTypeSelect />
              <BoldItalicUnderlineToggles />
              <ListsToggle />
            </>
          ),
        }),
      ]}
      contentEditableClassName={className}
    />
  );
}

export default MDXEditorWrapper;
