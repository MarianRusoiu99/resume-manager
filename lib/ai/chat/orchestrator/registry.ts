import type { AIMode } from '../../modes/types';
import type { ConversationMode } from '../conversation';

/**
 * Mode registry
 */
const modeRegistry = new Map<ConversationMode, AIMode>();

/**
 * Registers a mode in the registry
 */
export function registerMode(mode: AIMode): void {
  modeRegistry.set(mode.id, mode);
}

/**
 * Gets a mode by ID
 */
export function getMode(modeId: ConversationMode): AIMode | undefined {
  return modeRegistry.get(modeId);
}

/**
 * Gets a mode or throws if not found
 */
export function getModeOrThrow(modeId: ConversationMode): AIMode {
  const mode = modeRegistry.get(modeId);
  if (!mode) {
    throw new Error(`Mode '${modeId}' not found in registry`);
  }
  return mode;
}
