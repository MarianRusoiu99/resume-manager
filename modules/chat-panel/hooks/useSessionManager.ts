'use client';

import { useState, useEffect, useCallback } from 'react';
import type { ConversationMode, ConversationMessage } from '@/modules/ai-enhance/hooks/useConversation';

// ─── Types ──────────────────────────────────────────────────────────────────

export type GenerationType = 'resume' | 'cover-letter' | 'template';

export interface QuickAction {
  label: string;
  prompt: string;
}

export interface SessionMeta {
  id: string;
  title: string;
  updatedAt: number;
}

export type SessionHistoryByType = Record<GenerationType, SessionMeta[]>;
export type ActiveSessionByType = Record<GenerationType, string>;

// ─── Constants ──────────────────────────────────────────────────────────────

export const SESSION_HISTORY_KEY = 'fullpage-chat:history:v1';
export const SESSION_ACTIVE_KEY = 'fullpage-chat:active:v1';
export const SESSION_COLLAPSED_KEY = 'fullpage-chat:history-collapsed:v1';

export const RESUME_ACTIONS: QuickAction[] = [
  { label: 'Tailor my resume for a job', prompt: 'I have a resume I want to tailor for a specific job posting. I\'ll share my current resume and the job description.' },
  { label: 'Create a resume from scratch', prompt: 'Help me create a professional resume from scratch. Ask me about my experience, skills, and education.' },
  { label: 'Optimize my resume for ATS', prompt: 'I want to optimize my resume to pass Applicant Tracking Systems. Help me improve keyword matching and formatting.' },
];

export const COVER_LETTER_ACTIONS: QuickAction[] = [
  { label: 'Write a cover letter for a job', prompt: 'Help me write a compelling cover letter for a specific job posting. I\'ll share the job details.' },
  { label: 'Create from my resume', prompt: 'Generate a cover letter based on my existing resume and a job description I\'ll provide.' },
  { label: 'Improve an existing draft', prompt: 'I have a draft cover letter I\'d like to improve. Help me make it more compelling and professional.' },
];

export const TEMPLATE_ACTIONS: QuickAction[] = [
  { label: 'Create a template from scratch', prompt: 'Help me create a modern ATS-friendly resume template from scratch. Propose layout sections, typography, and HTML/CSS structure.' },
  { label: 'Generate based on style preference', prompt: 'Generate a professional resume template with a clean style. I prefer strong visual hierarchy and print-friendly spacing.' },
  { label: 'Create a variant template', prompt: 'I want a second template variation from my existing style: one minimal and one creative. Generate both options as template code.' },
];

// ─── Helper functions ───────────────────────────────────────────────────────

export function createSessionId(): string {
  if (typeof crypto !== 'undefined' && typeof crypto.randomUUID === 'function') {
    return crypto.randomUUID();
  }
  return `${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;
}

export function createSessionMeta(type: GenerationType): SessionMeta {
  return {
    id: createSessionId(),
    title: type === 'resume' ? 'New resume chat' : type === 'cover-letter' ? 'New cover letter chat' : 'New template chat',
    updatedAt: Date.now(),
  };
}

export function getMode(type: GenerationType): ConversationMode {
  if (type === 'cover-letter') return 'cover-letter-generation';
  if (type === 'template') return 'template-generation';
  return 'resume-generation';
}

export function getFeature(type: GenerationType): 'resume' | 'coverLetter' | 'template' {
  if (type === 'cover-letter') return 'coverLetter';
  if (type === 'template') return 'template';
  return 'resume';
}

export function getEmptyState(type: GenerationType): { title: string; description: string } {
  if (type === 'cover-letter') {
    return {
      title: 'AI Cover Letter Writer',
      description: 'Write compelling cover letters tailored to specific positions. Share the job details and your background.',
    };
  }
  if (type === 'template') {
    return {
      title: 'AI Template Builder',
      description: 'Generate and iterate on resume templates through conversation. Ask for layout, styling, or full HTML/CSS templates.',
    };
  }
  return {
    title: 'AI Resume Builder',
    description: 'Create tailored, ATS-optimized resumes through conversation. Share your experience and job details.',
  };
}

function getDefaultHistory(): SessionHistoryByType {
  return {
    resume: [createSessionMeta('resume')],
    'cover-letter': [createSessionMeta('cover-letter')],
    template: [createSessionMeta('template')],
  };
}

function getDefaultActive(history: SessionHistoryByType): ActiveSessionByType {
  return {
    resume: history.resume[0].id,
    'cover-letter': history['cover-letter'][0].id,
    template: history.template[0].id,
  };
}

function getInitialSessionState(): {
  history: SessionHistoryByType;
  active: ActiveSessionByType;
} {
  const history = getDefaultHistory();
  return {
    history,
    active: getDefaultActive(history),
  };
}

export function truncateTitle(text: string): string {
  const trimmed = text.trim().replace(/\s+/g, ' ');
  if (!trimmed) return 'New chat';
  return trimmed.length > 60 ? `${trimmed.slice(0, 57)}...` : trimmed;
}

// ─── Hook ───────────────────────────────────────────────────────────────────

export interface UseSessionManagerOptions {
  generationType: GenerationType;
  messages: ConversationMessage[];
  mode: ConversationMode;
}

export interface UseSessionManagerReturn {
  historyByType: SessionHistoryByType;
  activeByType: ActiveSessionByType;
  isHistoryCollapsed: boolean;
  isClientHydrated: boolean;
  activeSessionId: string;
  setIsHistoryCollapsed: (v: boolean | ((prev: boolean) => boolean)) => void;
  setActiveByType: React.Dispatch<React.SetStateAction<ActiveSessionByType>>;
  handleCreateSession: (type: GenerationType) => void;
  handleDeleteSession: (type: GenerationType, sessionId: string) => void;
}

export function useSessionManager(options: UseSessionManagerOptions): UseSessionManagerReturn {
  const { generationType, messages, mode } = options;

  const [historyByType, setHistoryByType] = useState<SessionHistoryByType>(() => getInitialSessionState().history);
  const [activeByType, setActiveByType] = useState<ActiveSessionByType>(() => getInitialSessionState().active);
  const [isHistoryCollapsed, setIsHistoryCollapsed] = useState(false);
  const [isClientHydrated, setIsClientHydrated] = useState(false);

  // ── localStorage hydration ──────────────────────────────────────────────
  useEffect(() => {
    try {
      const rawHistory = window.localStorage.getItem(SESSION_HISTORY_KEY);
      const rawActive = window.localStorage.getItem(SESSION_ACTIVE_KEY);
      const rawCollapsed = window.localStorage.getItem(SESSION_COLLAPSED_KEY);

      const parsedHistory = rawHistory ? JSON.parse(rawHistory) as Partial<SessionHistoryByType> : null;
      const mergedHistory: SessionHistoryByType = {
        resume: Array.isArray(parsedHistory?.resume) && parsedHistory.resume.length ? parsedHistory.resume : [createSessionMeta('resume')],
        'cover-letter': Array.isArray(parsedHistory?.['cover-letter']) && parsedHistory['cover-letter'].length ? parsedHistory['cover-letter'] : [createSessionMeta('cover-letter')],
        template: Array.isArray(parsedHistory?.template) && parsedHistory.template.length ? parsedHistory.template : [createSessionMeta('template')],
      };

      const parsedActive = rawActive ? JSON.parse(rawActive) as Partial<ActiveSessionByType> : null;
      const mergedActive: ActiveSessionByType = {
        resume: parsedActive?.resume && mergedHistory.resume.some((s) => s.id === parsedActive.resume)
          ? parsedActive.resume
          : mergedHistory.resume[0].id,
        'cover-letter': parsedActive?.['cover-letter'] && mergedHistory['cover-letter'].some((s) => s.id === parsedActive['cover-letter'])
          ? parsedActive['cover-letter']
          : mergedHistory['cover-letter'][0].id,
        template: parsedActive?.template && mergedHistory.template.some((s) => s.id === parsedActive.template)
          ? parsedActive.template
          : mergedHistory.template[0].id,
      };

      setHistoryByType(mergedHistory);
      setActiveByType(mergedActive);
      setIsHistoryCollapsed(rawCollapsed === 'true');
    } catch {
      // use defaults
    } finally {
      setIsClientHydrated(true);
    }
  }, []);

  // ── localStorage persistence ────────────────────────────────────────────
  useEffect(() => {
    if (!isClientHydrated) return;
    try {
      window.localStorage.setItem(SESSION_HISTORY_KEY, JSON.stringify(historyByType));
      window.localStorage.setItem(SESSION_ACTIVE_KEY, JSON.stringify(activeByType));
      window.localStorage.setItem(SESSION_COLLAPSED_KEY, String(isHistoryCollapsed));
    } catch {
      // ignore storage errors
    }
  }, [historyByType, activeByType, isHistoryCollapsed, isClientHydrated]);

  // ── Derived ─────────────────────────────────────────────────────────────
  const activeSessionId = activeByType[generationType];

  // ── Title update from messages ──────────────────────────────────────────
  useEffect(() => {
    const firstUserMessage = messages.find((m) => m.role === 'user' && m.content.trim().length > 0);
    const nextTitle = firstUserMessage ? truncateTitle(firstUserMessage.content) : (generationType === 'resume' ? 'New resume chat' : generationType === 'cover-letter' ? 'New cover letter chat' : 'New template chat');

    setHistoryByType((prev) => {
      const current = prev[generationType];
      const idx = current.findIndex((s) => s.id === activeSessionId);
      if (idx === -1) return prev;

      const updatedSession: SessionMeta = {
        ...current[idx],
        title: nextTitle,
        updatedAt: Date.now(),
      };

      const reordered = [updatedSession, ...current.filter((s) => s.id !== activeSessionId)];
      return {
        ...prev,
        [generationType]: reordered,
      };
    });
  }, [messages, generationType, activeSessionId]);

  // ── Create session ──────────────────────────────────────────────────────
  const handleCreateSession = useCallback((type: GenerationType) => {
    const next = createSessionMeta(type);
    setHistoryByType((prev) => ({
      ...prev,
      [type]: [next, ...prev[type]],
    }));
    setActiveByType((prev) => ({
      ...prev,
      [type]: next.id,
    }));
  }, []);

  // ── Delete session ──────────────────────────────────────────────────────
  const handleDeleteSession = useCallback((type: GenerationType, sessionId: string) => {
    const modeForType = getMode(type);

    setHistoryByType((prevHistory) => {
      const filtered = prevHistory[type].filter((s) => s.id !== sessionId);
      const fallback = createSessionMeta(type);
      const normalized = filtered.length > 0 ? filtered : [fallback];

      setActiveByType((prevActive) => {
        if (prevActive[type] !== sessionId) return prevActive;
        return {
          ...prevActive,
          [type]: normalized[0].id,
        };
      });

      return {
        ...prevHistory,
        [type]: normalized,
      };
    });

    try {
      window.localStorage.removeItem(`fullpage-chat:${modeForType}:${sessionId}`);
    } catch {
      // ignore
    }
  }, []);

  return {
    historyByType,
    activeByType,
    isHistoryCollapsed,
    isClientHydrated,
    activeSessionId,
    setIsHistoryCollapsed,
    setActiveByType,
    handleCreateSession,
    handleDeleteSession,
  };
}
