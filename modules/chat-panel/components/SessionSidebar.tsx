'use client';

import { PanelLeftClose, PanelLeftOpen, Plus, Trash2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { ScrollArea } from '@/components/ui/scroll-area';
import { cn } from '@/lib/utils';
import type { GenerationType, SessionMeta } from '../hooks/useSessionManager';

interface SessionSidebarProps {
  isHistoryCollapsed: boolean;
  generationType: GenerationType;
  sessions: SessionMeta[];
  activeSessionId: string;
  onToggleCollapsed: () => void;
  onCreateSession: (type: GenerationType) => void;
  onSelectSession: (sessionId: string) => void;
  onDeleteSession: (type: GenerationType, sessionId: string) => void;
}

export function SessionSidebar({
  isHistoryCollapsed,
  generationType,
  sessions,
  activeSessionId,
  onToggleCollapsed,
  onCreateSession,
  onSelectSession,
  onDeleteSession,
}: SessionSidebarProps) {
  return (
    <aside className={cn('shrink-0 border-r border-border bg-muted/10 flex-col transition-all duration-200', isHistoryCollapsed ? 'hidden md:flex md:w-14' : 'hidden md:flex md:w-72')}>
      <div className="p-3 space-y-2">
        <div className="flex items-center justify-between gap-2">
          {!isHistoryCollapsed && <span className="text-xs font-bold uppercase tracking-wider text-muted-foreground">Session History</span>}
          <Button
            type="button"
            variant="ghost"
            size="icon-sm"
            className="h-7 w-7 ml-auto"
            onClick={onToggleCollapsed}
            aria-label={isHistoryCollapsed ? 'Expand history' : 'Collapse history'}
          >
            {isHistoryCollapsed ? <PanelLeftOpen className="h-3.5 w-3.5" /> : <PanelLeftClose className="h-3.5 w-3.5" />}
          </Button>
        </div>

        {!isHistoryCollapsed && (
          <Button
            type="button"
            variant="outline"
            size="sm"
            className="w-full justify-center gap-1.5"
            onClick={() => onCreateSession(generationType)}
          >
            <Plus className="h-3.5 w-3.5" />
            New session
          </Button>
        )}

        {isHistoryCollapsed && (
          <Button
            type="button"
            variant="ghost"
            size="icon-sm"
            className="h-7 w-7 mx-auto"
            onClick={() => onCreateSession(generationType)}
            aria-label="New session"
          >
            <Plus className="h-3.5 w-3.5" />
          </Button>
        )}
      </div>

      <ScrollArea className="flex-1">
        <div className="p-2 space-y-1.5">
          {sessions.map((session) => {
            const isActive = session.id === activeSessionId;
            return (
              <div
                key={session.id}
                className={cn(
                  'group flex items-center gap-2 rounded-lg border px-2 py-2 transition-colors',
                  isActive ? 'border-primary/30 bg-primary/5' : 'border-transparent hover:bg-accent/50',
                  isHistoryCollapsed && 'justify-center'
                )}
              >
                <button
                  type="button"
                  className={cn('flex-1 min-w-0 text-left', isHistoryCollapsed && 'hidden')}
                  onClick={() => onSelectSession(session.id)}
                >
                  <p className="break-words text-xs font-medium text-foreground line-clamp-2">{session.title}</p>
                  <p className="text-[10px] text-muted-foreground">
                    {new Date(session.updatedAt).toLocaleString([], { month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' })}
                  </p>
                </button>
                {isHistoryCollapsed ? (
                  <button
                    type="button"
                    className="h-7 w-7 rounded-md text-[10px] font-bold bg-primary/10 text-primary"
                    onClick={() => onSelectSession(session.id)}
                    title={session.title}
                  >
                    {session.title.charAt(0).toUpperCase()}
                  </button>
                ) : (
                  <Button
                    type="button"
                    variant="ghost"
                    size="icon-sm"
                    className="h-7 w-7 opacity-0 group-hover:opacity-100"
                    onClick={() => onDeleteSession(generationType, session.id)}
                    aria-label="Delete session"
                  >
                    <Trash2 className="h-3.5 w-3.5" />
                  </Button>
                )}
              </div>
            );
          })}
        </div>
      </ScrollArea>
    </aside>
  );
}
