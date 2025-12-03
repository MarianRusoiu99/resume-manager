import { CoverLetterCard } from '@/components/cover-letter/CoverLetterCard';
import { Gallery } from '@/components/shared/Gallery';
import { FileText } from 'lucide-react';
import { useRouter } from 'next/navigation';

export interface CoverLetterListItem {
    id: string;
    content: string;
    jobTitle: string | null;
    companyName: string | null;
    createdAt: string;
}

interface CoverLetterListProps {
    coverLetters: CoverLetterListItem[];
    isLoading?: boolean;
    onDelete: (id: string) => void;
    onGenerate: () => void;
    emptyMessage?: string;
}

export function CoverLetterList({
    coverLetters,
    isLoading,
    onDelete,
    onGenerate,
}: CoverLetterListProps) {
    const router = useRouter();

    return (
        <Gallery
            items={coverLetters}
            getItemKey={(coverLetter) => coverLetter.id}
            isLoading={isLoading}
            loadingMessage="Loading your cover letters..."
            emptyState={{
                icon: FileText,
                title: "No Cover Letters Yet",
                description: "Start by generating your first cover letter for a job application",
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
                    jobTitle={coverLetter.jobTitle}
                    companyName={coverLetter.companyName}
                    content={coverLetter.content}
                    createdAt={coverLetter.createdAt}
                    onView={(id) => router.push(`/cover-letters/${id}`)}
                    onEdit={(id) => router.push(`/cover-letters/${id}`)}
                    onDelete={onDelete}
                />
            )}
        />
    );
}
