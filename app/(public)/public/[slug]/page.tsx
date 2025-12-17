import { profileRepository } from "@/lib/repositories/profile.repository";
import { notFound } from "next/navigation";
import type { Resume } from "@/lib/validations/jsonresume";
import { renderTemplateServerSide } from "@/lib/utils/server-template-renderer";
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
    includeWatermark: true,
    watermarkUrl: 'https://github.com/MarianRusoiu99/resume-manager',
    watermarkText: 'Built with Resume Manager',
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

        {/* Footer watermark */}
        <div className="text-center mt-6 text-sm text-gray-500">
          <a 
            href="https://github.com/MarianRusoiu99/resume-manager" 
            target="_blank" 
            rel="noopener noreferrer"
            className="hover:text-gray-700 transition-colors inline-flex items-center gap-2"
          >
            <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <path d="M9 19c-5 1.5-5-2.5-7-3m14 6v-3.87a3.37 3.37 0 0 0-.94-2.61c3.14-.35 6.44-1.54 6.44-7A5.44 5.44 0 0 0 20 4.77 5.07 5.07 0 0 0 19.91 1S18.73.65 16 2.48a13.38 13.38 0 0 0-7 0C6.27.65 5.09 1 5.09 1A5.07 5.07 0 0 0 5 4.77a5.44 5.44 0 0 0-1.5 3.78c0 5.42 3.3 6.61 6.44 7A3.37 3.37 0 0 0 9 18.13V22"/>
            </svg>
            Built with Resume Manager
          </a>
        </div>
      </div>
    </div>
  );
}
