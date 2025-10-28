/**
 * Sample Resume Data Generator
 * Provides realistic sample data for template previews
 */

export interface SampleResumeData {
  personalInfo: {
    name: string;
    email: string;
    phone: string;
    location: string;
    linkedin?: string;
    portfolio?: string;
  };
  summary: string;
  experience: Array<{
    company: string;
    position: string;
    startDate: string;
    endDate: string;
    location: string;
    responsibilities: string[];
  }>;
  education: Array<{
    institution: string;
    degree: string;
    field: string;
    startDate: string;
    endDate: string;
    location: string;
  }>;
  skills: {
    technical: string[];
    soft: string[];
  };
  certifications?: Array<{
    name: string;
    issuer: string;
    date: string;
  }>;
}

export function getSampleResumeData(): SampleResumeData {
  return {
    personalInfo: {
      name: 'Alex Johnson',
      email: 'alex.johnson@email.com',
      phone: '+1 (555) 123-4567',
      location: 'San Francisco, CA',
      linkedin: 'linkedin.com/in/alexjohnson',
      portfolio: 'alexjohnson.dev',
    },
    summary:
      'Results-driven Senior Software Engineer with 8+ years of experience building scalable web applications and leading cross-functional teams. Expertise in full-stack development, cloud architecture, and agile methodologies. Proven track record of delivering high-impact solutions that drive business growth.',
    experience: [
      {
        company: 'Tech Innovations Inc.',
        position: 'Senior Software Engineer',
        startDate: '2020-03',
        endDate: 'Present',
        location: 'San Francisco, CA',
        responsibilities: [
          'Led development of microservices architecture serving 5M+ users, reducing system latency by 40%',
          'Mentored team of 5 junior engineers, improving code quality and deployment frequency by 60%',
          'Architected and implemented CI/CD pipeline, reducing deployment time from 2 hours to 15 minutes',
          'Collaborated with product team to define technical requirements and deliver features on schedule',
        ],
      },
      {
        company: 'Digital Solutions Ltd.',
        position: 'Software Engineer',
        startDate: '2018-06',
        endDate: '2020-02',
        location: 'Seattle, WA',
        responsibilities: [
          'Developed RESTful APIs and frontend components for enterprise SaaS platform',
          'Implemented automated testing suite, increasing code coverage from 45% to 85%',
          'Optimized database queries, improving application performance by 35%',
          'Participated in agile ceremonies and contributed to sprint planning',
        ],
      },
      {
        company: 'StartupXYZ',
        position: 'Junior Software Developer',
        startDate: '2016-01',
        endDate: '2018-05',
        location: 'Portland, OR',
        responsibilities: [
          'Built responsive web applications using React and Node.js',
          'Collaborated with designers to implement pixel-perfect UI components',
          'Fixed bugs and implemented feature requests based on user feedback',
        ],
      },
    ],
    education: [
      {
        institution: 'University of California, Berkeley',
        degree: 'Bachelor of Science',
        field: 'Computer Science',
        startDate: '2012-09',
        endDate: '2016-05',
        location: 'Berkeley, CA',
      },
    ],
    skills: {
      technical: [
        'JavaScript/TypeScript',
        'React',
        'Node.js',
        'Python',
        'AWS',
        'Docker',
        'PostgreSQL',
        'MongoDB',
        'GraphQL',
        'CI/CD',
      ],
      soft: [
        'Team Leadership',
        'Problem Solving',
        'Communication',
        'Agile/Scrum',
        'Mentoring',
      ],
    },
    certifications: [
      {
        name: 'AWS Certified Solutions Architect',
        issuer: 'Amazon Web Services',
        date: '2022-08',
      },
      {
        name: 'Professional Scrum Master I',
        issuer: 'Scrum.org',
        date: '2021-03',
      },
    ],
  };
}
