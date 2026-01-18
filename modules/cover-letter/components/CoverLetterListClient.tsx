'use client';

import { useMemo } from 'react';
import { useRouter } from 'next/navigation';
import { ROUTES } from '@/lib/constants';
import { deleteCoverLetter } from '@/app/actions/cover-letter';
import { ResourceList } from '@/components/core/data-display/ResourceList';
import { CoverLetterCard } from './CoverLetterCard';
import type { CoverLetterListItem } from './CoverLetterList';
import { useResourceCollection } from '@/hooks/useResourceCollection';

interface CoverLetterListClientProps {
    coverLetters: CoverLetterListItem[];
    searchTerm?: string;
    onDelete?: (id: string) => Promise<{ success: boolean; error?: string }>;
}

export function CoverLetterListClient({
    coverLetters,
    searchTerm = '',
    onDelete
}: CoverLetterListClientProps) {
    const router = useRouter();

    const { items: optimisticCoverLetters, handleDelete } = useResourceCollection({
        initialItems: coverLetters,
        onDelete: onDelete || deleteCoverLetter,
        resourceName: "Cover Letter"
    });

    const filteredCoverLetters = useMemo(() => {
        if (!searchTerm) return optimisticCoverLetters;
        const lowerTerm = searchTerm.toLowerCase();
        return optimisticCoverLetters.filter(cl => 
            (cl.jobPosting?.title?.toLowerCase().includes(lowerTerm)) ||
            (cl.jobPosting?.company?.name?.toLowerCase().includes(lowerTerm)) ||
            (cl.content?.toLowerCase().includes(lowerTerm))
        );
    }, [optimisticCoverLetters, searchTerm]);

    const handleGenerate = () => {
        router.push(ROUTES.GENERATE_COVER_LETTER);
    };

    return (
        <ResourceList
            items={filteredCoverLetters}
            emptyState={{
                title: "No Cover Letters Yet",
                description: searchTerm 
                    ? `No cover letters match "${searchTerm}"`
                    : "Start by generating your first cover letter for a job application",
                actionLabel: searchTerm ? undefined : "Generate Cover Letter",
                onAction: searchTerm ? undefined : handleGenerate,
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
