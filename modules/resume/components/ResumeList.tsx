import { ResumeCard } from './ResumeCard';
import { Gallery } from '@/components/core/data-display/Gallery';
import { useResourceOperations } from '@/hooks/core/useResourceOperations';
import { FileText } from 'lucide-react';
import type { Resume as JsonResume } from '@/lib/validations/jsonresume';

import type { ResumeListItem } from '@/lib/types';

import { deleteResume } from '@/app/actions/resume';

interface ResumeListProps {
    resumes: ResumeListItem[];
    isLoading?: boolean;
    onDelete: (id: string) => void;
    onGenerate: () => void;
    emptyMessage?: string;
    searchTerm?: string;
}

export function ResumeList({
    resumes,
    isLoading,
    onDelete,
    onGenerate,
    searchTerm
}: ResumeListProps) {
    const { handleView, handleEdit } = useResourceOperations({ 
        basePath: '/resumes', 
        resourceName: 'resume',
        deleteAction: deleteResume
    });

    return (
        <Gallery
            items={resumes}
            getItemKey={(resume) => resume.id}
            isLoading={isLoading}
            loadingMessage="Loading your resumes..."
            searchTerm={searchTerm}
            emptyState={{
                icon: FileText,
                title: "No Resumes Yet",
                description: "Generate your first AI-optimized resume to start your job application",
                action: {
                    label: "Generate Resume",
                    onClick: onGenerate,
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
                    createdAt={resume.createdAt instanceof Date ? resume.createdAt.toISOString() : resume.createdAt}
                    onView={handleView}
                    onEdit={handleEdit}
                    onDelete={onDelete}
                />
            )}
        />
    );
}
