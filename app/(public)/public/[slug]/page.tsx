import { profileRepository } from "@/lib/repositories/profiles.repository";
import { notFound } from "next/navigation";
import type { Resume } from "@/lib/validations/jsonresume";
import { renderTemplateServerSide } from "@/lib/templates/renderers/server";
import type { ResumeTemplate } from "@/lib/templates/template";

interface PublicResumePageProps {
  params: Promise<{ slug: string }>;
}

export default async function PublicResumePage({ params }: PublicResumePageProps) {
  const { slug } = await params;

  // Find profile by public slug (includes selected template)
  const profile = await profileRepository.findByPublicSlug(slug);

  if (!profile || !profile.isPublic) {
    notFound();
  }

  const resume = profile.resume as Resume;
  
  // Cast the selected template to the expected type
  const selectedTemplate = profile.selectedTemplate as ResumeTemplate | null;

  // Render resume using the profile's selected template (or default)
  const renderedHtml = await renderTemplateServerSide({
    resumeData: resume,
    template: selectedTemplate,
    templateId: profile.templateId,
  });

  // If no template is available, show a simple fallback
  if (!renderedHtml) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-gray-50 to-gray-100 flex items-center justify-center">
        <div className="text-center p-8">
          <h1 className="text-2xl font-bold text-gray-800 mb-4">Resume Unavailable</h1>
          <p className="text-gray-600">The template for this resume is currently unavailable.</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen w-full bg-gradient-to-br from-gray-50 to-gray-100">
      <div className="container   mx-auto py-8 px-4">
        {/* Resume rendered with the user's selected template */}
        <div className="flex justify-center">
          <div
            className="w-full bg-white rounded-lg shadow-2xl overflow-hidden"
            dangerouslySetInnerHTML={{ __html: renderedHtml }}
          />
        </div>
        
      </div>
    </div>
  );
}
