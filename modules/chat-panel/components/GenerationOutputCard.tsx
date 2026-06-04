'use client';

import { useRef, useCallback, type ReactNode } from 'react';
import {
  Save,
  ExternalLink,
  Loader2,
  Eye,
  Code2,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';

// ── Types ──────────────────────────────────────────────────────────────────

export interface GenerationOutputCardProps {
  /** Label shown in the header (e.g. "Generated Resume") */
  label: string;
  /** Whether the card should be wide (for visual previews) or full-width */
  wide?: boolean;

  /** Header action slot — rendered on the right side of the header */
  headerActions?: ReactNode;

  /** Body content of the card */
  children: ReactNode;
}

// ── Sub-components ─────────────────────────────────────────────────────────

export function ActionButton({
  onClick,
  disabled,
  loading,
  icon: Icon,
  label,
  active,
}: {
  onClick: () => void;
  disabled?: boolean;
  loading?: boolean;
  icon: typeof Save;
  label: string;
  active?: boolean;
}) {
  return (
    <Button
      type="button"
      variant="ghost"
      size="sm"
      className={cn('h-6 text-xs shrink-0', active ? 'text-primary' : 'text-muted-foreground hover:text-primary')}
      onClick={onClick}
      disabled={disabled}
    >
      {loading ? <Loader2 className="h-3 w-3 mr-1 animate-spin" /> : <Icon className="h-3 w-3 mr-1" />}
      {label}
    </Button>
  );
}

export function ViewButton({ onClick }: { onClick: () => void }) {
  return <ActionButton onClick={onClick} icon={ExternalLink} label="View" />;
}

export function SaveButton({
  onClick,
  disabled,
  loading,
}: {
  onClick: () => void;
  disabled?: boolean;
  loading?: boolean;
}) {
  return <ActionButton onClick={onClick} icon={Save} label="Save" disabled={disabled} loading={loading} />;
}

export function ToggleButton({
  label,
  icon: Icon,
  active,
  onClick,
}: {
  label: string;
  icon: typeof Eye;
  active: boolean;
  onClick: () => void;
}) {
  return (
    <Button
      type="button"
      variant="ghost"
      size="sm"
      className={cn('h-6 text-xs shrink-0', active && 'text-primary')}
      onClick={onClick}
    >
      <Icon className="h-3 w-3 mr-1" />
      {label}
    </Button>
  );
}

export function PreviewCodeToggle({
  showCode,
  onToggle,
}: {
  showCode: boolean;
  onToggle: (showCode: boolean) => void;
}) {
  return (
    <>
      <ToggleButton label="Preview" icon={Eye} active={!showCode} onClick={() => onToggle(false)} />
      <ToggleButton label="Code" icon={Code2} active={showCode} onClick={() => onToggle(true)} />
    </>
  );
}

// ── Iframe preview with auto-resize ────────────────────────────────────────

export function IframePreview({
  srcDoc,
  width,
  height,
  onSizeChange,
}: {
  srcDoc: string;
  width?: number;
  height?: number;
  onSizeChange?: (size: { width: number; height: number }) => void;
}) {
  const iframeRef = useRef<HTMLIFrameElement>(null);

  const handleLoad = useCallback(
    (event: React.SyntheticEvent<HTMLIFrameElement>) => {
      if (!onSizeChange) return;
      const iframe = event.currentTarget;
      try {
        const doc = iframe.contentDocument;
        if (!doc) return;

        const nextHeight = Math.ceil(
          Math.max(
            doc.documentElement?.scrollHeight ?? 0,
            doc.body?.scrollHeight ?? 0,
            320
          )
        );
        const bodyRectWidth = Math.ceil(doc.body?.scrollWidth ?? 0);
        const docRectWidth = Math.ceil(doc.documentElement?.scrollWidth ?? 0);

        const allElements = Array.from(doc.body?.querySelectorAll('*') ?? []);
        const contentBounds = allElements.reduce(
          (acc, el) => {
            const rect = (el as HTMLElement).getBoundingClientRect();
            if (rect.width <= 0 || rect.height <= 0) return acc;
            return {
              minLeft: Math.min(acc.minLeft, rect.left),
              maxRight: Math.max(acc.maxRight, rect.right),
            };
          },
          { minLeft: Number.POSITIVE_INFINITY, maxRight: 0 }
        );

        const visualContentWidth =
          Number.isFinite(contentBounds.minLeft) && contentBounds.maxRight > 0
            ? Math.ceil(contentBounds.maxRight - contentBounds.minLeft)
            : 0;

        const nextWidth = Math.max(visualContentWidth, bodyRectWidth, docRectWidth, 320);

        onSizeChange({ width: nextWidth, height: nextHeight });
      } catch {
        // Ignore cross-origin/sandbox access errors
      }
    },
    [onSizeChange]
  );

  return (
    <div className="p-0 overflow-x-auto">
      <div className="w-fit min-w-0">
        <iframe
          ref={iframeRef}
          title="Preview"
          className="border-0 block"
          style={{
            width: `${Math.max(320, width ?? 320)}px`,
            height: `${Math.max(320, height ?? 320)}px`,
          }}
          sandbox="allow-same-origin"
          srcDoc={srcDoc}
          onLoad={handleLoad}
        />
      </div>
    </div>
  );
}

// ── Code block ─────────────────────────────────────────────────────────────

export function CodeBlock({ children }: { children: string }) {
  return (
    <pre className="p-3 text-xs text-foreground overflow-auto max-h-80 whitespace-pre-wrap">
      {children}
    </pre>
  );
}

// ── Main card ──────────────────────────────────────────────────────────────

export function GenerationOutputCard({
  label,
  wide = false,
  headerActions,
  children,
}: GenerationOutputCardProps) {
  return (
    <div
      className={cn(
        'rounded-xl border border-border/50 bg-card overflow-hidden',
        wide ? 'w-fit max-w-full' : 'w-full'
      )}
    >
      {/* Header */}
      <div
        className={cn(
          'flex items-center justify-between px-3 py-2 bg-muted/30 border-b border-border/30',
          wide && 'w-fit min-w-full'
        )}
      >
        <span className="text-xs font-bold uppercase tracking-wider text-muted-foreground">
          {label}
        </span>
        {headerActions && (
          <div className="flex items-center gap-2">
            {headerActions}
          </div>
        )}
      </div>

      {/* Body */}
      {children}
    </div>
  );
}
