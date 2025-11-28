/**
 * Markdown Preview Component
 * Renders markdown content with proper formatting
 */

'use client';

import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import { cn } from '@/lib/utils';

interface MarkdownPreviewProps {
  content: string;
  className?: string;
}

export function MarkdownPreview({ content, className }: MarkdownPreviewProps) {
  return (
    <div className={cn(
      'prose prose-sm dark:prose-invert max-w-none',
      'prose-headings:font-semibold prose-headings:tracking-tight prose-headings:mt-6 prose-headings:mb-3',
      'prose-p:leading-7 prose-p:my-4 prose-p:text-foreground',
      'prose-ul:my-4 prose-ul:list-disc prose-ul:pl-6',
      'prose-ol:my-4 prose-ol:list-decimal prose-ol:pl-6',
      'prose-li:my-2 prose-li:text-foreground',
      'prose-strong:font-semibold prose-strong:text-foreground',
      'prose-em:italic prose-em:text-foreground',
      'prose-a:text-primary prose-a:underline hover:prose-a:text-primary/80',
      'prose-blockquote:border-l-4 prose-blockquote:border-muted prose-blockquote:pl-4 prose-blockquote:italic',
      'prose-code:bg-muted prose-code:px-1.5 prose-code:py-0.5 prose-code:rounded prose-code:text-sm',
      'prose-pre:bg-muted prose-pre:p-4 prose-pre:rounded-lg prose-pre:overflow-x-auto',
      'prose-hr:border-muted prose-hr:my-8',
      '[&>*:first-child]:mt-0 [&>*:last-child]:mb-0',
      className
    )}>
      <ReactMarkdown
        remarkPlugins={[remarkGfm]}
        components={{
          // Custom paragraph rendering to preserve line breaks
          p: ({ children }) => <p className="whitespace-pre-wrap">{children}</p>,
          // Ensure proper list item rendering
          li: ({ children, ...props }) => <li {...props}>{children}</li>,
          // Strong/bold rendering
          strong: ({ children }) => <strong>{children}</strong>,
          // Em/italic rendering
          em: ({ children }) => <em>{children}</em>,
        }}
      >
        {content}
      </ReactMarkdown>
    </div>
  );
}
