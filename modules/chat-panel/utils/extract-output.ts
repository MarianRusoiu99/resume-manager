import type { ConversationMessage } from '@/modules/ai-enhance/hooks/useConversation';
import type { Resume } from '@/lib/validations/jsonresume';

export function extractResumeData(message: ConversationMessage): Resume | null {
  const fromUnknown = (value: unknown): Resume | null => {
    if (!value || typeof value !== 'object') return null;

    const candidate = value as Record<string, unknown>;
    if (candidate.resume && typeof candidate.resume === 'object') {
      return candidate.resume as Resume;
    }

    if (candidate.basics || candidate.work || candidate.education || candidate.skills) {
      return candidate as unknown as Resume;
    }

    return null;
  };

  const direct = fromUnknown(message.output);
  if (direct) return direct;

  if (typeof message.output === 'string') {
    try {
      const parsed = JSON.parse(message.output) as unknown;
      const parsedResume = fromUnknown(parsed);
      if (parsedResume) return parsedResume;
    } catch {
      // ignore invalid JSON
    }
  }

  if (typeof message.content === 'string') {
    try {
      const parsed = JSON.parse(message.content) as unknown;
      const parsedResume = fromUnknown(parsed);
      if (parsedResume) return parsedResume;
    } catch {
      // ignore invalid JSON
    }
  }

  return null;
}

export function extractCoverLetterOutput(message: ConversationMessage): { content: string; jobTitle?: string; companyName?: string } | null {
  const fromUnknown = (value: unknown): { content: string; jobTitle?: string; companyName?: string } | null => {
    if (!value) return null;

    if (typeof value === 'string') {
      const trimmed = value.trim();
      if (!trimmed) return null;
      try {
        const parsed = JSON.parse(trimmed) as unknown;
        return fromUnknown(parsed);
      } catch {
        return { content: trimmed };
      }
    }

    if (typeof value === 'object') {
      const candidate = value as Record<string, unknown>;
      if (typeof candidate.content === 'string' && candidate.content.trim().length > 0) {
        return {
          content: candidate.content,
          jobTitle: typeof candidate.jobTitle === 'string' ? candidate.jobTitle : undefined,
          companyName: typeof candidate.companyName === 'string' ? candidate.companyName : undefined,
        };
      }
    }

    return null;
  };

  return fromUnknown(message.output) ?? fromUnknown(message.content);
}

export function extractTemplateHtml(message: ConversationMessage): string | null {
  const looksLikeTemplateCode = (value: string): boolean => {
    const text = value.trim().toLowerCase();
    if (!text) return false;
    return text.includes('<html')
      || text.includes('<style')
      || text.includes('<section')
      || text.includes('<div')
      || text.includes('{{');
  };

  if (message.output && typeof message.output === 'object' && 'htmlTemplate' in message.output) {
    const raw = (message.output as { htmlTemplate?: unknown }).htmlTemplate;
    return typeof raw === 'string' && raw.trim().length > 0 ? raw : null;
  }

  if (typeof message.output === 'string') {
    try {
      const parsed = JSON.parse(message.output) as { htmlTemplate?: unknown };
      if (typeof parsed?.htmlTemplate === 'string' && parsed.htmlTemplate.trim().length > 0) {
        return parsed.htmlTemplate;
      }
    } catch {
      if (looksLikeTemplateCode(message.output)) {
        return message.output;
      }
    }
  }

  if (typeof message.content === 'string') {
    try {
      const parsed = JSON.parse(message.content) as { htmlTemplate?: unknown };
      if (typeof parsed?.htmlTemplate === 'string' && parsed.htmlTemplate.trim().length > 0) {
        return parsed.htmlTemplate;
      }
    } catch {
      if (looksLikeTemplateCode(message.content)) {
        return message.content;
      }
    }
  }

  return null;
}
