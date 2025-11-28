import Image from "next/image";
import { profileRepository } from "@/lib/repositories/profile.repository";
import { notFound } from "next/navigation";
import type { Resume } from "@/lib/validations/jsonresume";

interface PublicResumePageProps {
  params: Promise<{ slug: string }>;
}

export default async function PublicResumePage({ params }: PublicResumePageProps) {
  const { slug } = await params;

  // Find profile by public slug
  const profile = await profileRepository.findByPublicSlug(slug);

  if (!profile || !profile.isPublic) {
    notFound();
  }

  const resume = profile.resume as Resume;

  return (
    <div className="min-h-screen bg-linear-to-br from-muted/30 to-muted/50">
      <div className="container max-w-4xl mx-auto py-12 px-4">
        <div className="bg-white rounded-lg shadow-xl p-8 md:p-12">
          {/* Header */}
          {resume.basics && (
            <div className="border-b pb-6 mb-6">
              {resume.basics.image && (
                <Image
                  src={resume.basics.image}
                  alt={resume.basics.name || "Profile"}
                  width={96}
                  height={96}
                  className="w-24 h-24 rounded-full mb-4"
                />
              )}
              <h1 className="text-4xl font-bold mb-2">{resume.basics.name}</h1>
              {resume.basics.label && (
                <p className="text-xl text-muted-foreground mb-3">{resume.basics.label}</p>
              )}
              <div className="flex flex-wrap gap-3 text-sm text-muted-foreground">
                {resume.basics.email && (
                  <a href={`mailto:${resume.basics.email}`} className="hover:text-foreground">
                    📧 {resume.basics.email}
                  </a>
                )}
                {resume.basics.phone && <span>📞 {resume.basics.phone}</span>}
                {resume.basics.location?.city && (
                  <span>📍 {[
                    resume.basics.location.city,
                    resume.basics.location.region,
                    resume.basics.location.countryCode
                  ].filter(Boolean).join(", ")}</span>
                )}
                {resume.basics.url && (
                  <a href={resume.basics.url} target="_blank" rel="noopener noreferrer" className="hover:text-foreground">
                    🔗 {resume.basics.url}
                  </a>
                )}
              </div>
              {resume.basics.profiles && resume.basics.profiles.length > 0 && (
                <div className="flex gap-3 mt-3">
                  {resume.basics.profiles.map((profile, idx) => (
                    profile?.url && (
                      <a
                        key={idx}
                        href={profile.url}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="text-sm text-blue-600 hover:underline"
                      >
                        {profile.network}
                      </a>
                    )
                  ))}
                </div>
              )}
            </div>
          )}

          {/* Professional Summary */}
          {resume.basics?.summary && (
            <div className="mb-8">
              <h2 className="text-2xl font-bold mb-3 text-primary">Professional Summary</h2>
              <p className="text-muted-foreground leading-relaxed">{resume.basics.summary}</p>
            </div>
          )}

          {/* Work Experience */}
          {resume.work && resume.work.length > 0 && (
            <div className="mb-8">
              <h2 className="text-2xl font-bold mb-4 text-primary">Work Experience</h2>
              <div className="space-y-6">
                {resume.work.filter(job => job).map((job, idx) => (
                  <div key={idx} className="border-l-4 border-primary pl-4">
                    <h3 className="text-xl font-semibold">{job!.position}</h3>
                    <p className="text-lg text-muted-foreground">{job!.name}</p>
                    <p className="text-sm text-muted-foreground mb-2">
                      {job!.startDate} - {job!.endDate || "Present"}
                    </p>
                    {job!.summary && <p className="text-sm mb-2">{job!.summary}</p>}
                    {job!.highlights && job!.highlights.length > 0 && (
                      <ul className="list-disc list-inside space-y-1 text-sm">
                        {job!.highlights.map((highlight, i) => (
                          <li key={i}>{highlight}</li>
                        ))}
                      </ul>
                    )}
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Education */}
          {resume.education && resume.education.length > 0 && (
            <div className="mb-8">
              <h2 className="text-2xl font-bold mb-4 text-primary">Education</h2>
              <div className="space-y-4">
                {resume.education.filter(edu => edu).map((edu, idx) => (
                  <div key={idx}>
                    <h3 className="text-lg font-semibold">
                      {edu!.studyType} in {edu!.area}
                    </h3>
                    <p className="text-muted-foreground">{edu!.institution}</p>
                    <p className="text-sm text-muted-foreground">
                      {edu!.startDate} - {edu!.endDate}
                      {edu!.score && ` | GPA: ${edu!.score}`}
                    </p>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Skills */}
          {resume.skills && resume.skills.length > 0 && (
            <div className="mb-8">
              <h2 className="text-2xl font-bold mb-4 text-primary">Skills</h2>
              <div className="flex flex-wrap gap-2">
                {resume.skills.filter(skill => skill).map((skill, idx) => (
                  <div key={idx} className="px-4 py-2 bg-primary/10 rounded-full">
                    <span className="font-medium">{skill!.name}</span>
                    {skill!.level && (
                      <span className="text-sm text-muted-foreground ml-2">({skill!.level})</span>
                    )}
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Projects */}
          {resume.projects && resume.projects.length > 0 && (
            <div className="mb-8">
              <h2 className="text-2xl font-bold mb-4 text-primary">Projects</h2>
              <div className="space-y-4">
                {resume.projects.filter(project => project).map((project, idx) => (
                  <div key={idx}>
                    <h3 className="text-lg font-semibold">{project!.name}</h3>
                    {project!.url && (
                      <a href={project!.url} target="_blank" rel="noopener noreferrer" className="text-sm text-blue-600 hover:underline">
                        {project!.url}
                      </a>
                    )}
                    {project!.description && <p className="text-sm mt-2">{project!.description}</p>}
                    {project!.highlights && project!.highlights.length > 0 && (
                      <ul className="list-disc list-inside space-y-1 text-sm mt-2">
                        {project!.highlights.map((highlight, i) => (
                          <li key={i}>{highlight}</li>
                        ))}
                      </ul>
                    )}
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Certifications */}
          {resume.certificates && resume.certificates.length > 0 && (
            <div className="mb-8">
              <h2 className="text-2xl font-bold mb-4 text-primary">Certifications</h2>
              <div className="space-y-3">
                {resume.certificates.filter(cert => cert).map((cert, idx) => (
                  <div key={idx}>
                    <h3 className="font-semibold">{cert!.name}</h3>
                    <p className="text-sm text-muted-foreground">
                      {cert!.issuer} | {cert!.date}
                    </p>
                    {cert!.url && (
                      <a href={cert!.url} target="_blank" rel="noopener noreferrer" className="text-sm text-blue-600 hover:underline">
                        View Certificate
                      </a>
                    )}
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Languages */}
          {resume.languages && resume.languages.length > 0 && (
            <div className="mb-8">
              <h2 className="text-2xl font-bold mb-4 text-primary">Languages</h2>
              <div className="flex flex-wrap gap-3">
                {resume.languages.filter(lang => lang).map((lang, idx) => (
                  <div key={idx} className="px-4 py-2 border rounded-lg">
                    <span className="font-medium">{lang!.language}</span>
                    {lang!.fluency && (
                      <span className="text-sm text-muted-foreground ml-2">- {lang!.fluency}</span>
                    )}
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="text-center mt-8 text-sm text-muted-foreground">
          <p>Powered by ResumeFlow</p>
        </div>
      </div>
    </div>
  );
}
