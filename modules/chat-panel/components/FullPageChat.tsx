'use client';

import { useState, useCallback, useRef, useEffect, useMemo } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { FileText, Mail, Palette, Plus, Loader2, ExternalLink, MessageSquare, Trash2, PanelLeftClose, PanelLeftOpen, Code2, Eye, Save } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { ScrollArea } from '@/components/ui/scroll-area';
import { renderTemplateServerSide } from '@/components/core/data-display/rendering/client-renderer';
import { sampleResume } from '@/lib/templates/constants/sample-resume';
import { getProfile, getProfiles } from '@/app/actions/profile';
import { getResume, getResumes } from '@/app/actions/resume';
import { getTemplate, getTemplates } from '@/app/actions/template';
import { ChatInput } from '@/components/chat/ChatInput';
import { ReasoningBlock } from '@/components/chat/ReasoningBlock';
import { PreviewTemplateSelector } from '@/modules/templates/components/PreviewTemplateSelector';
import { ResumePreview } from '@/modules/resume/components/ResumePreview';
import { MarkdownPreview } from '@/modules/editor/components/MarkdownPreview';
import { cn } from '@/lib/utils';
import { useConversation } from '@/modules/ai-enhance/hooks/useConversation';
import type { ConversationAttachment, ConversationMessage } from '@/modules/ai-enhance/hooks/useConversation';
import type { Resume } from '@/lib/validations/jsonresume';
import type { Template } from '@/lib/types/template';
import { extractResumeData, extractCoverLetterOutput, extractTemplateHtml } from '../utils/extract-output';
import {
  useSessionManager,
  getMode,
  getFeature,
  getEmptyState,
  type GenerationType,
  type SessionMeta,
  type ArtifactReference,
} from '../hooks/useSessionManager';
import {
  useGenerationSave,
  type ResumePreviewState,
  type CoverLetterPreviewState,
} from '../hooks/useGenerationSave';

type GenerationType = 'resume' | 'cover-letter' | 'template';

interface FullPageChatProps {
  defaultType?: GenerationType;
}

interface QuickAction {
  label: string;
  prompt: string;
}

interface SessionMeta {
  id: string;
  title: string;
  updatedAt: number;
}

interface ArtifactReference {
  id: string;
  label: string;
  type: 'profile' | 'resume' | 'cover-letter' | 'template';
}

type SessionHistoryByType = Record<GenerationType, SessionMeta[]>;
type ActiveSessionByType = Record<GenerationType, string>;

interface ResumePreviewState {
  resumeData: Resume;
  selectedTemplateId: string | null;
  savedResumeId?: string;
}

interface CoverLetterPreviewState {
  content: string;
  jobDescription: string;
  jobTitle?: string;
  companyName?: string;
  savedCoverLetterId?: string;
}

const SESSION_HISTORY_KEY = 'fullpage-chat:history:v1';
const SESSION_ACTIVE_KEY = 'fullpage-chat:active:v1';
const SESSION_COLLAPSED_KEY = 'fullpage-chat:history-collapsed:v1';

const RESUME_ACTIONS: QuickAction[] = [
  { label: 'Tailor my resume for a job', prompt: 'I have a resume I want to tailor for a specific job posting. I\'ll share my current resume and the job description.' },
  { label: 'Create a resume from scratch', prompt: 'Help me create a professional resume from scratch. Ask me about my experience, skills, and education.' },
  { label: 'Optimize my resume for ATS', prompt: 'I want to optimize my resume to pass Applicant Tracking Systems. Help me improve keyword matching and formatting.' },
];

const COVER_LETTER_ACTIONS: QuickAction[] = [
  { label: 'Write a cover letter for a job', prompt: 'Help me write a compelling cover letter for a specific job posting. I\'ll share the job details.' },
  { label: 'Create from my resume', prompt: 'Generate a cover letter based on my existing resume and a job description I\'ll provide.' },
  { label: 'Improve an existing draft', prompt: 'I have a draft cover letter I\'d like to improve. Help me make it more compelling and professional.' },
];

const TEMPLATE_ACTIONS: QuickAction[] = [
  { label: 'Create a template from scratch', prompt: 'Help me create a modern ATS-friendly resume template from scratch. Propose layout sections, typography, and HTML/CSS structure.' },
  { label: 'Generate based on style preference', prompt: 'Generate a professional resume template with a clean style. I prefer strong visual hierarchy and print-friendly spacing.' },
  { label: 'Create a variant template', prompt: 'I want a second template variation from my existing style: one minimal and one creative. Generate both options as template code.' },
];

function createSessionId(): string {
  if (typeof crypto !== 'undefined' && typeof crypto.randomUUID === 'function') {
    return crypto.randomUUID();
  }
  return `${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;
}

function createSessionMeta(type: GenerationType): SessionMeta {
  return {
    id: createSessionId(),
    title: type === 'resume' ? 'New resume chat' : type === 'cover-letter' ? 'New cover letter chat' : 'New template chat',
    updatedAt: Date.now(),
  };
}

function getMode(type: GenerationType): ConversationMode {
  if (type === 'cover-letter') return 'cover-letter-generation';
  if (type === 'template') return 'template-generation';
  return 'resume-generation';
}

function getFeature(type: GenerationType): 'resume' | 'coverLetter' | 'template' {
  if (type === 'cover-letter') return 'coverLetter';
  if (type === 'template') return 'template';
  return 'resume';
}

function getEmptyState(type: GenerationType): { title: string; description: string } {
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

function truncateTitle(text: string): string {
  const trimmed = text.trim().replace(/\s+/g, ' ');
  if (!trimmed) return 'New chat';
  return trimmed.length > 60 ? `${trimmed.slice(0, 57)}...` : trimmed;
}

export function FullPageChat({ defaultType = 'resume' }: FullPageChatProps) {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [generationType, setGenerationType] = useState<GenerationType>(defaultType);
  const [historyByType, setHistoryByType] = useState<SessionHistoryByType>(() => getInitialSessionState().history);
  const [activeByType, setActiveByType] = useState<ActiveSessionByType>(() => getInitialSessionState().active);
  const [isHistoryCollapsed, setIsHistoryCollapsed] = useState(false);
  const [isClientHydrated, setIsClientHydrated] = useState(false);
  const [templatePreviewByMessage, setTemplatePreviewByMessage] = useState<Record<string, { html: string; showCode: boolean }>>({});
  const [resumePreviewByMessage, setResumePreviewByMessage] = useState<Record<string, ResumePreviewState>>({});
  const [coverLetterPreviewByMessage, setCoverLetterPreviewByMessage] = useState<Record<string, CoverLetterPreviewState>>({});
  const [resumeDefaultTemplateId, setResumeDefaultTemplateId] = useState<string | null>(null);
  const [resumeTemplateByMessage, setResumeTemplateByMessage] = useState<Record<string, { templateId: string; htmlTemplate: string }>>({});
  const [templatePreviewHeightByMessage, setTemplatePreviewHeightByMessage] = useState<Record<string, number>>({});
  const [templatePreviewWidthByMessage, setTemplatePreviewWidthByMessage] = useState<Record<string, number>>({});
  const [isSavingTemplateByMessage, setIsSavingTemplateByMessage] = useState<Record<string, boolean>>({});
  const [isSavingResumeByMessage, setIsSavingResumeByMessage] = useState<Record<string, boolean>>({});
  const [isSavingCoverLetterByMessage, setIsSavingCoverLetterByMessage] = useState<Record<string, boolean>>({});
  const [templatePreviewResume, setTemplatePreviewResume] = useState<Resume>(sampleResume as Resume);
  const [artifactOptions, setArtifactOptions] = useState<ArtifactReference[]>([]);
  const [selectedArtifactRefs, setSelectedArtifactRefs] = useState<string[]>([]);
  const [isLoadingArtifacts, setIsLoadingArtifacts] = useState(false);
  const [hydratedResumeRefs, setHydratedResumeRefs] = useState<Record<string, Resume>>({});
  const [hydratedProfileRefs, setHydratedProfileRefs] = useState<Record<string, Resume>>({});
  const scrollRef = useRef<HTMLDivElement>(null);

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

  const mode: ConversationMode = getMode(generationType);

  useEffect(() => {
    const tab = searchParams.get('tab');
    if (tab === 'cover-letter' || tab === 'template' || tab === 'resume') {
      setGenerationType(tab);
      return;
    }
    if (defaultType) {
      setGenerationType(defaultType);
    }
  }, [searchParams, defaultType]);

  const activeSessionId = activeByType[generationType];
  const persistenceKey = useMemo(
    () => `fullpage-chat:${mode}:${activeSessionId}`,
    [mode, activeSessionId]
  );

  const { state, sendMessage, abort, isGenerating, updateContext } = useConversation({
    mode,
    persistenceKey,
    onComplete: () => {
      setTimeout(() => {
        if (scrollRef.current) {
          scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
        }
      }, 100);
    },
  });

  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [state.messages, state.isStreaming]);

  useEffect(() => {
    const firstUserMessage = state.messages.find((m) => m.role === 'user' && m.content.trim().length > 0);
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
  }, [state.messages, generationType, activeSessionId]);

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
    setSelectedArtifactRefs([]);
  }, []);

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

  const hasMessages = state.messages.length > 0;
  const activeResumePreview = generationType === 'resume'
    ? [...state.messages]
      .reverse()
      .find((message) => message.role === 'assistant' && !!resumePreviewByMessage[message.id])
    : undefined;
  const activeSavedResumeId = activeResumePreview
    ? resumePreviewByMessage[activeResumePreview.id]?.savedResumeId
    : undefined;
  const hasSavedId = generationType === 'resume'
    ? Boolean(activeSavedResumeId)
    : Boolean(state.savedId);
  const emptyState = getEmptyState(generationType);
  const actions = generationType === 'resume' ? RESUME_ACTIONS : generationType === 'cover-letter' ? COVER_LETTER_ACTIONS : TEMPLATE_ACTIONS;

  const openSavedResource = () => {
    if (generationType === 'resume') {
      const resumeId = activeSavedResumeId ?? state.savedId;
      if (!resumeId) return;
      router.push(`/resumes/${resumeId}`);
      return;
    }

    if (!state.savedId) return;
    if (generationType === 'cover-letter') {
      router.push(`/cover-letters/${state.savedId}`);
      return;
    }
    router.push(`/templates/${state.savedId}`);
  };

  const switchType = useCallback((type: GenerationType) => {
    setGenerationType(type);
    const params = new URLSearchParams(searchParams.toString());
    params.set('tab', type);
    router.replace(`/generate?${params.toString()}`);
  }, [router, searchParams]);

  useEffect(() => {
    let mounted = true;

    const loadArtifacts = async () => {
      setIsLoadingArtifacts(true);
      try {
        if (generationType === 'resume') {
          const [profilesResult, resumesResult] = await Promise.all([getProfiles(), getResumes()]);
          if (!mounted) return;

          const options: ArtifactReference[] = [];
          if (profilesResult.success && profilesResult.data) {
            options.push(
              ...profilesResult.data.map((profile) => ({
                id: profile.id,
                label: `Resume Source: ${profile.name}`,
                type: 'profile' as const,
              }))
            );
          }
          if (resumesResult.success && resumesResult.data) {
            options.push(
              ...resumesResult.data.map((resume) => ({
                id: resume.id,
                label: `Generated Resume: ${resume.jobTitle || 'Untitled'}`,
                type: 'resume' as const,
              }))
            );
          }
          setArtifactOptions(options);
          setSelectedArtifactRefs((current) => current.filter((ref) => options.some((opt) => `${opt.type}:${opt.id}` === ref)));
          return;
        }

        if (generationType === 'cover-letter') {
          const [profilesResult, resumesResult] = await Promise.all([getProfiles(), getResumes()]);
          if (!mounted) return;

          const options: ArtifactReference[] = [];
          if (profilesResult.success && profilesResult.data) {
            options.push(
              ...profilesResult.data.map((profile) => ({
                id: profile.id,
                label: `Profile: ${profile.name}`,
                type: 'profile' as const,
              }))
            );
          }

          if (resumesResult.success && resumesResult.data) {
            options.push(
              ...resumesResult.data.map((resume) => ({
                id: resume.id,
                label: `Resume: ${resume.jobTitle || 'Untitled'}`,
                type: 'resume' as const,
              }))
            );
          }

          setArtifactOptions(options);
          setSelectedArtifactRefs((current) => current.filter((ref) => options.some((opt) => `${opt.type}:${opt.id}` === ref)));
          return;
        }

        const [templatesResult, profilesResult] = await Promise.all([getTemplates(), getProfiles()]);
        if (!mounted) return;

        const options: ArtifactReference[] = [];
        if (profilesResult.success && profilesResult.data) {
          options.push(
            ...profilesResult.data.map((profile) => ({
              id: profile.id,
              label: `Preview Profile: ${profile.name}${profile.isDefault ? ' (default)' : ''}`,
              type: 'profile' as const,
            }))
          );
        }

        if (templatesResult.success && templatesResult.data) {
          options.push(
            ...templatesResult.data.map((template) => ({
              id: template.id,
              label: `Template: ${template.name}`,
              type: 'template' as const,
            }))
          );
        }

        setArtifactOptions(options);
        setSelectedArtifactRefs((current) => {
          const valid = current.filter((ref) => options.some((opt) => `${opt.type}:${opt.id}` === ref));
          if (valid.length > 0) return valid;

          const defaultProfile = options.find((opt) => opt.type === 'profile' && opt.label.includes('(default)'));
          if (defaultProfile) return [`profile:${defaultProfile.id}`];

          const firstProfile = options.find((opt) => opt.type === 'profile');
          if (firstProfile) return [`profile:${firstProfile.id}`];

          return [];
        });
      } finally {
        if (mounted) {
          setIsLoadingArtifacts(false);
        }
      }
    };

    void loadArtifacts();

    return () => {
      mounted = false;
    };
  }, [generationType]);

  const selectedArtifacts = useMemo(
    () => selectedArtifactRefs
      .map((ref) => artifactOptions.find((opt) => `${opt.type}:${opt.id}` === ref))
      .filter((artifact): artifact is ArtifactReference => Boolean(artifact)),
    [artifactOptions, selectedArtifactRefs]
  );

  const selectedTemplateArtifact = useMemo(
    () => selectedArtifacts.find((artifact) => artifact.type === 'template') ?? null,
    [selectedArtifacts]
  );

  useEffect(() => {
    if (generationType !== 'cover-letter') return;

    const profileIds = selectedArtifacts
      .filter((artifact) => artifact.type === 'profile')
      .map((artifact) => artifact.id)
      .filter(Boolean);

    const missingProfileIds = profileIds.filter((id) => !hydratedProfileRefs[id]);
    if (missingProfileIds.length === 0) return;

    let cancelled = false;

    const hydrateProfiles = async () => {
      for (const profileId of missingProfileIds) {
        const result = await getProfile(profileId);
        if (cancelled) return;
        if (!result.success || !result.data?.resume) continue;

        setHydratedProfileRefs((prev) => {
          if (prev[profileId]) return prev;
          return {
            ...prev,
            [profileId]: result.data.resume as Resume,
          };
        });
      }
    };

    void hydrateProfiles();

    return () => {
      cancelled = true;
    };
  }, [generationType, selectedArtifacts, hydratedProfileRefs]);

  useEffect(() => {
    if (generationType !== 'cover-letter') return;

    const resumeIds = selectedArtifacts
      .filter((artifact) => artifact.type === 'resume')
      .map((artifact) => artifact.id)
      .filter(Boolean);

    const missingResumeIds = resumeIds.filter((id) => !hydratedResumeRefs[id]);
    if (missingResumeIds.length === 0) return;

    let cancelled = false;

    const hydrateResumes = async () => {
      for (const resumeId of missingResumeIds) {
        const result = await getResume(resumeId);
        if (cancelled) return;
        if (!result.success || !result.data?.content) continue;

        setHydratedResumeRefs((prev) => {
          if (prev[resumeId]) return prev;
          return {
            ...prev,
            [resumeId]: result.data.content as Resume,
          };
        });
      }
    };

    void hydrateResumes();

    return () => {
      cancelled = true;
    };
  }, [generationType, selectedArtifacts, hydratedResumeRefs]);

  useEffect(() => {
    let cancelled = false;

    const loadTemplatePreviewResume = async () => {
      if (generationType !== 'template') return;

      const selectedProfileRef = selectedArtifactRefs.find((ref) => ref.startsWith('profile:'));
      const profileRef = selectedProfileRef ? selectedProfileRef.split(':')[1] : null;
      if (profileRef) {
        const profileResult = await getProfile(profileRef);
        if (cancelled) return;
        if (profileResult.success && profileResult.data?.resume) {
          setTemplatePreviewResume(profileResult.data.resume as Resume);
          return;
        }
      }

      const profilesResult = await getProfiles();
      if (cancelled) return;
      if (profilesResult.success && profilesResult.data && profilesResult.data.length > 0) {
        const defaultProfile = profilesResult.data.find((p) => p.isDefault) ?? profilesResult.data[0];
        if (!defaultProfile) {
          setTemplatePreviewResume(sampleResume as Resume);
          return;
        }
        const defaultProfileResult = await getProfile(defaultProfile.id);
        if (cancelled) return;
        if (defaultProfileResult.success && defaultProfileResult.data?.resume) {
          setTemplatePreviewResume(defaultProfileResult.data.resume as Resume);
          return;
        }
      }

      setTemplatePreviewResume(sampleResume as Resume);
    };

    void loadTemplatePreviewResume();

    return () => {
      cancelled = true;
    };
  }, [generationType, selectedArtifactRefs]);

  useEffect(() => {
    if (generationType !== 'template') {
      setTemplatePreviewByMessage((prev) => (Object.keys(prev).length > 0 ? {} : prev));
      setTemplatePreviewHeightByMessage((prev) => (Object.keys(prev).length > 0 ? {} : prev));
      setTemplatePreviewWidthByMessage((prev) => (Object.keys(prev).length > 0 ? {} : prev));
      return;
    }

    const assistantTemplateMessages = state.messages.filter((m) => m.role === 'assistant');
    if (assistantTemplateMessages.length === 0) return;

    let cancelled = false;

    const processMissingPreviews = async () => {
      const updates: Array<{ id: string; html: string; showCode: boolean }> = [];

      for (const message of assistantTemplateMessages) {
        if (templatePreviewByMessage[message.id]) continue;

        const htmlTemplate = extractTemplateHtml(message);
        if (!htmlTemplate) continue;

        try {
          const html = await renderTemplateServerSide({
            htmlTemplate,
            resumeData: templatePreviewResume,
          });
          if (cancelled) return;
          updates.push({ id: message.id, html, showCode: false });
        } catch {
          if (cancelled) return;
          updates.push({ id: message.id, html: '', showCode: true });
        }
      }

      if (cancelled || updates.length === 0) return;

      setTemplatePreviewByMessage((prev) => {
        const next = { ...prev };
        let changed = false;

        for (const update of updates) {
          if (next[update.id]) continue;
          next[update.id] = { html: update.html, showCode: update.showCode };
          changed = true;
        }

        return changed ? next : prev;
      });
    };

    void processMissingPreviews();

    return () => {
      cancelled = true;
    };
  }, [state.messages, generationType, templatePreviewByMessage, templatePreviewResume]);

  useEffect(() => {
    let cancelled = false;

    const loadResumeDefaultTemplate = async () => {
      const result = await getTemplates();
      if (cancelled) return;
      if (!result.success || !result.data || result.data.length === 0) {
        setResumeDefaultTemplateId(null);
        return;
      }

      const defaultTemplate = result.data[0];
      setResumeDefaultTemplateId(defaultTemplate.id);
    };

    void loadResumeDefaultTemplate();

    return () => {
      cancelled = true;
    };
  }, []);

  useEffect(() => {
    if (generationType !== 'resume') {
      setResumePreviewByMessage((prev) => (Object.keys(prev).length > 0 ? {} : prev));
      setResumeTemplateByMessage((prev) => (Object.keys(prev).length > 0 ? {} : prev));
      return;
    }

    const assistantResumeMessages = state.messages.filter((message) => message.role === 'assistant');
    if (assistantResumeMessages.length === 0) return;

    setResumePreviewByMessage((prev) => {
      const next = { ...prev };
      let changed = false;

      for (const message of assistantResumeMessages) {
        if (next[message.id]) continue;

        const resumeData = extractResumeData(message);
        if (!resumeData) continue;

        next[message.id] = {
          resumeData,
          selectedTemplateId: resumeDefaultTemplateId,
        };
        changed = true;
      }

      return changed ? next : prev;
    });
  }, [generationType, state.messages, resumeDefaultTemplateId]);

  useEffect(() => {
    if (!resumeDefaultTemplateId) return;

    setResumePreviewByMessage((prev) => {
      let changed = false;
      const next = { ...prev };

      for (const [messageId, preview] of Object.entries(prev)) {
        if (preview.selectedTemplateId) continue;
        next[messageId] = {
          ...preview,
          selectedTemplateId: resumeDefaultTemplateId,
        };
        changed = true;
      }

      return changed ? next : prev;
    });
  }, [resumeDefaultTemplateId]);

  useEffect(() => {
    if (generationType !== 'cover-letter') {
      setCoverLetterPreviewByMessage((prev) => (Object.keys(prev).length > 0 ? {} : prev));
      return;
    }

    const assistantMessages = state.messages.filter((message) => message.role === 'assistant');
    if (assistantMessages.length === 0) return;

    setCoverLetterPreviewByMessage((prev) => {
      const next = { ...prev };
      let changed = false;

      for (const message of assistantMessages) {
        const extracted = extractCoverLetterOutput(message);
        if (!extracted?.content) continue;

        const existing = next[message.id];
        if (existing) {
          if (
            existing.content === extracted.content
            && existing.jobDescription === (state.context?.job?.description || '')
            && existing.jobTitle === extracted.jobTitle
            && existing.companyName === extracted.companyName
          ) {
            continue;
          }

          next[message.id] = {
            ...existing,
            content: extracted.content,
            jobDescription: state.context?.job?.description || '',
            jobTitle: extracted.jobTitle,
            companyName: extracted.companyName,
          };
          changed = true;
          continue;
        }

        next[message.id] = {
          content: extracted.content,
          jobDescription: state.context?.job?.description || '',
          jobTitle: extracted.jobTitle,
          companyName: extracted.companyName,
        };
        changed = true;
      }

      return changed ? next : prev;
    });
  }, [generationType, state.messages, state.context?.job?.description]);

  const artifactContextOverride = useMemo(() => {
    if (selectedArtifacts.length === 0) return undefined;

    const referencedProfiles = selectedArtifacts
      .filter((artifact) => artifact.type === 'profile')
      .map((artifact) => ({
        id: artifact.id,
        name: artifact.label.replace(/^Profile:\s*/, '').replace(/^Resume Source:\s*/, ''),
        resume: hydratedProfileRefs[artifact.id],
      }))
      .filter((profile) => Boolean(profile.resume));

    const referencedResumes = selectedArtifacts
      .filter((artifact) => artifact.type === 'resume')
      .map((artifact) => ({
        id: artifact.id,
        label: artifact.label.replace(/^Resume:\s*/, '').replace(/^Generated Resume:\s*/, ''),
        resume: hydratedResumeRefs[artifact.id],
      }))
      .filter((resume) => Boolean(resume.resume));
    const referencedCoverLetters = selectedArtifacts
      .filter((artifact) => artifact.type === 'cover-letter')
      .map((artifact) => artifact.label);

    const templateArtifact = selectedTemplateArtifact;

    const override: Record<string, unknown> = {};

    if (!(generationType === 'template' && referencedProfiles.length > 0) && referencedProfiles.length > 0) {
      override.userProfile = referencedProfiles[0];
      override.referencedProfiles = referencedProfiles;
    }

    if (referencedResumes.length > 0) {
      override.currentResume = referencedResumes[0].resume;
      override.referencedResumes = referencedResumes;
    }

    if (referencedCoverLetters.length > 0) {
      override.currentCoverLetter = referencedCoverLetters[0];
      override.referencedCoverLetters = referencedCoverLetters;
    }

    if (templateArtifact) {
      override.template = { name: templateArtifact.label };
    }

    return Object.keys(override).length > 0 ? override : undefined;
  }, [selectedArtifacts, selectedTemplateArtifact, generationType, hydratedProfileRefs, hydratedResumeRefs]);

  useEffect(() => {
    let cancelled = false;

    const hydrateTemplateContextFromReference = async () => {
      if (generationType !== 'template') return;
      if (!selectedTemplateArtifact) return;

      const templateResult = await getTemplate(selectedTemplateArtifact.id);
      if (cancelled) return;
      if (!templateResult.success || !templateResult.data) return;

      const template = templateResult.data as Template;
      const currentTemplate = state.context?.template;
      if (
        currentTemplate?.name === template.name
        && currentTemplate?.htmlTemplate === template.htmlTemplate
      ) {
        return;
      }

      updateContext({
        template: {
          name: template.name,
          htmlTemplate: template.htmlTemplate,
        },
      });
    };

    void hydrateTemplateContextFromReference();

    return () => {
      cancelled = true;
    };
  }, [generationType, selectedTemplateArtifact, state.context?.template, updateContext]);

  const handleSend = useCallback(async ({
    message,
    attachments,
    modelId,
  }: {
    message: string;
    attachments?: ConversationAttachment[];
    modelId?: string;
  }) => {
    const trimmed = message.trim();
    if (!trimmed && (!attachments || attachments.length === 0)) return;
    await sendMessage({ message: trimmed, attachments, modelId, contextOverride: artifactContextOverride, stream: true });
  }, [sendMessage, artifactContextOverride]);

  const handleQuickAction = useCallback(async (prompt: string) => {
    await sendMessage({ message: prompt, contextOverride: artifactContextOverride, stream: true });
  }, [sendMessage, artifactContextOverride]);

  const handleSaveTemplateMessage = useCallback(async (message: ConversationMessage) => {
    const htmlTemplate = extractTemplateHtml(message);
    if (!htmlTemplate) {
      toast.error('No template code found in this message.');
      return;
    }

    setIsSavingTemplateByMessage((prev) => ({ ...prev, [message.id]: true }));

    try {
      const defaultName = `AI Template ${new Date().toLocaleDateString()}`;
      const result = await createTemplate({
        name: defaultName,
        description: 'Saved from template generation chat',
        htmlTemplate,
        isPublic: false,
      });

      if (!result.success || !result.data) {
        toast.error('Failed to save template');
        return;
      }

      toast.success('Template saved');
      router.push(`/templates/${result.data.id}`);
    } catch {
      toast.error('Failed to save template');
    } finally {
      setIsSavingTemplateByMessage((prev) => ({ ...prev, [message.id]: false }));
    }
  }, [router]);

  const handleSaveResumeMessage = useCallback(async (messageId: string) => {
    const preview = resumePreviewByMessage[messageId];
    if (!preview) {
      toast.error('No resume data found for this message.');
      return;
    }

    if (preview.savedResumeId) {
      router.push(`/resumes/${preview.savedResumeId}`);
      return;
    }

    setIsSavingResumeByMessage((prev) => ({ ...prev, [messageId]: true }));

    try {
      const result = await saveGeneratedResume({
        resume: preview.resumeData,
        jobDescription: 'Generated from chat session',
        templateId: preview.selectedTemplateId ?? undefined,
        metadata: {
          source: 'generate-chat',
          generationType: 'resume',
        },
      });

      if (!result.success || !result.data?.id) {
        toast.error('Failed to save resume');
        return;
      }

      setResumePreviewByMessage((prev) => {
        const current = prev[messageId];
        if (!current) return prev;
        return {
          ...prev,
          [messageId]: {
            ...current,
            savedResumeId: result.data.id,
          },
        };
      });

      toast.success('Resume saved');
    } catch {
      toast.error('Failed to save resume');
    } finally {
      setIsSavingResumeByMessage((prev) => ({ ...prev, [messageId]: false }));
    }
  }, [resumePreviewByMessage, router]);

  const handleSaveCoverLetterMessage = useCallback(async (messageId: string) => {
    const preview = coverLetterPreviewByMessage[messageId];
    if (!preview) {
      toast.error('No cover letter found for this message.');
      return;
    }

    if (preview.savedCoverLetterId) {
      router.push(`/cover-letters/${preview.savedCoverLetterId}`);
      return;
    }

    setIsSavingCoverLetterByMessage((prev) => ({ ...prev, [messageId]: true }));

    try {
      const result = await createCoverLetter(
        preview.content,
        preview.jobDescription || 'Generated from chat session',
        preview.jobTitle,
        preview.companyName,
        {
          jobDescription: preview.jobDescription || 'Generated from chat session',
          jobTitle: preview.jobTitle,
          companyName: preview.companyName,
        }
      );

      if (!result.success || !result.data?.id) {
        toast.error('Failed to save cover letter');
        return;
      }

      setCoverLetterPreviewByMessage((prev) => {
        const current = prev[messageId];
        if (!current) return prev;
        return {
          ...prev,
          [messageId]: {
            ...current,
            savedCoverLetterId: result.data.id,
          },
        };
      });

      toast.success('Cover letter saved');
    } catch {
      toast.error('Failed to save cover letter');
    } finally {
      setIsSavingCoverLetterByMessage((prev) => ({ ...prev, [messageId]: false }));
    }
  }, [coverLetterPreviewByMessage, router]);

  return (
    <div className="flex h-screen bg-background">
      <aside className={cn('shrink-0 border-r border-border bg-muted/10 flex-col transition-all duration-200', isHistoryCollapsed ? 'hidden md:flex md:w-14' : 'hidden md:flex md:w-72')}>
        <div className="p-3 space-y-2">
          <div className="flex items-center justify-between gap-2">
            {!isHistoryCollapsed && <span className="text-xs font-bold uppercase tracking-wider text-muted-foreground">Session History</span>}
            <Button
              type="button"
              variant="ghost"
              size="icon-sm"
              className="h-7 w-7 ml-auto"
              onClick={() => setIsHistoryCollapsed((prev) => !prev)}
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
              onClick={() => handleCreateSession(generationType)}
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
              onClick={() => handleCreateSession(generationType)}
              aria-label="New session"
            >
              <Plus className="h-3.5 w-3.5" />
            </Button>
          )}
        </div>

        <ScrollArea className="flex-1">
          <div className="p-2 space-y-1.5">
            {historyByType[generationType].map((session) => {
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
                    onClick={() => {
                      setSelectedArtifactRefs([]);
                      setActiveByType((prev) => ({ ...prev, [generationType]: session.id }));
                    }}
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
                      onClick={() => {
                        setSelectedArtifactRefs([]);
                        setActiveByType((prev) => ({ ...prev, [generationType]: session.id }));
                      }}
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
                    onClick={() => handleDeleteSession(generationType, session.id)}
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

      <div className="flex flex-1 flex-col min-w-0">
        <div className="shrink-0 bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
          <div className="max-w-6xl mx-auto flex items-center justify-between px-4 py-3 gap-3">
            <div className="flex items-center bg-muted/50 rounded-lg p-0.5">
              <button
                type="button"
                onClick={() => switchType('resume')}
                className={cn(
                  'flex items-center gap-1.5 px-3 py-1.5 rounded-md text-xs font-bold uppercase tracking-wider transition-all',
                  generationType === 'resume' ? 'bg-background shadow-sm text-foreground' : 'text-muted-foreground hover:text-foreground'
                )}
              >
                <FileText className="h-3.5 w-3.5" />
                Resume
              </button>
              <button
                type="button"
                onClick={() => switchType('cover-letter')}
                className={cn(
                  'flex items-center gap-1.5 px-3 py-1.5 rounded-md text-xs font-bold uppercase tracking-wider transition-all',
                  generationType === 'cover-letter' ? 'bg-background shadow-sm text-foreground' : 'text-muted-foreground hover:text-foreground'
                )}
              >
                <Mail className="h-3.5 w-3.5" />
                Cover Letter
              </button>
              <button
                type="button"
                onClick={() => switchType('template')}
                className={cn(
                  'flex items-center gap-1.5 px-3 py-1.5 rounded-md text-xs font-bold uppercase tracking-wider transition-all',
                  generationType === 'template' ? 'bg-background shadow-sm text-foreground' : 'text-muted-foreground hover:text-foreground'
                )}
              >
                <Palette className="h-3.5 w-3.5" />
                Template
              </button>
            </div>

            <div className="flex items-center gap-2">
              <span className="hidden sm:inline-flex items-center gap-1.5 text-xs text-muted-foreground">
                <MessageSquare className="h-3.5 w-3.5" />
                {historyByType[generationType].length} sessions
              </span>
            </div>
          </div>
        </div>

        <div className="flex-1 min-h-0">
          <ScrollArea className="h-full">
            <div ref={scrollRef} className="w-full h-full px-4 py-6">
              {!hasMessages ? (
                <div className="flex flex-col items-center justify-center min-h-[60vh] gap-6">
                  <div className="text-center space-y-2">
                    <h2 className="text-2xl font-bold text-foreground">{emptyState.title}</h2>
                    <p className="text-sm text-muted-foreground max-w-xl">{emptyState.description}</p>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 w-full max-w-4xl">
                    {actions.map((action) => (
                      <button
                        key={action.label}
                        type="button"
                        onClick={() => void handleQuickAction(action.prompt)}
                        className="flex flex-col gap-1 p-4 rounded-xl border border-border/50 bg-card hover:bg-accent/50 hover:border-primary/20 transition-all text-left"
                      >
                        <span className="text-sm font-medium text-foreground">{action.label}</span>
                        <span className="text-xs text-muted-foreground line-clamp-2">{action.prompt}</span>
                      </button>
                    ))}
                  </div>
                </div>
              ) : (
                <div className="flex flex-col gap-6 pb-4">
                  {state.messages.map((message, index) => {
                    const isUser = message.role === 'user';
                    const isLastAssistant = !isUser && index === state.messages.length - 1;
                    const isStreamingLast = isLastAssistant && state.isStreaming;
                    const templateHtmlForMessage = !isUser && generationType === 'template' ? extractTemplateHtml(message) : null;
                    const shouldHideTemplateRawMessage = !isUser && generationType === 'template' && !!templateHtmlForMessage;
                    const isTemplatePreviewActive =
                      !isUser &&
                      generationType === 'template' &&
                      !!templatePreviewByMessage[message.id] &&
                      !templatePreviewByMessage[message.id].showCode &&
                      !!templatePreviewByMessage[message.id].html;
                    const resumePreview = !isUser && generationType === 'resume' ? resumePreviewByMessage[message.id] : undefined;
                    const shouldHideResumeRawMessage = !isUser && generationType === 'resume' && !!resumePreview;
                    const coverLetterPreview = !isUser && generationType === 'cover-letter' ? coverLetterPreviewByMessage[message.id] : undefined;
                    const shouldHideCoverLetterRawMessage = !isUser && generationType === 'cover-letter' && !!coverLetterPreview;

                    return (
                      <div key={message.id} className={cn('w-full flex gap-4', isUser ? 'justify-end' : 'justify-start')}>
                        {!isUser && (
                          <div className="shrink-0 h-8 w-8 rounded-full bg-primary/10 flex items-center justify-center mt-0.5">
                            <span className="text-xs font-bold text-primary">AI</span>
                          </div>
                        )}

                        <div className={cn('w-full space-y-2', isUser && 'max-w-[95%] flex flex-col items-end')}>
                          {!shouldHideTemplateRawMessage && !shouldHideResumeRawMessage && !shouldHideCoverLetterRawMessage && (
                            <div
                              className={cn(
                                'rounded-2xl px-4 py-3 text-sm leading-relaxed',
                                isUser
                                  ? 'bg-primary text-primary-foreground rounded-br-md'
                                  : 'bg-muted text-foreground rounded-bl-md'
                              )}
                            >
                              {isStreamingLast && !message.content ? (
                                <div className="flex items-center gap-1.5 py-1">
                                  <span className="size-1.5 animate-bounce rounded-full bg-current [animation-delay:0ms]" />
                                  <span className="size-1.5 animate-bounce rounded-full bg-current [animation-delay:150ms]" />
                                  <span className="size-1.5 animate-bounce rounded-full bg-current [animation-delay:300ms]" />
                                </div>
                              ) : (
                                <p className="whitespace-pre-wrap break-words">{message.content}</p>
                              )}
                            </div>
                          )}

                          {!isUser && message.thinking && (
                            <ReasoningBlock thinking={message.thinking} isStreaming={isStreamingLast && !message.output} />
                          )}

                          {!isUser && message.output != null && (
                            <div
                              className={cn(
                                'rounded-xl border border-border/50 bg-card overflow-hidden',
                                isTemplatePreviewActive ? 'w-fit max-w-full' : 'w-full'
                              )}
                            >
                              <div
                                className={cn(
                                  'flex items-center justify-between px-3 py-2 bg-muted/30 border-b border-border/30',
                                  isTemplatePreviewActive && 'w-fit min-w-full'
                                )}
                              >
                                <span className="text-xs font-bold uppercase tracking-wider text-muted-foreground">
                                  {generationType === 'resume'
                                    ? 'Generated Resume'
                                    : generationType === 'cover-letter'
                                      ? 'Generated Cover Letter'
                                      : 'Generated Template'}
                                </span>
                                <div className="flex items-center gap-2">
                                  {generationType === 'resume' && resumePreview && (
                                    <>
                                      <PreviewTemplateSelector
                                        selectedTemplateId={resumePreview.selectedTemplateId}
                                        onTemplateChange={(templateId) => {
                                          setResumePreviewByMessage((prev) => {
                                            const current = prev[message.id];
                                            if (!current) return prev;
                                            if (current.selectedTemplateId === templateId) return prev;
                                            return {
                                              ...prev,
                                              [message.id]: {
                                                ...current,
                                                selectedTemplateId: templateId,
                                              },
                                            };
                                          });
                                        }}
                                        variant="ghost"
                                        size="sm"
                                        className="h-6 w-6 p-0 shrink-0"
                                      />
                                      {!resumePreview.savedResumeId ? (
                                        <Button
                                          type="button"
                                          variant="ghost"
                                          size="sm"
                                          className="h-6 text-xs text-primary hover:text-primary shrink-0"
                                          onClick={() => void handleSaveResumeMessage(message.id)}
                                          disabled={!!isSavingResumeByMessage[message.id]}
                                        >
                                          {isSavingResumeByMessage[message.id] ? (
                                            <Loader2 className="h-3 w-3 mr-1 animate-spin" />
                                          ) : (
                                            <Save className="h-3 w-3 mr-1" />
                                          )}
                                          Save
                                        </Button>
                                      ) : (
                                        <Button
                                          type="button"
                                          variant="ghost"
                                          size="sm"
                                          className="h-6 text-xs text-primary hover:text-primary shrink-0"
                                          onClick={() => router.push(`/resumes/${resumePreview.savedResumeId}`)}
                                        >
                                          <ExternalLink className="h-3 w-3 mr-1" />
                                          View
                                        </Button>
                                      )}
                                    </>
                                  )}
                                  {generationType === 'cover-letter' && coverLetterPreview && (
                                    !coverLetterPreview.savedCoverLetterId ? (
                                      <Button
                                        type="button"
                                        variant="ghost"
                                        size="sm"
                                        className="h-6 text-xs text-primary hover:text-primary shrink-0"
                                        onClick={() => void handleSaveCoverLetterMessage(message.id)}
                                        disabled={!!isSavingCoverLetterByMessage[message.id]}
                                      >
                                        {isSavingCoverLetterByMessage[message.id] ? (
                                          <Loader2 className="h-3 w-3 mr-1 animate-spin" />
                                        ) : (
                                          <Save className="h-3 w-3 mr-1" />
                                        )}
                                        Save
                                      </Button>
                                    ) : (
                                      <Button
                                        type="button"
                                        variant="ghost"
                                        size="sm"
                                        className="h-6 text-xs text-primary hover:text-primary shrink-0"
                                        onClick={() => router.push(`/cover-letters/${coverLetterPreview.savedCoverLetterId}`)}
                                      >
                                        <ExternalLink className="h-3 w-3 mr-1" />
                                        View
                                      </Button>
                                    )
                                  )}
                                  {generationType === 'template' && templatePreviewByMessage[message.id] && (
                                    <>
                                      <Button
                                        type="button"
                                        variant="ghost"
                                        size="sm"
                                        className={cn('h-6 text-xs shrink-0', !templatePreviewByMessage[message.id].showCode && 'text-primary')}
                                        onClick={() => setTemplatePreviewByMessage((prev) => ({
                                          ...prev,
                                          [message.id]: {
                                            ...prev[message.id],
                                            showCode: false,
                                          },
                                        }))}
                                      >
                                        <Eye className="h-3 w-3 mr-1" />
                                        Preview
                                      </Button>
                                      <Button
                                        type="button"
                                        variant="ghost"
                                        size="sm"
                                        className={cn('h-6 text-xs shrink-0', templatePreviewByMessage[message.id].showCode && 'text-primary')}
                                        onClick={() => setTemplatePreviewByMessage((prev) => ({
                                          ...prev,
                                          [message.id]: {
                                            ...prev[message.id],
                                            showCode: true,
                                          },
                                        }))}
                                      >
                                        <Code2 className="h-3 w-3 mr-1" />
                                        Code
                                      </Button>
                                      <Button
                                        type="button"
                                        variant="ghost"
                                        size="sm"
                                        className="h-6 text-xs text-primary hover:text-primary shrink-0"
                                        onClick={() => void handleSaveTemplateMessage(message)}
                                        disabled={!!isSavingTemplateByMessage[message.id]}
                                      >
                                        {isSavingTemplateByMessage[message.id] ? (
                                          <Loader2 className="h-3 w-3 mr-1 animate-spin" />
                                        ) : (
                                          <Save className="h-3 w-3 mr-1" />
                                        )}
                                        Save
                                      </Button>
                                    </>
                                  )}
                                  {hasSavedId && generationType === 'template' && (
                                    <Button
                                      type="button"
                                      variant="ghost"
                                      size="sm"
                                      className="h-6 text-xs text-primary hover:text-primary shrink-0"
                                      onClick={openSavedResource}
                                    >
                                      <ExternalLink className="h-3 w-3 mr-1" />
                                      View
                                    </Button>
                                  )}
                                </div>
                              </div>

                              {generationType === 'resume' && resumePreview ? (
                                <div className="p-2">
                                  <div className="h-[720px] w-full rounded-lg overflow-hidden bg-muted/20">
                                    <ResumePreview
                                      resumeData={resumePreview.resumeData}
                                      showHeader={false}
                                      showCard={false}
                                      disableScaling={false}
                                      templateHtml={resumeTemplateByMessage[message.id]?.htmlTemplate}
                                      className="h-full w-full"
                                      onTemplateChange={() => {
                                        // selection managed via header selector
                                      }}
                                      key={`${message.id}:${resumePreview.selectedTemplateId ?? 'default'}`}
                                    />
                                  </div>
                                </div>
                              ) : generationType === 'cover-letter' && coverLetterPreview ? (
                                <div className="p-4">
                                  <div className="rounded-lg border border-border/40 bg-background p-4">
                                    <MarkdownPreview content={coverLetterPreview.content} />
                                  </div>
                                </div>
                              ) : generationType === 'template' && templatePreviewByMessage[message.id] ? (
                                !templatePreviewByMessage[message.id].showCode && templatePreviewByMessage[message.id].html ? (
                                  <div className="p-0 overflow-x-auto">
                                    <div className="w-fit min-w-0">
                                      <iframe
                                        title="Template preview"
                                        className="border-0 block"
                                        style={{
                                          width: `${Math.max(320, templatePreviewWidthByMessage[message.id] ?? 320)}px`,
                                          height: `${Math.max(320, templatePreviewHeightByMessage[message.id] ?? 320)}px`,
                                        }}
                                      sandbox="allow-same-origin"
                                      srcDoc={templatePreviewByMessage[message.id].html}
                                      onLoad={(event) => {
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

                                          setTemplatePreviewHeightByMessage((prev) => {
                                            if (prev[message.id] === nextHeight) return prev;
                                            return { ...prev, [message.id]: nextHeight };
                                          });

                                          setTemplatePreviewWidthByMessage((prev) => {
                                            if (prev[message.id] === nextWidth) return prev;
                                            return { ...prev, [message.id]: nextWidth };
                                          });
                                        } catch {
                                          // Ignore cross-origin/sandbox access errors
                                        }
                                      }}
                                    />
                                    </div>
                                  </div>
                                ) : (
                                  <pre className="p-3 text-xs text-foreground overflow-auto max-h-80 whitespace-pre-wrap">
                                    {templateHtmlForMessage ?? String(typeof message.output === 'string' ? message.output : JSON.stringify(message.output, null, 2))}
                                  </pre>
                                )
                              ) : (
                                <pre className="p-3 text-xs text-foreground overflow-auto max-h-60">
                                  {String(typeof message.output === 'string' ? message.output : JSON.stringify(message.output, null, 2))}
                                </pre>
                              )}
                            </div>
                          )}

                          <span className="px-1 text-[10px] text-muted-foreground/50">
                            {message.timestamp instanceof Date
                              ? message.timestamp.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
                              : new Date(message.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                          </span>
                        </div>
                      </div>
                    );
                  })}

                  {isGenerating && !state.isStreaming && (
                    <div className="flex items-center gap-2 px-2 text-xs text-muted-foreground">
                      <Loader2 className="h-3.5 w-3.5 animate-spin" />
                      Generating...
                    </div>
                  )}

                  {state.error && (
                    <div className="flex items-start gap-2 rounded-xl border border-destructive/30 bg-destructive/5 px-4 py-3 text-sm text-destructive">
                      <span className="flex-1">{state.error}</span>
                      <button type="button" onClick={abort} className="text-xs underline hover:no-underline">
                        Dismiss
                      </button>
                    </div>
                  )}
                </div>
              )}
            </div>
          </ScrollArea>
        </div>

        <div className="shrink-0 bg-background">
          <div className="max-w-6xl mx-auto px-4 py-4 space-y-3">
            <div className="lg:hidden hidden" aria-hidden="true" />

            {hasSavedId && generationType === 'template' && (
              <div className="flex items-center gap-2 mb-3 px-1 text-xs">
                <span className="text-muted-foreground">
                  Template saved!
                </span>
                <Button
                  type="button"
                  variant="link"
                  size="sm"
                  className="h-auto p-0 text-xs text-primary"
                  onClick={openSavedResource}
                >
                  View it here
                  <ExternalLink className="h-3 w-3 ml-1" />
                </Button>
              </div>
            )}

            <ChatInput
              onSend={handleSend}
              disabled={isGenerating}
              placeholder={
                generationType === 'resume'
                  ? 'Describe the job you\'re targeting, paste a job description, or upload source files...'
                  : generationType === 'cover-letter'
                    ? 'Describe the position you\'re applying for, paste/upload job details...'
                    : 'Describe the template style you want, constraints, colors, and layout...'
              }
              feature={getFeature(generationType)}
              requireModelSelection
              referenceValues={selectedArtifactRefs}
              onReferenceChange={setSelectedArtifactRefs}
              isReferenceLoading={isLoadingArtifacts}
              referencePlaceholder={generationType === 'template' ? 'Select profile/template' : 'Reference artifact (optional)'}
              referenceNoneLabel={generationType === 'template' ? 'Default profile' : 'No reference'}
              referenceOptions={artifactOptions.map((option) => ({
                value: `${option.type}:${option.id}`,
                label: option.label,
                group: generationType === 'template'
                  ? (option.type === 'profile' ? 'profiles' : option.type === 'template' ? 'templates' : 'artifacts')
                  : 'artifacts',
              }))}
            />
          </div>
        </div>
      </div>
    </div>
  );
}
