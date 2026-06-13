'use client';

import { useCallback, useEffect, type Dispatch, type SetStateAction } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import type { GenerationType } from './useSessionManager';

interface UseGenerationTypeRoutingOptions {
  defaultType?: GenerationType;
  setGenerationType: Dispatch<SetStateAction<GenerationType>>;
}

interface UseGenerationTypeRoutingReturn {
  switchType: (type: GenerationType) => void;
}

export function useGenerationTypeRouting({
  defaultType,
  setGenerationType,
}: UseGenerationTypeRoutingOptions): UseGenerationTypeRoutingReturn {
  const router = useRouter();
  const searchParams = useSearchParams();

  useEffect(() => {
    const tab = searchParams.get('tab');
    if (tab === 'cover-letter' || tab === 'template' || tab === 'resume') {
      setGenerationType(tab);
      return;
    }
    if (defaultType) {
      setGenerationType(defaultType);
    }
  }, [searchParams, defaultType, setGenerationType]);

  const switchType = useCallback((type: GenerationType) => {
    setGenerationType(type);
    const params = new URLSearchParams(searchParams.toString());
    params.set('tab', type);
    router.replace(`/generate?${params.toString()}`);
  }, [router, searchParams, setGenerationType]);

  return { switchType };
}
