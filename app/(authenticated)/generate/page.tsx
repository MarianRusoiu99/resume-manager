'use client';

import { useSearchParams } from 'next/navigation';
import { FullPageChat } from '@/modules/chat-panel/components/FullPageChat';

export default function GeneratePage() {
  const searchParams = useSearchParams();
  const tab = searchParams.get('tab');
  const defaultType = tab === 'cover-letter'
    ? 'cover-letter' as const
    : tab === 'template'
      ? 'template' as const
      : 'resume' as const;

  return <FullPageChat defaultType={defaultType} />;
}
