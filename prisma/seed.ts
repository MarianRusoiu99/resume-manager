/**
 * Prisma Database Seed Script
 * 
 * Creates test user with sample data and default templates for development and testing.
 * Run with: npx prisma db seed
 */

import { PrismaClient, TemplateCategory } from '@prisma/client';
import * as bcrypt from 'bcryptjs';
import { 
  classicTemplateHtml, 
  classicTemplateCss,
  modernTemplateHtml,
  modernTemplateCss,
  minimalTemplateHtml,
  minimalTemplateCss,
} from '../lib/templates';

const prisma = new PrismaClient();

async function main() {
  console.log('🌱 Starting database seed...');

  // Seed default resume templates first (independent of user)
  console.log('\n📄 Creating default resume templates...');

  const templates = [
    {
      name: 'Classic',
      category: TemplateCategory.PROFESSIONAL,
      description: 'Traditional serif-based design with clean typography. Perfect for corporate, legal, academic, and traditional industries where a timeless look is valued.',
      htmlTemplate: classicTemplateHtml,
      cssStyles: classicTemplateCss,
      isPublic: true,
    },
    {
      name: 'Modern',
      category: TemplateCategory.MODERN,
      description: 'Clean sans-serif design with blue accent colors and modern typography. Ideal for tech, startups, design, and progressive companies.',
      htmlTemplate: modernTemplateHtml,
      cssStyles: modernTemplateCss,
      isPublic: true,
    },
    {
      name: 'Minimal',
      category: TemplateCategory.MINIMAL,
      description: 'Ultra-clean design with generous whitespace and subtle typography. Best for designers, creatives, and roles where simplicity is valued.',
      htmlTemplate: minimalTemplateHtml,
      cssStyles: minimalTemplateCss,
      isPublic: true,
    },
  ];

  for (const template of templates) {
    const existing = await prisma.resumeTemplate.findFirst({
      where: { name: template.name },
    });

    if (existing) {
      // Update existing template with latest HTML/CSS
      await prisma.resumeTemplate.update({
        where: { id: existing.id },
        data: {
          htmlTemplate: template.htmlTemplate,
          cssStyles: template.cssStyles,
          description: template.description,
        },
      });
      console.log(`   🔄 Updated template: ${template.name}`);
    } else {
      await prisma.resumeTemplate.create({
        data: template,
      });
      console.log(`   ✅ Created template: ${template.name}`);
    }
  }

  // Create test user
  console.log('\n👤 Setting up test user...');
  const testUserEmail = 'test@example.com';
  const testUserPassword = 'Test123456'; // For development only

  // Check if test user already exists
  const existingUser = await prisma.user.findUnique({
    where: { email: testUserEmail },
  });

  if (existingUser) {
    console.log(`   ✅ Test user already exists: ${testUserEmail}`);
    console.log(`   Password: ${testUserPassword}`);
  } else {
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

    console.log(`   ✅ Created test user: ${testUserEmail}`);
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

    console.log(`   ✅ Created sample profile: ${profile.name}`);
  }

  console.log('\n🎉 Database seeding completed successfully!');
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
