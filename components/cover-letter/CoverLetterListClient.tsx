'use client';

import { useRouter } from 'next/navigation';
import { FileText } from 'lucide-react';
import { ROUTES } from '@/lib/constants';
import { deleteCoverLetter } from '@/app/actions/cover-letter';
import { ResourceGallery } from '@/components/shared/ResourceGallery';
import { CoverLetterCard } from '@/components/cover-letter/CoverLetterCard';
import type { CoverLetterListItem } from './CoverLetterList';

interface CoverLetterListClientProps {
    coverLetters: CoverLetterListItem[];
    searchTerm?: string;
    onDelete?: (id: string) => Promise<{ success: boolean; error?: string }>;
    onGenerate?: () => void;
}

type DeleteFn = (id: string) => Promise<{ success: boolean; error?: string }>;

export function CoverLetterListClient({
    coverLetters,
    searchTerm,
    onDelete
}: CoverLetterListClientProps) {
    const router = useRouter();

    const handleGenerate = () => {
        router.push(ROUTES.GENERATE_COVER_LETTER);
    };

    const deleteHandler: DeleteFn = onDelete || deleteCoverLetter;

    return (
        <ResourceGallery
            initialItems={coverLetters}
            resourceName="Cover Letter"
            onDelete={deleteHandler}
            searchTerm={searchTerm}
            getItemKey={(cl: CoverLetterListItem) => cl.id}
            filterFn={(cl: CoverLetterListItem, term: string) => {
                const searchLower = term.toLowerCase();
                return (
                    (cl.jobPosting?.title?.toLowerCase().includes(searchLower)) ||
                    (cl.jobPosting?.company?.name?.toLowerCase().includes(searchLower)) ||
                    (cl.content?.toLowerCase().includes(searchLower))
                );
            }}
            emptyState={{
                icon: FileText,
                title: "No Cover Letters Yet",
                description: searchTerm 
                    ? `No cover letters match "${searchTerm}"`
                    : "Start by generating your first cover letter for a job application",
                action: {
                    label: "Generate Cover Letter",
                    onClick: handleGenerate,
                    icon: <FileText className="w-4 h-4" />,
                },
            }}
            renderItem={(coverLetter: CoverLetterListItem, { onDelete: handleDelete }: { onDelete: (id: string) => void }) => (
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
