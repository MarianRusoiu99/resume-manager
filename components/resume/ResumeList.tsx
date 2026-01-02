import { ResumeCard } from '@/components/resume/ResumeCard';
import { Gallery } from '@/components/shared/Gallery';
import { useRouter } from 'next/navigation';
import { FileText } from 'lucide-react';
import type { Resume as JsonResume } from '@/lib/validations/jsonresume';

export interface ResumeListItem {
    id: string;
    jobTitle: string | null;
    companyName: string | null;
    jobDescription: string | null;
    content: JsonResume;
    templateId: string | null;
    createdAt: string;
}

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
    const router = useRouter();

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
                    createdAt={resume.createdAt}
                    onView={(id) => router.push(`/resumes/${id}`)}
                    onEdit={(id) => router.push(`/resumes/${id}/edit`)}
                    onDelete={onDelete}
                />
            )}
        />
    );
}
