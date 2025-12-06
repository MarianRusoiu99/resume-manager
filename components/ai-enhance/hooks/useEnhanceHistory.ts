/**
 * useEnhanceHistory Hook
 * 
 * Manages enhancement history for undo/comparison functionality.
 */

import { useState, useCallback } from 'react';
import type { EnhancementHistoryEntry } from '../types';

interface UseEnhanceHistoryReturn {
  history: EnhancementHistoryEntry[];
  currentIndex: number;
  addEntry: (entry: Omit<EnhancementHistoryEntry, 'id' | 'timestamp'>) => void;
  canUndo: boolean;
  canRedo: boolean;
  undo: () => EnhancementHistoryEntry | null;
  redo: () => EnhancementHistoryEntry | null;
  getCurrentEntry: () => EnhancementHistoryEntry | null;
  clear: () => void;
}

/**
 * Generate unique ID for history entries
 */
function generateId(): string {
  return `history_${Date.now()}_${Math.random().toString(36).slice(2, 9)}`;
}

/**
 * Hook for managing enhancement history
 */
export function useEnhanceHistory(): UseEnhanceHistoryReturn {
  const [history, setHistory] = useState<EnhancementHistoryEntry[]>([]);
  const [currentIndex, setCurrentIndex] = useState(-1);

  /**
   * Add a new entry to history
   */
  const addEntry = useCallback((entry: Omit<EnhancementHistoryEntry, 'id' | 'timestamp'>) => {
    const newEntry: EnhancementHistoryEntry = {
      ...entry,
      id: generateId(),
      timestamp: new Date(),
    };

    setHistory(prev => {
      // Remove any entries after current index (branching)
      const newHistory = prev.slice(0, currentIndex + 1);
      return [...newHistory, newEntry];
    });
    setCurrentIndex(prev => prev + 1);
  }, [currentIndex]);

  /**
   * Check if undo is available
   */
  const canUndo = currentIndex > 0;

  /**
   * Check if redo is available
   */
  const canRedo = currentIndex < history.length - 1;

  /**
   * Undo to previous entry
   */
  const undo = useCallback(() => {
    if (!canUndo) return null;
    const newIndex = currentIndex - 1;
    setCurrentIndex(newIndex);
    return history[newIndex];
  }, [canUndo, currentIndex, history]);

  /**
   * Redo to next entry
   */
  const redo = useCallback(() => {
    if (!canRedo) return null;
    const newIndex = currentIndex + 1;
    setCurrentIndex(newIndex);
    return history[newIndex];
  }, [canRedo, currentIndex, history]);

  /**
   * Get current history entry
   */
  const getCurrentEntry = useCallback(() => {
    if (currentIndex < 0 || currentIndex >= history.length) return null;
    return history[currentIndex];
  }, [currentIndex, history]);

  /**
   * Clear all history
   */
  const clear = useCallback(() => {
    setHistory([]);
    setCurrentIndex(-1);
  }, []);

  return {
    history,
    currentIndex,
    addEntry,
    canUndo,
    canRedo,
    undo,
    redo,
    getCurrentEntry,
    clear,
  };
}
