'use client';

import { useCallback, useEffect, useMemo, useRef, useState, type Dispatch, type SetStateAction } from 'react';

const SESSION_ARTIFACT_REFS_KEY_PREFIX = 'fullpage-chat:refs:';

function getSessionArtifactRefsKey(sessionId: string): string {
  return `${SESSION_ARTIFACT_REFS_KEY_PREFIX}${sessionId}`;
}

interface UseSessionArtifactRefsOptions {
  activeSessionId: string;
}

interface UseSessionArtifactRefsReturn {
  selectedArtifactRefs: string[];
  setSelectedArtifactRefs: Dispatch<SetStateAction<string[]>>;
  clearSelectedArtifactRefs: () => void;
  removeSessionArtifactRefsKey: (sessionId: string) => void;
}

export function useSessionArtifactRefs({
  activeSessionId,
}: UseSessionArtifactRefsOptions): UseSessionArtifactRefsReturn {
  const [selectedArtifactRefs, setSelectedArtifactRefsState] = useState<string[]>([]);

  // Track whether we've loaded refs for the current session (avoid overwrite on first render)
  const refsHydratedForSession = useRef<string | null>(null);

  const sessionRefsKey = useMemo(
    () => getSessionArtifactRefsKey(activeSessionId),
    [activeSessionId]
  );

  // Restore refs when the active session changes
  useEffect(() => {
    if (refsHydratedForSession.current === activeSessionId) return;
    refsHydratedForSession.current = activeSessionId;
    try {
      const raw = window.localStorage.getItem(sessionRefsKey);
      // eslint-disable-next-line react-hooks/set-state-in-effect
      setSelectedArtifactRefsState(raw ? (JSON.parse(raw) as string[]) : []);
    } catch {
      setSelectedArtifactRefsState([]);
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

  const setSelectedArtifactRefs = useCallback<Dispatch<SetStateAction<string[]>>>((value) => {
    setSelectedArtifactRefsState(value);
  }, []);

  const clearSelectedArtifactRefs = useCallback(() => {
    setSelectedArtifactRefsState([]);
  }, []);

  const removeSessionArtifactRefsKey = useCallback((sessionId: string) => {
    try {
      window.localStorage.removeItem(getSessionArtifactRefsKey(sessionId));
    } catch {
      // ignore
    }
  }, []);

  return {
    selectedArtifactRefs,
    setSelectedArtifactRefs,
    clearSelectedArtifactRefs,
    removeSessionArtifactRefsKey,
  };
}
