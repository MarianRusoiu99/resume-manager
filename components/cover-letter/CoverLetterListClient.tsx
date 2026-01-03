'use client';

import { useOptimistic, useTransition } from 'react';
import { CoverLetterCard } from '@/components/cover-letter/CoverLetterCard';
import { Gallery } from '@/components/shared/Gallery';
import { FileText } from 'lucide-react';
import { useRouter } from 'next/navigation';
import { ROUTES } from '@/lib/constants';
import type { CoverLetterListItem } from './CoverLetterList';

interface CoverLetterListClientProps {
    coverLetters: CoverLetterListItem[];
    onDelete: (id: string) => void;
    onGenerate: () => void;
    searchTerm?: string;
}

export function CoverLetterListClient({
    coverLetters,
    onDelete,
    onGenerate,
    searchTerm
}: CoverLetterListClientProps) {
    const router = useRouter();
    const [isPending, startTransition] = useTransition();

    const [optimisticLetters, removeLetterOptimistically] = useOptimistic(
        coverLetters,
        (state, id: string) => state.filter(cl => cl.id !== id)
    );

    const handleDelete = async (id: string) => {
        startTransition(async () => {
            removeLetterOptimistically(id);
            await onDelete(id);
        });
    };

    return (
        <Gallery
            items={optimisticLetters}
            getItemKey={(coverLetter) => coverLetter.id}
            loadingMessage="Loading your cover letters..."
            searchTerm={searchTerm}
            emptyState={{
                icon: FileText,
                title: "No Cover Letters Yet",
                description: searchTerm 
                    ? `No cover letters match "${searchTerm}"`
                    : "Start by generating your first cover letter for a job application",
                action: {
                    label: "Generate Cover Letter",
                    onClick: onGenerate,
                    icon: <FileText className="w-4 h-4" />,
                },
            }}
            renderItem={(coverLetter) => (
                <CoverLetterCard
                    key={coverLetter.id}
                    id={coverLetter.id}
                    jobTitle={coverLetter.jobPosting?.title ?? null}
                    companyName={coverLetter.jobPosting?.company?.name ?? null}
                    content={coverLetter.content}
                    createdAt={coverLetter.createdAt}
                    onView={(id) => router.push(ROUTES.COVER_LETTER(id))}
                    onEdit={(id) => router.push(ROUTES.COVER_LETTER(id))}
                    onDelete={handleDelete}
                />
            )}
        />
    );
}
