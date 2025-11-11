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

  // Create sample profile with JSON Resume format
  const profile = await prisma.userProfile.create({
    data: {
      userId: user.id,
      name: 'Default Profile',
      isDefault: true,
      resume: {
        basics: {
          name: 'John Doe',
          email: 'john.doe@email.com',
          phone: '+1 (555) 123-4567',
          summary: 'Experienced Full Stack Developer with 5+ years building scalable web applications.',
        },
        work: [
          {
            name: 'Tech Innovations Inc.',
            position: 'Senior Full Stack Developer',
            startDate: '2021-03',
            highlights: [
              'Architected microservices backend',
              'Reduced page load time by 40%',
            ],
          },
        ],
        education: [
          {
            institution: 'University of California',
            studyType: 'Bachelor of Science',
            area: 'Computer Science',
            startDate: '2014-09',
            endDate: '2018-05',
          },
        ],
        skills: [
          {
            name: 'Programming Languages',
            keywords: ['JavaScript', 'TypeScript', 'Python'],
          },
        ],
      },
    },
  });

  console.log(`✅ Created sample profile for ${profile.userId}`);

  // Create default resume templates
  console.log('\n📄 Creating default resume templates...');
  
  // Import templates
  const { modernTemplateHtml, modernTemplateCss } = await import('../lib/templates/modern');
  const { professionalTemplateHtml, professionalTemplateCss } = await import('../lib/templates/professional');
  const { minimalTemplateHtml, minimalTemplateCss } = await import('../lib/templates/minimal');
  
  const templates = [
    {
      name: 'Modern',
      category: 'modern',
      description: 'Clean, professional design with blue accents. Great for tech and business roles.',
      htmlTemplate: modernTemplateHtml,
      cssStyles: modernTemplateCss,
    },
    {
      name: 'Professional',
      category: 'professional',
      description: 'Traditional ATS-optimized layout. Perfect for corporate positions and maximum compatibility.',
      htmlTemplate: professionalTemplateHtml,
      cssStyles: professionalTemplateCss,
    },
    {
      name: 'Minimal',
      category: 'minimal',
      description: 'Clean and modern with lots of white space. Ideal for designers and creative professionals.',
      htmlTemplate: minimalTemplateHtml,
      cssStyles: minimalTemplateCss,
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
      console.log(`   ✅ Created template: ${template.name} `);
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
