'use client';

import { useMemo } from 'react';
import { ResumeCard } from '@/components/resume/ResumeCard';
import { FileText, Plus } from 'lucide-react';
import { useRouter } from 'next/navigation';
import { ROUTES } from '@/lib/constants';
import type { ResumeListItem } from './ResumeList';
import { deleteResume } from '@/app/actions/resume';
import { ResourceList } from '@/components/shared/ResourceList';
import { useResourceCollection } from '@/hooks/useResourceCollection';

interface ResumeListClientProps {
    resumes: ResumeListItem[];
    searchTerm?: string;
}

export function ResumeListClient({
    resumes,
    searchTerm = ''
}: ResumeListClientProps) {
    const router = useRouter();

    const { items: optimisticResumes, handleDelete } = useResourceCollection({
        initialItems: resumes,
        onDelete: deleteResume,
        resourceName: "Resume"
    });

    const filteredResumes = useMemo(() => {
        if (!searchTerm) return optimisticResumes;
        const lowerTerm = searchTerm.toLowerCase();
        return optimisticResumes.filter(resume => 
            (resume.jobTitle?.toLowerCase().includes(lowerTerm)) ||
            (resume.companyName?.toLowerCase().includes(lowerTerm))
        );
    }, [optimisticResumes, searchTerm]);

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
        <ResourceList
            items={filteredResumes}
            emptyState={{
                title: "No Resumes Yet",
                description: searchTerm 
                    ? `No resumes match "${searchTerm}"`
                    : "Generate your first AI-optimized resume to start your job application",
                actionLabel: searchTerm ? undefined : "Generate Resume",
                onAction: searchTerm ? undefined : handleGenerate
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
                    onDelete={handleDelete}
                />
            )}
        />
    );
}
