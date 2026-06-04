'use client';

import { useState, useCallback, useRef, useEffect, useMemo } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { FileText, Mail, Palette, Plus, MessageSquare, Trash2, PanelLeftClose, PanelLeftOpen, BrainCircuit, Paperclip } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { ScrollArea } from '@/components/ui/scroll-area';
import { renderTemplateServerSide } from '@/components/core/data-display/rendering/client-renderer';
import { sampleResume } from '@/lib/templates/constants/sample-resume';
import { getProfile, getProfiles } from '@/app/actions/profile';
import { getResume, getResumes } from '@/app/actions/resume';
import { getTemplate, getTemplates } from '@/app/actions/template';
import { ChatInput } from '@/components/chat/ChatInput';
import { ReasoningBlock } from '@/components/chat/ReasoningBlock';
import {
  GenerationOutputCard,
  SaveButton,
  ViewButton,
  PreviewCodeToggle,
  IframePreview,
  CodeBlock,
} from './GenerationOutputCard';
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
  truncateTitle,
  RESUME_ACTIONS,
  COVER_LETTER_ACTIONS,
  TEMPLATE_ACTIONS,
  type GenerationType,
  type SessionMeta,
} from '../hooks/useSessionManager';
import { ArtifactSelectorModal } from './ArtifactSelectorModal';
import { MemoryDrawer } from './MemoryDrawer';
import { ModelSelector } from './ModelSelector';
import {
  useGenerationSave,
  type ResumePreviewState,
  type CoverLetterPreviewState,
} from '../hooks/useGenerationSave';

interface FullPageChatProps {
  defaultType?: GenerationType;
}

interface ArtifactReference {
  id: string;
  label: string;
  type: 'profile' | 'resume' | 'cover-letter' | 'template';
}

export function FullPageChat({ defaultType = 'resume' }: FullPageChatProps) {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [generationType, setGenerationType] = useState<GenerationType>(defaultType);
  const [templatePreviewByMessage, setTemplatePreviewByMessage] = useState<Record<string, { html: string; showCode: boolean }>>({});
  const [resumePreviewByMessage, setResumePreviewByMessage] = useState<Record<string, ResumePreviewState>>({});
  const [coverLetterPreviewByMessage, setCoverLetterPreviewByMessage] = useState<Record<string, CoverLetterPreviewState>>({});
  const [resumeDefaultTemplateId, setResumeDefaultTemplateId] = useState<string | null>(null);
  const [resumeTemplateByMessage, setResumeTemplateByMessage] = useState<Record<string, { templateId: string; htmlTemplate: string }>>({});
  const [templatePreviewHeightByMessage, setTemplatePreviewHeightByMessage] = useState<Record<string, number>>({});
  const [templatePreviewWidthByMessage, setTemplatePreviewWidthByMessage] = useState<Record<string, number>>({});
  const [templatePreviewResume, setTemplatePreviewResume] = useState<Resume>(sampleResume as Resume);
  const [coverLetterShowCodeByMessage, setCoverLetterShowCodeByMessage] = useState<Record<string, boolean>>({});
  const [artifactOptions, setArtifactOptions] = useState<ArtifactReference[]>([]);
  const [selectedArtifactRefs, setSelectedArtifactRefs] = useState<string[]>([]);
  const [isLoadingArtifacts, setIsLoadingArtifacts] = useState(false);
  // Track whether we've loaded refs for the current session (avoid overwrite on first render)
  const refsHydratedForSession = useRef<string | null>(null);
  const [hydratedResumeRefs, setHydratedResumeRefs] = useState<Record<string, Resume>>({});
  const [hydratedProfileRefs, setHydratedProfileRefs] = useState<Record<string, Resume>>({});
  const scrollRef = useRef<HTMLDivElement>(null);

  // ── Drawers & modals ────────────────────────────────────────────────────
  const [isArtifactModalOpen, setIsArtifactModalOpen] = useState(false);
  const [isMemoryDrawerOpen, setIsMemoryDrawerOpen] = useState(false);

  // ── Memory — session-scoped, resets on session switch ────────────────────
  const [sessionMemory, setSessionMemory] = useState<string>('');

  const mode = getMode(generationType);

  // ── Session management ─────────────────────────────────────────────────
  const {
    historyByType,
    activeByType,
    isHistoryCollapsed,
    isClientHydrated,
    activeSessionId,
    setIsHistoryCollapsed,
    setActiveByType,
    setHistoryByType,
    handleCreateSession: _handleCreateSession,
    handleDeleteSession,
    modelByType,
    setModelForType,
  } = useSessionManager({ generationType, mode });

  // Title update needs state.messages which comes from useConversation below

  const handleCreateSession = useCallback((type: GenerationType) => {
    _handleCreateSession(type);
    setSelectedArtifactRefs([]);
  }, [_handleCreateSession]);

  const handleDeleteSessionWithRefs = useCallback((type: GenerationType, sessionId: string) => {
    handleDeleteSession(type, sessionId);
    try {
      window.localStorage.removeItem(`fullpage-chat:refs:${sessionId}`);
    } catch {
      // ignore
    }
  }, [handleDeleteSession]);

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

  const persistenceKey = useMemo(
    () => `fullpage-chat:${mode}:${activeSessionId}`,
    [mode, activeSessionId]
  );

  // ── Persist and restore selectedArtifactRefs per session ──────────────
  const sessionRefsKey = `fullpage-chat:refs:${activeSessionId}`;

  // Restore refs when the active session changes
  useEffect(() => {
    if (refsHydratedForSession.current === activeSessionId) return;
    refsHydratedForSession.current = activeSessionId;
    try {
      const raw = window.localStorage.getItem(sessionRefsKey);
      setSelectedArtifactRefs(raw ? (JSON.parse(raw) as string[]) : []);
    } catch {
      setSelectedArtifactRefs([]);
    }
  }, [activeSessionId, sessionRefsKey]);

  // Write refs whenever they change (after hydration)
  useEffect(() => {
    if (refsHydratedForSession.current !== activeSessionId) return;
    try {
      window.localStorage.setItem(sessionRefsKey, JSON.stringify(selectedArtifactRefs));
    } catch {
      // ignore quota / private-mode errors
    }
  }, [selectedArtifactRefs, activeSessionId, sessionRefsKey]);

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

  // ── Title update from first user message ────────────────────────────────
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
  }, [state.messages, generationType, activeSessionId, setHistoryByType]);

  const hasMessages = state.messages.length > 0;
  const activeResumePreview = generationType === 'resume'
    ? [...state.messages]
      .reverse()
      .find((message) => message.role === 'assistant' && !!resumePreviewByMessage[message.id])
    : undefined;
  const activeSavedResumeId = activeResumePreview
    ? resumePreviewByMessage[activeResumePreview.id]?.savedResumeId
    : undefined;
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

  // ── Load template HTML whenever a resume message's selectedTemplateId changes ─
  useEffect(() => {
    if (generationType !== 'resume') return;

    const entries = Object.entries(resumePreviewByMessage);
    const missing = entries.filter(([messageId, preview]) => {
      if (!preview.selectedTemplateId) return false;
      const cached = resumeTemplateByMessage[messageId];
      return !cached || cached.templateId !== preview.selectedTemplateId;
    });
    if (missing.length === 0) return;

    let cancelled = false;
    const fetchMissing = async () => {
      for (const [messageId, preview] of missing) {
        if (!preview.selectedTemplateId) continue;
        const result = await getTemplate(preview.selectedTemplateId);
        if (cancelled) return;
        if (!result.success || !result.data?.htmlTemplate) continue;
        setResumeTemplateByMessage((prev) => ({
          ...prev,
          [messageId]: {
            templateId: preview.selectedTemplateId!,
            htmlTemplate: result.data.htmlTemplate,
          },
        }));
      }
    };

    void fetchMissing();
    return () => { cancelled = true; };
  }, [generationType, resumePreviewByMessage, resumeTemplateByMessage]);

  useEffect(() => {
    if (generationType !== 'cover-letter') {
      setCoverLetterPreviewByMessage((prev) => (Object.keys(prev).length > 0 ? {} : prev));
      setCoverLetterShowCodeByMessage((prev) => (Object.keys(prev).length > 0 ? {} : prev));
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
    modelId: messageModelId,
  }: {
    message: string;
    attachments?: ConversationAttachment[];
    modelId?: string;
  }) => {
    const trimmed = message.trim();
    if (!trimmed && (!attachments || attachments.length === 0)) return;
    const resolvedModelId = messageModelId ?? modelByType[generationType] ?? undefined;
    await sendMessage({
      message: trimmed,
      attachments,
      modelId: resolvedModelId,
      contextOverride: artifactContextOverride,
      stream: true,
      agentMemory: sessionMemory || undefined,
    });
  }, [sendMessage, artifactContextOverride, modelByType, generationType, sessionMemory]);

  const handleQuickAction = useCallback(async (prompt: string) => {
    await sendMessage({ message: prompt, contextOverride: artifactContextOverride, stream: true });
  }, [sendMessage, artifactContextOverride]);

  // ── Memory handlers (session-scoped only) ──────────────────────────────
  const handleMemorySave = useCallback((_mode: string, content: string) => {
    setSessionMemory(content);
  }, []);

  const handleMemoryDelete = useCallback((_mode: string) => {
    setSessionMemory('');
  }, []);

  // Reset memory when session switches
  useEffect(() => {
    setSessionMemory('');
  }, [activeSessionId]);

  // ── Keyboard shortcuts ──────────────────────────────────────────────────
  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key === 'k') {
        e.preventDefault();
        setIsArtifactModalOpen(true);
      }
      if ((e.metaKey || e.ctrlKey) && e.key === 'm') {
        e.preventDefault();
        setIsMemoryDrawerOpen(true);
      }
    };
    window.addEventListener('keydown', handler);
    return () => window.removeEventListener('keydown', handler);
  }, []);

  // ── Save management ────────────────────────────────────────────────────
  const {
    isSavingTemplateByMessage,
    isSavingResumeByMessage,
    isSavingCoverLetterByMessage,
    templateSavedIdByMessage,
    handleSaveTemplateMessage,
    handleSaveResumeMessage,
    handleSaveCoverLetterMessage,
  } = useGenerationSave({
    resumePreviewByMessage,
    setResumePreviewByMessage,
    coverLetterPreviewByMessage,
    setCoverLetterPreviewByMessage,
    router,
  });

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
                    onClick={() => handleDeleteSessionWithRefs(generationType, session.id)}
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
                          {/* ── User attachment chips ──────────────────────────────────────── */}
                          {isUser && message.attachments && message.attachments.length > 0 && (
                            <div className="flex flex-wrap justify-end gap-1.5">
                              {message.attachments.map((att, i) => (
                                <span
                                  key={i}
                                  className="inline-flex items-center gap-1 rounded-md border border-border/50 bg-muted/40 px-2 py-0.5 text-[11px] text-muted-foreground"
                                  title={att.name}
                                >
                                  <span className="size-2.5 shrink-0">
                                    {att.type === 'image' ? '🖼' : '📄'}
                                  </span>
                                  <span className="max-w-[160px] truncate">{att.name}</span>
                                </span>
                              ))}
                            </div>
                          )}
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
                            <GenerationOutputCard
                              label={
                                generationType === 'resume'
                                  ? 'Generated Resume'
                                  : generationType === 'cover-letter'
                                    ? 'Generated Cover Letter'
                                    : 'Generated Template'
                              }
                              wide={isTemplatePreviewActive}
                              headerActions={
                                <>
                                  {/* Resume: template selector + save/view */}
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
                                        <SaveButton
                                          onClick={() => void handleSaveResumeMessage(message.id)}
                                          disabled={!!isSavingResumeByMessage[message.id]}
                                          loading={!!isSavingResumeByMessage[message.id]}
                                        />
                                      ) : (
                                        <ViewButton onClick={() => router.push(`/resumes/${resumePreview.savedResumeId}`)} />
                                      )}
                                    </>
                                  )}

                                  {/* Cover letter: preview/code toggle + save/view */}
                                  {generationType === 'cover-letter' && coverLetterPreview && (
                                    <>
                                      <PreviewCodeToggle
                                        showCode={!!coverLetterShowCodeByMessage[message.id]}
                                        onToggle={(showCode) => setCoverLetterShowCodeByMessage((prev) => ({
                                          ...prev,
                                          [message.id]: showCode,
                                        }))}
                                      />
                                      {!coverLetterPreview.savedCoverLetterId ? (
                                        <SaveButton
                                          onClick={() => void handleSaveCoverLetterMessage(message.id)}
                                          disabled={!!isSavingCoverLetterByMessage[message.id]}
                                          loading={!!isSavingCoverLetterByMessage[message.id]}
                                        />
                                      ) : (
                                        <ViewButton onClick={() => router.push(`/cover-letters/${coverLetterPreview.savedCoverLetterId}`)} />
                                      )}
                                    </>
                                  )}

                                  {/* Template: preview/code toggle + save + view */}
                                  {generationType === 'template' && templatePreviewByMessage[message.id] && (
                                    <>
                                      <PreviewCodeToggle
                                        showCode={templatePreviewByMessage[message.id].showCode}
                                        onToggle={(showCode) => setTemplatePreviewByMessage((prev) => ({
                                          ...prev,
                                          [message.id]: {
                                            ...prev[message.id],
                                            showCode,
                                          },
                                        }))}
                                      />
                                      {templateSavedIdByMessage[message.id] ? (
                                        <ViewButton onClick={() => router.push(`/templates/${templateSavedIdByMessage[message.id]}`)} />
                                      ) : (
                                        <SaveButton
                                          onClick={() => void handleSaveTemplateMessage(message)}
                                          disabled={!!isSavingTemplateByMessage[message.id]}
                                          loading={!!isSavingTemplateByMessage[message.id]}
                                        />
                                      )}
                                    </>
                                  )}
                                </>
                              }
                            >
                              {/* ── Resume preview ───────────────────────────── */}
                              {generationType === 'resume' && resumePreview ? (
                                <div className="p-3">
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
                              ) : null}

                              {/* ── Cover letter preview ────────────────────── */}
                              {generationType === 'cover-letter' && coverLetterPreview ? (
                                <div className="p-3">
                                  {coverLetterShowCodeByMessage[message.id] ? (
                                    <CodeBlock>{coverLetterPreview.content}</CodeBlock>
                                  ) : (
                                    <div className="h-[720px] w-full rounded-lg overflow-auto bg-muted/20 p-6">
                                      <MarkdownPreview content={coverLetterPreview.content} />
                                    </div>
                                  )}
                                </div>
                              ) : null}

                              {/* ── Template preview ────────────────────────── */}
                              {generationType === 'template' && templatePreviewByMessage[message.id] ? (
                                !templatePreviewByMessage[message.id].showCode && templatePreviewByMessage[message.id].html ? (
                                  <div className="p-3">
                                    <div className="h-[720px] w-full rounded-lg overflow-hidden bg-muted/20">
                                      <IframePreview
                                        srcDoc={templatePreviewByMessage[message.id].html}
                                        width={templatePreviewWidthByMessage[message.id]}
                                        height={templatePreviewHeightByMessage[message.id]}
                                        onSizeChange={(size) => {
                                          setTemplatePreviewWidthByMessage((prev) => {
                                            if (prev[message.id] === size.width) return prev;
                                            return { ...prev, [message.id]: size.width };
                                          });
                                          setTemplatePreviewHeightByMessage((prev) => {
                                            if (prev[message.id] === size.height) return prev;
                                            return { ...prev, [message.id]: size.height };
                                          });
                                        }}
                                      />
                                    </div>
                                  </div>
                                ) : (
                                  <div className="p-3">
                                    <CodeBlock>
                                      {templateHtmlForMessage ?? String(typeof message.output === 'string' ? message.output : JSON.stringify(message.output, null, 2))}
                                    </CodeBlock>
                                  </div>
                                )
                              ) : null}

                              {/* ── Fallback for no preview ─────────────────── */}
                              {!resumePreview && !coverLetterPreview && !(generationType === 'template' && templatePreviewByMessage[message.id]) && (
                                <CodeBlock>
                                  {String(typeof message.output === 'string' ? message.output : JSON.stringify(message.output, null, 2))}
                                </CodeBlock>
                              )}
                            </GenerationOutputCard>
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

                  {isGenerating && state.messages[state.messages.length - 1]?.role === 'user' && (
                    <div className="w-full flex gap-4 justify-start">
                      <div className="shrink-0 h-8 w-8 rounded-full bg-primary/10 flex items-center justify-center mt-0.5">
                        <span className="text-xs font-bold text-primary">AI</span>
                      </div>
                      <div className="flex items-center gap-2 rounded-2xl rounded-bl-md bg-muted px-4 py-3">
                        <span className="size-1.5 animate-bounce rounded-full bg-muted-foreground [animation-delay:0ms]" />
                        <span className="size-1.5 animate-bounce rounded-full bg-muted-foreground [animation-delay:150ms]" />
                        <span className="size-1.5 animate-bounce rounded-full bg-muted-foreground [animation-delay:300ms]" />
                      </div>
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

            {/* Toolbar row: artifact picker, memory, skills, model selector */}
            <div className="flex items-center gap-1 px-1 pb-1 flex-wrap">
              <Button
                type="button"
                variant="ghost"
                size="sm"
                className="h-7 px-2 text-xs gap-1.5 text-muted-foreground hover:text-foreground"
                onClick={() => setIsArtifactModalOpen(true)}
              >
                <Paperclip className="h-3.5 w-3.5" />
                {selectedArtifactRefs.length > 0 ? `${selectedArtifactRefs.length} reference${selectedArtifactRefs.length > 1 ? 's' : ''}` : 'References'}
                <kbd className="ml-1 text-[10px] text-muted-foreground/60">⌘K</kbd>
              </Button>
              <Button
                type="button"
                variant="ghost"
                size="sm"
                className="h-7 px-2 text-xs gap-1.5 text-muted-foreground hover:text-foreground"
                onClick={() => setIsMemoryDrawerOpen(true)}
              >
                <BrainCircuit className="h-3.5 w-3.5" />
                Memory
                {sessionMemory && (
                  <span className="h-1.5 w-1.5 rounded-full bg-primary" />
                )}
              </Button>
              <div className="ml-auto">
                <ModelSelector
                  modelId={modelByType[generationType]}
                  onChange={(id) => setModelForType(generationType, id)}
                  generationType={generationType}
                />
              </div>
            </div>

            <ChatInput
              key={`${generationType}:${activeSessionId}`}
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

      <ArtifactSelectorModal
        open={isArtifactModalOpen}
        onOpenChange={setIsArtifactModalOpen}
        generationType={generationType}
        artifactOptions={artifactOptions.map(o => ({ ...o, id: `${o.type}:${o.id}` }))}
        selectedArtifactRefs={selectedArtifactRefs}
        onSelectionChange={setSelectedArtifactRefs}
        isLoading={isLoadingArtifacts}
      />
      <MemoryDrawer
        open={isMemoryDrawerOpen}
        onOpenChange={setIsMemoryDrawerOpen}
        generationType={generationType}
        memoryContent={sessionMemory}
        onSave={(_mode, content) => setSessionMemory(content)}
        onDelete={() => setSessionMemory('')}
      />
    </div>
  );
}
