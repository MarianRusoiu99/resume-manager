#!/usr/bin/env ts-node

/**
 * Test script for Phase 4.8 - Complete Workflow Integration with JSON Resume
 * Tests the full end-to-end workflow using JSON Resume format
 * 
 * Run with: npx ts-node scripts/test-workflow-integration-jsonresume.ts
 */

import { generateResume } from '../lib/ai/workflow';
import type { Resume } from '../lib/validations/jsonresume';
import { resumeSchema } from '../lib/validations/jsonresume';

// Mock user ID for testing
const MOCK_USER_ID = 'test-user-123';

// Create test resume in JSON Resume format
const testResume: Resume = {
  basics: {
    name: 'Sarah Johnson',
    label: 'Senior Full Stack Engineer',
    email: 'sarah.johnson@email.com',
    phone: '+1 (555) 123-4567',
    url: 'https://sarah-johnson.dev',
    summary: 'Senior Full Stack Engineer with 7+ years of experience building scalable web applications. Expert in React, Node.js, and cloud infrastructure. Passionate about creating user-friendly products and mentoring junior developers.',
    location: {
      city: 'San Francisco',
      region: 'CA',
      countryCode: 'US'
    },
    profiles: [
      {
        network: 'LinkedIn',
        username: 'sarahjohnson',
        url: 'https://linkedin.com/in/sarahjohnson'
      },
      {
        network: 'GitHub',
        username: 'sarah-johnson',
        url: 'https://github.com/sarah-johnson'
      }
    ]
  },
  work: [
    {
      name: 'TechCorp Solutions',
      position: 'Senior Software Engineer',
      startDate: '2020-03',
      url: 'https://techcorp.com',
      highlights: [
        'Lead engineer for flagship SaaS product serving 10,000+ enterprise customers',
        'Architected microservices infrastructure handling 1M+ requests/day',
        'Led team of 5 engineers with focus on code quality and best practices',
        'Optimized database performance reducing query times by 60%',
        'Mentored 3 junior developers resulting in promotions to mid-level roles'
      ]
    },
    {
      name: 'StartupXYZ',
      position: 'Full Stack Developer',
      startDate: '2017-06',
      endDate: '2020-02',
      url: 'https://startupxyz.com',
      highlights: [
        'Early employee building MVP and scaling to 1000+ paying customers',
        'Built React frontend serving 50,000+ monthly active users',
        'Developed RESTful APIs handling 1M+ requests daily',
        'Implemented CI/CD pipeline reducing deployment time by 75%',
        'Collaborated with designers to create responsive user interfaces'
      ]
    }
  ],
  education: [
    {
      institution: 'University of California, Berkeley',
      url: 'https://berkeley.edu',
      studyType: 'Bachelor of Science',
      area: 'Computer Science',
      startDate: '2013-08',
      endDate: '2017-05',
      score: '3.8',
      courses: [
        'Data Structures and Algorithms',
        'Distributed Systems',
        'Software Engineering',
        'Database Systems'
      ]
    }
  ],
  skills: [
    {
      name: 'Frontend Development',
      keywords: ['JavaScript', 'TypeScript', 'React', 'Redux', 'Next.js', 'HTML5', 'CSS3', 'Tailwind CSS']
    },
    {
      name: 'Backend Development',
      keywords: ['Node.js', 'Express', 'PostgreSQL', 'MongoDB', 'REST APIs', 'GraphQL']
    },
    {
      name: 'DevOps & Cloud',
      keywords: ['AWS', 'Docker', 'Kubernetes', 'CI/CD', 'Git', 'GitHub Actions']
    },
    {
      name: 'Testing',
      keywords: ['Jest', 'Cypress', 'React Testing Library', 'TDD']
    },
    {
      name: 'Soft Skills',
      keywords: ['Team Leadership', 'Mentoring', 'Agile/Scrum', 'Problem Solving', 'Communication', 'Code Review']
    }
  ],
  languages: [
    {
      language: 'English',
      fluency: 'Native'
    },
    {
      language: 'Spanish',
      fluency: 'Conversational'
    }
  ]
};

// Test job description
const testJobDescription = `
Senior Frontend Engineer - React Specialist

About the Role:
We're looking for an experienced Senior Frontend Engineer to join our growing team. You'll be working on our flagship product, a complex web application serving millions of users worldwide.

Responsibilities:
- Lead frontend architecture decisions for our React-based SaaS platform
- Build and maintain reusable component libraries
- Optimize application performance and user experience
- Mentor junior and mid-level engineers
- Collaborate with design and backend teams
- Implement best practices for code quality and testing
- Drive technical initiatives and improve development workflows

Requirements:
- 5+ years of professional software development experience
- 3+ years of advanced React and TypeScript experience
- Strong understanding of modern frontend architecture
- Experience with state management (Redux, Context API, Zustand)
- Proficiency in testing frameworks (Jest, React Testing Library)
- Experience with build tools and bundlers (Webpack, Vite)
- Knowledge of performance optimization techniques
- Excellent communication and mentoring skills
- Experience with CI/CD and deployment processes
- Bachelor's degree in Computer Science or equivalent experience

Nice to Have:
- Experience with Next.js and server-side rendering
- Knowledge of GraphQL
- Experience with design systems and component libraries
- Contributions to open source projects
- Experience with AWS or other cloud platforms
- Understanding of backend technologies (Node.js, databases)

We Offer:
- Competitive salary ($150k-$200k based on experience)
- Equity package
- Remote-first culture with flexible hours
- Comprehensive health benefits
- Professional development budget
- Latest MacBook Pro and equipment
- Collaborative team environment
- Opportunities for growth and leadership
`;

async function main() {
  console.log('=== Phase 4.8: Complete Workflow Integration Test (JSON Resume) ===\n');

  // Check for API key
  if (!process.env.OPENAI_API_KEY) {
    console.error('❌ Error: OPENAI_API_KEY environment variable not set');
    console.log('Please set it with: export OPENAI_API_KEY=your-key-here');
    process.exit(1);
  }

  // Validate test resume against schema
  console.log('🔍 Validating test resume against JSON Resume schema...');
  try {
    resumeSchema.parse(testResume);
    console.log('✅ Test resume is valid JSON Resume v1.0.0\n');
  } catch (error) {
    console.error('❌ Test resume validation failed:', error);
    process.exit(1);
  }

  console.log('Test Configuration:');
  console.log(`- User ID: ${MOCK_USER_ID}`);
  console.log(`- Job: Senior Frontend Engineer at Test Company`);
  console.log(`- Profile: ${testResume.basics?.name}\n`);

  console.log('Running complete workflow...\n');
  console.log('═══════════════════════════════════════════════════════════════\n');

  try {
    const startTime = Date.now();

    const result = await generateResume({
      userId: MOCK_USER_ID,
      jobDescription: testJobDescription,
      jobTitle: 'Senior Frontend Engineer',
      companyName: 'Test Company',
      userResume: testResume
    });

    const endTime = Date.now();
    const duration = ((endTime - startTime) / 1000).toFixed(2);

    console.log('\n═══════════════════════════════════════════════════════════════\n');
    console.log(`⏱️  Total execution time: ${duration}s\n`);

    if (!result.success) {
      console.error('❌ Workflow failed!\n');
      console.error('Errors:');
      result.errors?.forEach((error, i) => {
        console.error(`  ${i + 1}. ${error}`);
      });
      
      if (result.state) {
        console.log('\n📊 Final State:');
        console.log(`   Current Step: ${result.state.currentStep || 'unknown'}`);
        console.log(`   Tokens Used: ${result.state.tokensUsed || 0}`);
        console.log(`   Errors: ${result.state.errors?.length || 0}`);
      }
      
      process.exit(1);
    }

    console.log('✅ Workflow completed successfully!\n');
    
    // Validate output against JSON Resume schema
    if (result.resume) {
      console.log('🔍 Validating generated resume against JSON Resume schema...');
      try {
        resumeSchema.parse(result.resume);
        console.log('✅ Generated resume is valid JSON Resume v1.0.0\n');
      } catch (error) {
        console.error('❌ Generated resume validation failed:', error);
        console.log('\nGenerated resume:', JSON.stringify(result.resume, null, 2));
        process.exit(1);
      }

      const resume = result.resume;
      
      console.log('═══════════════════════════════════════════════════════════════');
      console.log('📄 GENERATED RESUME (JSON Resume v1.0.0)');
      console.log('═══════════════════════════════════════════════════════════════\n');
      
      console.log('📋 Basics:');
      console.log(`   Name: ${resume.basics?.name || 'N/A'}`);
      console.log(`   Label: ${resume.basics?.label || 'N/A'}`);
      console.log(`   Email: ${resume.basics?.email || 'N/A'}`);
      console.log(`   Phone: ${resume.basics?.phone || 'N/A'}`);
      if (resume.basics?.location) {
        const loc = resume.basics.location;
        console.log(`   Location: ${loc.city || ''}${loc.city && loc.region ? ', ' : ''}${loc.region || ''}`);
      }
      if (resume.basics?.profiles && resume.basics.profiles.length > 0) {
        console.log('   Profiles:');
        resume.basics.profiles.forEach(p => {
          console.log(`     - ${p.network}: ${p.url}`);
        });
      }
      
      console.log('\n📝 Summary:');
      console.log(`   ${resume.basics?.summary || 'N/A'}`);
      
      console.log('\n💼 Work Experience:');
      if (resume.work && resume.work.length > 0) {
        resume.work.forEach((exp, i) => {
          const dates = exp.endDate 
            ? `${exp.startDate} - ${exp.endDate}` 
            : `${exp.startDate} - Present`;
          console.log(`\n   ${i + 1}. ${exp.position} at ${exp.name}`);
          console.log(`      ${dates}`);
          if (exp.highlights && exp.highlights.length > 0) {
            console.log('      Highlights:');
            exp.highlights.forEach((h) => {
              console.log(`      • ${h}`);
            });
          }
        });
      } else {
        console.log('   None');
      }
      
      console.log('\n🎓 Education:');
      if (resume.education && resume.education.length > 0) {
        resume.education.forEach((edu, i) => {
          const dates = edu.endDate 
            ? `${edu.startDate} - ${edu.endDate}` 
            : edu.startDate;
          console.log(`   ${i + 1}. ${edu.studyType} in ${edu.area}`);
          console.log(`      ${edu.institution}`);
          if (edu.score) console.log(`      Score: ${edu.score}`);
          console.log(`      ${dates}`);
        });
      } else {
        console.log('   None');
      }
      
      console.log('\n🔧 Skills:');
      if (resume.skills && resume.skills.length > 0) {
        resume.skills.forEach((skillGroup) => {
          console.log(`   ${skillGroup.name}: ${skillGroup.keywords?.join(', ') || 'N/A'}`);
        });
      } else {
        console.log('   None');
      }
      
      if (resume.languages && resume.languages.length > 0) {
        console.log('\n🌍 Languages:');
        resume.languages.forEach((lang) => {
          console.log(`   ${lang.language}: ${lang.fluency || 'N/A'}`);
        });
      }
      
      console.log('\n═══════════════════════════════════════════════════════════════');
      console.log('📊 WORKFLOW METRICS');
      console.log('═══════════════════════════════════════════════════════════════\n');
      
      console.log(`⏱️  Execution Time: ${duration}s`);
      console.log(`🎯 Tokens Used: ${result.tokensUsed || 0}`);
      if (resume.meta?.lastModified) {
        console.log(`📅 Generated: ${new Date(resume.meta.lastModified).toLocaleString()}`);
      }
      if (resume.meta?.targetJobTitle) {
        console.log(`💼 Target Role: ${resume.meta.targetJobTitle}${resume.meta.targetCompany ? ` at ${resume.meta.targetCompany}` : ''}`);
      }
    }

    // Display state information if available
    if (result.state) {
      console.log('\n═══════════════════════════════════════════════════════════════');
      console.log('🔍 WORKFLOW STATE ANALYSIS');
      console.log('═══════════════════════════════════════════════════════════════\n');
      
      console.log('✅ Completed Steps:');
      if (result.state.jobAnalysis) console.log('   1. Job Analysis ✓');
      if (result.state.profileMatch) {
        console.log(`   2. Profile Matching ✓ (Relevance: ${result.state.profileMatch.relevanceScore}/100)`);
      }
      if (result.state.optimizedResume) console.log('   3. Content Optimization ✓');
      if (result.state.formatValidation) {
        const validation = result.state.formatValidation;
        console.log(`   4. Format Validation ✓ (ATS Compliant: ${validation.atsCompliant ? 'Yes' : 'No'})`);
        if (validation.issues.length > 0) {
          console.log(`      Issues found: ${validation.issues.length}`);
          validation.issues.forEach((issue) => {
            const icon = issue.severity === 'error' ? '❌' : issue.severity === 'warning' ? '⚠️' : 'ℹ️';
            console.log(`      ${icon} ${issue.message}`);
          });
        }
      }
      if (result.state.generatedResume) console.log('   5. Output Generation ✓');
      
      console.log(`\n📈 Total Messages Exchanged: ${result.state.messages?.length || 0}`);
      console.log(`🔢 Total Tokens Consumed: ${result.state.tokensUsed || 0}`);
      console.log(`⚠️  Errors Encountered: ${result.state.errors?.length || 0}`);
    }

    console.log('\n═══════════════════════════════════════════════════════════════');
    console.log('✅ ALL TESTS PASSED - JSON RESUME v1.0.0 VALIDATED');
    console.log('═══════════════════════════════════════════════════════════════\n');

  } catch (error) {
    console.log('\n═══════════════════════════════════════════════════════════════\n');
    console.error('❌ Test failed with exception:', error);
    if (error instanceof Error) {
      console.error('\nError details:');
      console.error(`  Message: ${error.message}`);
      console.error(`  Stack: ${error.stack}`);
    }
    process.exit(1);
  }
}

main();
