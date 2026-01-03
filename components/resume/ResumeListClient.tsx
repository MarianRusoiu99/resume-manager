'use client';

import { useOptimistic, useTransition } from 'react';
import { ResumeCard } from '@/components/resume/ResumeCard';
import { Gallery } from '@/components/shared/Gallery';
import { useResumeOperations } from '@/hooks/features/useResumeOperations';
import { FileText } from 'lucide-react';
import { useRouter } from 'next/navigation';
import { ROUTES } from '@/lib/constants';
import type { ResumeListItem } from './ResumeList';

interface ResumeListClientProps {
    resumes: ResumeListItem[];
    searchTerm?: string;
}

export function ResumeListClient({
    resumes,
    searchTerm
}: ResumeListClientProps) {
    const router = useRouter();
    const { handleView, handleEdit, handleDelete } = useResumeOperations();
    const [isPending, startTransition] = useTransition();
    
    const [optimisticResumes, removeResumeOptimistically] = useOptimistic(
        resumes,
        (state, id: string) => state.filter(r => r.id !== id)
    );

    const onDelete = async (id: string) => {
        startTransition(async () => {
            removeResumeOptimistically(id);
            await handleDelete(id);
        });
    };

    const handleGenerate = () => {
        router.push(ROUTES.GENERATE);
    };

    return (
        <Gallery
            items={optimisticResumes}
            getItemKey={(resume) => resume.id}
            loadingMessage="Loading your resumes..."
            searchTerm={searchTerm}
            emptyState={{
                icon: FileText,
                title: "No Resumes Yet",
                description: "Generate your first AI-optimized resume to start your job application",
                action: {
                    label: "Generate Resume",
                    onClick: handleGenerate,
                    icon: <FileText className="w-4 h-4" />,
                },
            }}
            renderItem={(resume) => (
                <ResumeCard
                    key={resume.id}
                    id={resume.id}
                    jobTitle={resume.jobTitle}
                    companyName={resume.companyName}
                    jobDescription={resume.jobDescription}
                    content={resume.content}
                    templateId={resume.templateId}
                    createdAt={resume.createdAt}
                    onView={handleView}
                    onEdit={handleEdit}
                    onDelete={onDelete}
                />
            )}
        />
    );
}
