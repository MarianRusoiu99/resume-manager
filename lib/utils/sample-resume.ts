import type { Resume } from '@/lib/validations/jsonresume';

/**
 * Sample JSON Resume data for template previews
 * Based on JSON Resume v1.0.0 schema
 */
export const sampleResume: Resume = {
  basics: {
    name: 'John Doe',
    label: 'Senior Software Engineer',
    image: '',
    email: 'john.doe@example.com',
    phone: '(555) 123-4567',
    url: 'https://johndoe.com',
    summary:
      'Experienced software engineer with 8+ years of expertise in full-stack development, cloud architecture, and team leadership. Passionate about building scalable applications and mentoring junior developers.',
    location: {
      address: '2712 Broadway St',
      postalCode: 'CA 94115',
      city: 'San Francisco',
      countryCode: 'US',
      region: 'California',
    },
    profiles: [
      {
        network: 'LinkedIn',
        username: 'johndoe',
        url: 'https://linkedin.com/in/johndoe',
      },
      {
        network: 'GitHub',
        username: 'johndoe',
        url: 'https://github.com/johndoe',
      },
    ],
  },
  work: [
    {
      name: 'Tech Corp Inc.',
      position: 'Senior Software Engineer',
      url: 'https://techcorp.com',
      startDate: '2020-01-15',
      summary:
        'Led development of microservices architecture serving 1M+ users. Mentored team of 5 junior engineers.',
      highlights: [
        'Reduced API response time by 40% through optimization',
        'Implemented CI/CD pipeline reducing deployment time by 60%',
        'Architected scalable event-driven system processing 10K events/sec',
      ],
    },
    {
      name: 'StartupXYZ',
      position: 'Full Stack Developer',
      url: 'https://startupxyz.com',
      startDate: '2017-06-01',
      endDate: '2019-12-31',
      summary:
        'Built core product features from scratch using React, Node.js, and PostgreSQL.',
      highlights: [
        'Developed real-time collaboration features used by 50K+ users',
        'Implemented authentication system with OAuth and JWT',
        'Created RESTful APIs handling 1M+ requests daily',
      ],
    },
  ],
  volunteer: [
    {
      organization: 'Code for Good',
      position: 'Technical Mentor',
      url: 'https://codeforgood.org',
      startDate: '2019-01-01',
      endDate: '2021-12-31',
      summary:
        'Mentored underprivileged students in web development and programming fundamentals.',
      highlights: [
        'Taught 50+ students JavaScript and React',
        'Organized monthly coding workshops',
      ],
    },
  ],
  education: [
    {
      institution: 'University of Technology',
      url: 'https://university.edu',
      area: 'Computer Science',
      studyType: 'Bachelor of Science',
      startDate: '2013-09-01',
      endDate: '2017-05-15',
      score: '3.8',
      courses: ['Data Structures', 'Algorithms', 'Database Systems', 'Web Development'],
    },
  ],
  awards: [
    {
      title: 'Employee of the Year',
      date: '2021-12-15',
      awarder: 'Tech Corp Inc.',
      summary: 'Recognized for exceptional leadership and technical contributions.',
    },
  ],
  certificates: [
    {
      name: 'AWS Certified Solutions Architect',
      date: '2022-03-15',
      issuer: 'Amazon Web Services',
      url: 'https://aws.amazon.com/certification/',
    },
  ],
  publications: [
    {
      name: 'Microservices Architecture Patterns',
      publisher: 'Tech Blog',
      releaseDate: '2022-08-01',
      url: 'https://techblog.com/microservices-patterns',
      summary:
        'Deep dive into microservices design patterns and best practices for scalable systems.',
    },
  ],
  skills: [
    {
      name: 'Programming Languages',
      level: 'Expert',
      keywords: ['JavaScript', 'TypeScript', 'Python', 'Go'],
    },
    {
      name: 'Frontend Development',
      level: 'Expert',
      keywords: ['React', 'Next.js', 'Vue.js', 'Tailwind CSS'],
    },
    {
      name: 'Backend Development',
      level: 'Advanced',
      keywords: ['Node.js', 'Express', 'FastAPI', 'GraphQL'],
    },
    {
      name: 'DevOps & Cloud',
      level: 'Advanced',
      keywords: ['AWS', 'Docker', 'Kubernetes', 'CI/CD', 'Terraform'],
    },
  ],
  languages: [
    {
      language: 'English',
      fluency: 'Native speaker',
    },
    {
      language: 'Spanish',
      fluency: 'Professional working proficiency',
    },
  ],
  interests: [
    {
      name: 'Technology',
      keywords: ['AI/ML', 'Web3', 'Cloud Computing'],
    },
    {
      name: 'Activities',
      keywords: ['Hiking', 'Photography', 'Open Source'],
    },
  ],
  references: [
    {
      name: 'Jane Smith',
      reference:
        'John is an exceptional engineer with strong technical skills and leadership qualities. He consistently delivers high-quality work and is a pleasure to work with.',
    },
  ],
  projects: [
    {
      name: 'Open Source CMS',
      startDate: '2021-01-01',
      endDate: '2022-06-01',
      description:
        'Built a headless CMS using Next.js and PostgreSQL. 500+ GitHub stars.',
      highlights: [
        'Used by 100+ developers worldwide',
        'Featured in JavaScript Weekly newsletter',
      ],
      url: 'https://github.com/johndoe/cms',
    },
  ],
};
