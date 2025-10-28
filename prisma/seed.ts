/**
 * Prisma Database Seed Script
 * 
 * Creates test user with sample data for development and testing.
 * Run with: npx prisma db seed
 */

import { PrismaClient } from '@prisma/client';
import * as bcrypt from 'bcryptjs';

const prisma = new PrismaClient();

async function main() {
  console.log('🌱 Starting database seed...');

  // Create test user
  const testUserEmail = 'test@example.com';
  const testUserPassword = 'Test123456'; // For development only

  // Check if test user already exists
  const existingUser = await prisma.user.findUnique({
    where: { email: testUserEmail },
  });

  if (existingUser) {
    console.log(`✅ Test user already exists: ${testUserEmail}`);
    console.log(`   Password: ${testUserPassword}`);
    return;
  }

  // Hash password
  const passwordHash = await bcrypt.hash(testUserPassword, 10);

  // Create user
  const user = await prisma.user.create({
    data: {
      email: testUserEmail,
      passwordHash,
      name: 'Test User',
    },
  });

  console.log(`✅ Created test user: ${testUserEmail}`);
  console.log(`   Password: ${testUserPassword}`);
  console.log(`   User ID: ${user.id}`);

  // Create sample profile
  const profile = await prisma.userProfile.create({
    data: {
      userId: user.id,
      personalInfo: {
        name: 'John Doe',
        email: 'john.doe@email.com',
        phone: '+1 (555) 123-4567',
        location: 'San Francisco, CA',
        linkedin: 'https://linkedin.com/in/johndoe',
        github: 'https://github.com/johndoe',
        website: 'https://johndoe.dev',
      },
      summary: 'Experienced Full Stack Developer with 5+ years building scalable web applications. Proficient in React, Node.js, and cloud technologies. Passionate about creating elegant solutions to complex problems.',
      experience: [
        {
          company: 'Tech Innovations Inc.',
          title: 'Senior Full Stack Developer',
          startDate: '2021-03',
          endDate: null,
          current: true,
          description: 'Lead development of cloud-based SaaS platform serving 10K+ users.',
          achievements: [
            'Architected microservices backend handling 1M+ API requests daily',
            'Reduced page load time by 40% through code splitting and lazy loading',
            'Mentored team of 4 junior developers',
            'Implemented CI/CD pipeline reducing deployment time by 60%',
          ],
        },
        {
          company: 'StartupCo',
          title: 'Full Stack Developer',
          startDate: '2019-01',
          endDate: '2021-02',
          current: false,
          description: 'Built and maintained e-commerce platform from ground up.',
          achievements: [
            'Developed React-based storefront with 99.9% uptime',
            'Integrated payment processing (Stripe, PayPal)',
            'Built REST API with Node.js and PostgreSQL',
            'Collaborated with design team on UI/UX improvements',
          ],
        },
        {
          company: 'Digital Solutions Agency',
          title: 'Junior Web Developer',
          startDate: '2018-06',
          endDate: '2018-12',
          current: false,
          description: 'Developed client websites and maintained existing projects.',
          achievements: [
            'Built 10+ responsive websites using HTML, CSS, JavaScript',
            'Implemented CMS integrations (WordPress, Contentful)',
            'Optimized website performance and SEO',
          ],
        },
      ],
      education: [
        {
          school: 'University of California',
          degree: 'Bachelor of Science',
          field: 'Computer Science',
          startDate: '2014-09',
          endDate: '2018-05',
          gpa: '3.7',
          achievements: [
            'Dean\'s List (3 semesters)',
            'CS Club President',
            'Capstone Project: AI-powered chatbot',
          ],
        },
      ],
      skills: {
        technical: [
          'JavaScript',
          'TypeScript',
          'React',
          'Next.js',
          'Node.js',
          'Express',
          'PostgreSQL',
          'MongoDB',
          'Docker',
          'AWS',
          'Git',
          'REST APIs',
          'GraphQL',
          'CI/CD',
          'Jest',
          'Prisma',
        ],
        soft: [
          'Team Leadership',
          'Problem Solving',
          'Communication',
          'Agile/Scrum',
          'Code Review',
          'Mentoring',
        ],
        languages: [
          'English (Native)',
          'Spanish (Intermediate)',
        ],
      },
      certifications: [
        {
          name: 'AWS Certified Solutions Architect',
          issuer: 'Amazon Web Services',
          date: '2022-08',
          url: 'https://aws.amazon.com/certification/',
        },
      ],
      languages: [
        {
          language: 'English',
          proficiency: 'Native',
        },
        {
          language: 'Spanish',
          proficiency: 'Intermediate',
        },
      ],
    },
  });

  console.log(`✅ Created sample profile with experience, education, skills, certifications, and languages`);

  // Create default resume templates
  console.log('\n📄 Creating default resume templates...');
  
  const templates = [
    {
      name: 'Professional',
      category: 'professional',
      description: 'Clean and traditional layout perfect for corporate positions. Single column design with clear section headings.',
      atsScore: 9,
      definition: {
        layout: {
          paperSize: 'letter' as const,
          margins: { top: 72, right: 72, bottom: 72, left: 72 },
          columns: 1 as const,
        },
        typography: {
          bodyFont: 'Times New Roman',
          headingFont: 'Times New Roman',
          fontSize: {
            name: 24,
            heading: 14,
            subheading: 12,
            body: 11,
            small: 9,
          },
          lineHeight: 1.5,
        },
        colors: {
          primary: '#000000',
          secondary: '#666666',
          accent: '#2C3E50',
          background: '#FFFFFF',
          border: '#CCCCCC',
        },
        sections: {
          showDividers: true,
          dividerThickness: 1,
          spacing: 16,
          order: ['summary', 'experience', 'education', 'skills', 'certifications', 'languages'],
        },
        contact: {
          layout: 'horizontal' as const,
          showIcons: false,
        },
        experience: {
          dateFormat: 'month-year' as const,
          showCompanyLogo: false,
          bulletStyle: 'disc' as const,
        },
        skills: {
          format: 'list' as const,
          groupByCategory: true,
        },
      },
    },
    {
      name: 'Modern',
      category: 'modern',
      description: 'Contemporary design with two-column layout and accent colors. Great for tech and creative roles.',
      atsScore: 8,
      definition: {
        layout: {
          paperSize: 'letter' as const,
          margins: { top: 54, right: 54, bottom: 54, left: 54 },
          columns: 2 as const,
          columnGap: 20,
        },
        typography: {
          bodyFont: 'Helvetica',
          headingFont: 'Helvetica',
          fontSize: {
            name: 28,
            heading: 16,
            subheading: 13,
            body: 10,
            small: 8,
          },
          lineHeight: 1.4,
        },
        colors: {
          primary: '#1A1A1A',
          secondary: '#757575',
          accent: '#3498DB',
          background: '#FFFFFF',
          border: '#E0E0E0',
        },
        sections: {
          showDividers: false,
          dividerThickness: 0,
          spacing: 14,
          order: ['summary', 'experience', 'skills', 'education', 'certifications', 'languages'],
        },
        contact: {
          layout: 'vertical' as const,
          showIcons: true,
          iconSize: 12,
        },
        experience: {
          dateFormat: 'month-year' as const,
          showCompanyLogo: false,
          bulletStyle: 'dash' as const,
        },
        skills: {
          format: 'tags' as const,
          groupByCategory: false,
        },
      },
    },
    {
      name: 'ATS-Optimized',
      category: 'ats-optimized',
      description: 'Highly optimized for Applicant Tracking Systems. Simple formatting ensures perfect parsing by ATS software.',
      atsScore: 10,
      definition: {
        layout: {
          paperSize: 'letter' as const,
          margins: { top: 72, right: 72, bottom: 72, left: 72 },
          columns: 1 as const,
        },
        typography: {
          bodyFont: 'Arial',
          headingFont: 'Arial',
          fontSize: {
            name: 20,
            heading: 14,
            subheading: 12,
            body: 11,
            small: 10,
          },
          lineHeight: 1.6,
        },
        colors: {
          primary: '#000000',
          secondary: '#000000',
          accent: '#000000',
          background: '#FFFFFF',
          border: '#000000',
        },
        sections: {
          showDividers: true,
          dividerThickness: 2,
          spacing: 18,
          order: ['summary', 'skills', 'experience', 'education', 'certifications', 'languages'],
        },
        contact: {
          layout: 'horizontal' as const,
          showIcons: false,
        },
        experience: {
          dateFormat: 'month-year' as const,
          showCompanyLogo: false,
          bulletStyle: 'disc' as const,
        },
        skills: {
          format: 'list' as const,
          groupByCategory: true,
        },
      },
    },
    {
      name: 'Minimal',
      category: 'minimal',
      description: 'Sleek and minimalist design with plenty of white space. Perfect for designers and creative professionals.',
      atsScore: 7,
      definition: {
        layout: {
          paperSize: 'letter' as const,
          margins: { top: 90, right: 90, bottom: 90, left: 90 },
          columns: 1 as const,
        },
        typography: {
          bodyFont: 'Helvetica',
          headingFont: 'Helvetica',
          fontSize: {
            name: 32,
            heading: 18,
            subheading: 14,
            body: 11,
            small: 9,
          },
          lineHeight: 1.8,
        },
        colors: {
          primary: '#2C2C2C',
          secondary: '#A0A0A0',
          accent: '#2C2C2C',
          background: '#FFFFFF',
          border: '#EEEEEE',
        },
        sections: {
          showDividers: false,
          dividerThickness: 0,
          spacing: 24,
          order: ['summary', 'experience', 'skills', 'education', 'certifications', 'languages'],
        },
        contact: {
          layout: 'horizontal' as const,
          showIcons: false,
        },
        experience: {
          dateFormat: 'year' as const,
          showCompanyLogo: false,
          bulletStyle: 'dash' as const,
        },
        skills: {
          format: 'list' as const,
          groupByCategory: false,
        },
      },
    },
    {
      name: 'Creative',
      category: 'creative',
      description: 'Bold and eye-catching design with unique typography. Stand out in creative industries.',
      atsScore: 6,
      definition: {
        layout: {
          paperSize: 'letter' as const,
          margins: { top: 60, right: 60, bottom: 60, left: 60 },
          columns: 2 as const,
          columnGap: 24,
        },
        typography: {
          bodyFont: 'Georgia',
          headingFont: 'Georgia',
          fontSize: {
            name: 30,
            heading: 18,
            subheading: 14,
            body: 10,
            small: 8,
          },
          lineHeight: 1.5,
        },
        colors: {
          primary: '#2C3E50',
          secondary: '#7F8C8D',
          accent: '#E74C3C',
          background: '#FFFFFF',
          border: '#BDC3C7',
        },
        sections: {
          showDividers: true,
          dividerThickness: 2,
          spacing: 16,
          order: ['summary', 'skills', 'experience', 'education', 'certifications', 'languages'],
        },
        contact: {
          layout: 'grid' as const,
          showIcons: true,
          iconSize: 14,
        },
        experience: {
          dateFormat: 'month-year' as const,
          showCompanyLogo: false,
          bulletStyle: 'arrow' as const,
        },
        skills: {
          format: 'bars' as const,
          groupByCategory: true,
        },
      },
    },
  ];

  for (const template of templates) {
    const existing = await prisma.resumeTemplate.findFirst({
      where: { name: template.name },
    });

    if (existing) {
      console.log(`   ⏭️  Template "${template.name}" already exists`);
    } else {
      await prisma.resumeTemplate.create({
        data: template,
      });
      console.log(`   ✅ Created template: ${template.name} (ATS Score: ${template.atsScore}/10)`);
    }
  }

  console.log('');
  console.log('🎉 Database seeding completed successfully!');

  console.log('🎉 Database seeding completed successfully!');
  console.log('');
  console.log('📝 Test credentials:');
  console.log(`   Email: ${testUserEmail}`);
  console.log(`   Password: ${testUserPassword}`);
  console.log('');
  console.log('💡 You can now:');
  console.log('   1. Login with the test user');
  console.log('   2. View the sample profile at /profile');
  console.log('   3. Generate a resume at /generate');
  console.log('');
}

main()
  .catch((e) => {
    console.error('❌ Seed failed:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
