/**
 * Job Analysis Examples
 * 
 * Few-shot learning examples to improve consistency and accuracy
 */

export const JOB_ANALYSIS_EXAMPLES = [
  {
    input: {
      jobTitle: 'Senior Full Stack Developer',
      companyName: 'TechCorp Inc',
      jobDescription: `We are seeking a Senior Full Stack Developer with 5+ years of experience. 
      Must have: React, Node.js, TypeScript, PostgreSQL, REST APIs. 
      Nice to have: GraphQL, Docker, AWS, CI/CD experience.
      Responsibilities include building scalable web applications, mentoring junior developers, and architecting new features.`
    },
    output: {
      requiredSkills: ['React', 'Node.js', 'TypeScript', 'PostgreSQL', 'REST APIs', '5+ years experience'],
      preferredSkills: ['GraphQL', 'Docker', 'AWS', 'CI/CD'],
      atsKeywords: ['Full Stack', 'React', 'Node.js', 'TypeScript', 'PostgreSQL', 'REST', 'GraphQL', 'Docker', 'AWS', 'CI/CD', 'Scalable', 'Architecture'],
      keyResponsibilities: [
        'Building scalable web applications',
        'Mentoring junior developers',
        'Architecting new features',
        'Full stack development',
        'Code review and quality assurance'
      ],
      summary: 'Senior Full Stack Developer role focused on building scalable web applications using React, Node.js, and TypeScript. Requires 5+ years experience and includes mentorship responsibilities.'
    }
  }
];
