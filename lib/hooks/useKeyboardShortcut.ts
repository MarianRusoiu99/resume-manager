/**
 * Custom hook for keyboard shortcuts
 * Provides a simple way to add keyboard shortcuts to components
 */

import { useEffect, useCallback } from 'react';

export type KeyCombo = {
  key: string;
  ctrl?: boolean;
  alt?: boolean;
  shift?: boolean;
  meta?: boolean; // Command key on Mac
};

export function useKeyboardShortcut(
  combo: KeyCombo,
  callback: () => void,
  enabled: boolean = true
) {
  const handleKeyPress = useCallback(
    (event: KeyboardEvent) => {
      if (!enabled) return;

      const matchesKey = event.key.toLowerCase() === combo.key.toLowerCase();
      const matchesCtrl = combo.ctrl ? event.ctrlKey : !event.ctrlKey;
      const matchesAlt = combo.alt ? event.altKey : !event.altKey;
      const matchesShift = combo.shift ? event.shiftKey : !event.shiftKey;
      const matchesMeta = combo.meta ? event.metaKey : !event.metaKey;

      if (matchesKey && matchesCtrl && matchesAlt && matchesShift && matchesMeta) {
        event.preventDefault();
        callback();
      }
    },
    [combo, callback, enabled]
  );

  useEffect(() => {
    window.addEventListener('keydown', handleKeyPress);

    return () => {
      window.removeEventListener('keydown', handleKeyPress);
    };
  }, [handleKeyPress]);
}

/**
 * Hook for escape key to close modals/dialogs
 */
export function useEscapeKey(callback: () => void, enabled: boolean = true) {
  useKeyboardShortcut({ key: 'Escape' }, callback, enabled);
}

/**
 * Hook for Ctrl+S / Cmd+S to save
 */
export function useSaveShortcut(callback: () => void, enabled: boolean = true) {
  const handleSave = useCallback(() => {
    callback();
  }, [callback]);

  useEffect(() => {
    if (!enabled) return;

    const handleKeyPress = (event: KeyboardEvent) => {
      // Ctrl+S or Cmd+S (Mac)
      if ((event.ctrlKey || event.metaKey) && event.key.toLowerCase() === 's') {
        event.preventDefault();
        handleSave();
      }
    };

    window.addEventListener('keydown', handleKeyPress);

    return () => {
      window.removeEventListener('keydown', handleKeyPress);
    };
  }, [handleSave, enabled]);
}

/**
 * Hook for Enter key submission
 */
export function useEnterKey(callback: () => void, enabled: boolean = true) {
  useKeyboardShortcut({ key: 'Enter' }, callback, enabled);
}
