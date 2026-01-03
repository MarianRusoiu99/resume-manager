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

import { ResourceGallery } from '@/components/shared/ResourceGallery';
import { deleteResume } from '@/app/actions/resume';

export function ResumeListClient({
    resumes,
    searchTerm
}: ResumeListClientProps) {
    const router = useRouter();

    const handleView = (id: string) => {
        router.push(`/resumes/${id}`);
    };

    const handleEdit = (id: string) => {
        router.push(`/resumes/${id}/edit`);
    };

    const handleGenerate = () => {
        router.push(ROUTES.GENERATE);
    };

    return (
        <ResourceGallery
            initialItems={resumes}
            resourceName="Resume"
            onDelete={deleteResume}
            searchTerm={searchTerm}
            getItemKey={(resume) => resume.id}
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
            renderItem={(resume, { onDelete }) => (
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
