/**
 * Conversation mode
 */
export type ConversationMode =
  | 'resume-generation'
  | 'resume-enhancement'
  | 'cover-letter-generation'
  | 'template-generation'
  | 'template-enhancement'
  | 'text-enhancement';

/**
 * Attachment for sending to the API
 */
export interface ConversationAttachment {
  type: 'document' | 'image' | 'resume' | 'job-description' | 'template';
  name: string;
  content: string;
  mimeType: string;
}

/**
 * Message in the conversation
 */
export interface ConversationMessage {
  id: string;
  role: 'user' | 'assistant';
  content: string;
  timestamp: Date;
  attachments?: ConversationAttachment[];
  /** Structured output from assistant (if available) */
  output?: unknown;
}

/**
 * Context for resume/cover letter generation
 */
export interface ConversationContext {
  userProfile?: {
    resume?: Record<string, unknown>;
    name?: string;
  };
  job?: {
    description?: string;
    title?: string;
    company?: string;
  };
  template?: {
    htmlTemplate?: string;
    name?: string;
  };
  currentResume?: Record<string, unknown>;
  currentCoverLetter?: string;
  personalInstructions?: string;
}

/**
 * Conversation state
 */
export interface ConversationState {
  id: string | null;
  mode: ConversationMode;
  messages: ConversationMessage[];
  context: ConversationContext;
  output: unknown | null;
  isLoading: boolean;
  error: string | null;
}

/**
 * Options for sending a message
 */
export interface SendMessageOptions {
  message: string;
  attachments?: ConversationAttachment[];
  /** Override model for this message */
  modelId?: string;
  /** Use streaming (default: true) */
  stream?: boolean;
  /** Context override for this message (merged with existing context) */
  contextOverride?: Partial<ConversationContext>;
}

/**
 * Hook options
 */
export interface UseConversationOptions {
  mode: ConversationMode;
  initialContext?: ConversationContext;
  /** Called when streaming output updates */
  onStreamUpdate?: (content: string) => void;
  /** Called when generation completes */
  onComplete?: (output: unknown) => void;
  /** Called on error */
  onError?: (error: string) => void;
}

/**
 * Hook return type
 */
export interface UseConversationReturn {
  /** Current conversation state */
  state: ConversationState;
  /** Send a message to the AI */
  sendMessage: (options: SendMessageOptions) => Promise<void>;
  /** Update context */
  updateContext: (context: Partial<ConversationContext>) => void;
  /** Clear conversation and start fresh */
  reset: () => void;
  /** Abort current generation */
  abort: () => void;
  /** Whether currently generating */
  isGenerating: boolean;
}
