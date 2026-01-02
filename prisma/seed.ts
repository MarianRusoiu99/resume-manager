/**
 * Prisma Database Seed Script
 * 
 * Creates test user with sample data and default templates for development and testing.
 * Run with: npx prisma db seed
 */

import { readFileSync } from 'node:fs';
import { join } from 'node:path';
import { PrismaClient } from '@prisma/client';
import * as bcrypt from 'bcryptjs';

function getTemplateAssetsPath() {
  return join(process.cwd(), 'lib', 'templates', 'assets');
}

function loadTemplateAssets(templateName: 'classic' | 'modern' | 'minimal') {
  const assetsPath = getTemplateAssetsPath();
  const baseCss = readFileSync(join(assetsPath, 'base.css'), 'utf-8');
  const html = readFileSync(join(assetsPath, templateName, 'template.html'), 'utf-8');
  const templateCss = readFileSync(join(assetsPath, templateName, 'styles.css'), 'utf-8');

  // Wrap styles in a <style> block and prepend to the HTML
  const mergedHtml = `<style>\n${baseCss}\n\n${templateCss}\n</style>\n${html}`;

  return {
    html: mergedHtml,
  };
}

const prisma = new PrismaClient();

const TEST_USER_EMAIL = 'test@example.com';
const TEST_USER_PASSWORD = 'Test123456'; // For development only

const sampleJsonResumeDocument = {
  basics: {
    name: 'John Doe',
    email: 'john.doe@email.com',
    phone: '+1 (555) 123-4567',
    summary:
      'Experienced Full Stack Developer with 5+ years building scalable web applications.',
  },
  work: [
    {
      name: 'Tech Innovations Inc.',
      position: 'Senior Full Stack Developer',
      startDate: '2021-03',
      highlights: ['Architected microservices backend', 'Reduced page load time by 40%'],
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
};

async function upsertResumeTemplates() {
  console.log('\n📄 Creating default resume templates...');

  const classic = loadTemplateAssets('classic');
  const modern = loadTemplateAssets('modern');
  const minimal = loadTemplateAssets('minimal');

  const templates = [
    {
      name: 'Classic',
      description:
        'Traditional serif-based design with clean typography. Perfect for corporate, legal, academic, and traditional industries where a timeless look is valued.',
      htmlTemplate: classic.html,
      isPublic: true,
    },
    {
      name: 'Modern',
      description:
        'Clean sans-serif design with blue accent colors and modern typography. Ideal for tech, startups, design, and progressive companies.',
      htmlTemplate: modern.html,
      isPublic: true,
    },
    {
      name: 'Minimal',
      description:
        'Ultra-clean design with generous whitespace and subtle typography. Best for designers, creatives, and roles where simplicity is valued.',
      htmlTemplate: minimal.html,
      isPublic: true,
    },
  ];

  for (const template of templates) {
    const existing = await prisma.resumeTemplate.findFirst({
      where: { name: template.name },
    });

    if (existing) {
      await prisma.resumeTemplate.update({
        where: { id: existing.id },
        data: {
          htmlTemplate: template.htmlTemplate,
          description: template.description,
          isPublic: template.isPublic,
        },
      });
      console.log(`   🔄 Updated template: ${template.name}`);
    } else {
      await prisma.resumeTemplate.create({ data: template as any });
      console.log(`   ✅ Created template: ${template.name}`);
    }
  }

  const defaultTemplate = await prisma.resumeTemplate.findFirst({
    where: { name: 'Classic' },
  });

  if (!defaultTemplate) {
    throw new Error('Expected Classic template to exist after seed.');
  }

  return defaultTemplate;
}

async function upsertTestUser() {
  console.log('\n👤 Setting up test user...');

  const existingUser = await prisma.user.findUnique({
    where: { email: TEST_USER_EMAIL },
  });

  if (existingUser) {
    console.log(`   ✅ Test user already exists: ${TEST_USER_EMAIL}`);
    return existingUser;
  }

  const passwordHash = await bcrypt.hash(TEST_USER_PASSWORD, 10);

  const user = await prisma.user.create({
    data: {
      email: TEST_USER_EMAIL,
      passwordHash,
      name: 'Test User',
    },
  });

  console.log(`   ✅ Created test user: ${TEST_USER_EMAIL}`);
  console.log(`   User ID: ${user.id}`);

  return user;
}

async function ensureDefaultProfile({
  userId,
  defaultTemplateId,
}: {
  userId: string;
  defaultTemplateId: string;
}) {
  console.log('\n🧾 Ensuring a default profile exists...');

  const existingDefaultProfile = await prisma.profile.findFirst({
    where: { userId, isDefault: true },
    include: { document: true },
  });

  if (existingDefaultProfile) {
    console.log(`   ✅ Default profile already exists: ${existingDefaultProfile.name}`);

    if (!existingDefaultProfile.document) {
      await prisma.profileDocument.create({
        data: {
          profileId: existingDefaultProfile.id,
          document: sampleJsonResumeDocument,
        },
      });
      console.log('   ✅ Created ProfileDocument for default profile');
    }

    return existingDefaultProfile;
  }

  const profile = await prisma.profile.create({
    data: {
      userId,
      name: 'Default Profile',
      isDefault: true,
      selectedTemplateId: defaultTemplateId,
      document: {
        create: {
          document: sampleJsonResumeDocument,
        },
      },
    },
  });

  console.log(`   ✅ Created sample profile: ${profile.name}`);
  return profile;
}

async function main() {
  console.log('🌱 Starting database seed...');

  const defaultTemplate = await upsertResumeTemplates();
  const user = await upsertTestUser();
  await ensureDefaultProfile({ userId: user.id, defaultTemplateId: defaultTemplate.id });

  console.log('\n🎉 Database seeding completed successfully!');
  console.log('');
  console.log('📝 Test credentials:');
  console.log(`   Email: ${TEST_USER_EMAIL}`);
  console.log(`   Password: ${TEST_USER_PASSWORD}`);
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
