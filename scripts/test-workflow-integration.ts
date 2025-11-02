#!/usr/bin/env ts-node

/**
 * Test script for Phase 4.7 - Complete Workflow Integration
 * Tests the full end-to-end workflow using the service layer
 * 
 * Run with: npx ts-node scripts/test-workflow-integration.ts
 */

import { generateResume } from '../lib/ai/workflow';
import type { Resume } from '../lib/validations/jsonresume';

// Mock user ID for testing
const MOCK_USER_ID = 'test-user-123';

// Create test profile using JSON Resume format
const testProfile: Resume = {
  basics: {
    name: 'Sarah Johnson',
    label: 'Senior Full Stack Engineer',
    email: 'sarah.johnson@email.com',
    phone: '+1 (555) 123-4567',
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
      summary: 'Lead engineer for flagship SaaS product serving 10,000+ enterprise customers. Architected microservices infrastructure, led team of 5 engineers, optimized database performance, and mentored junior developers resulting in 3 promotions.',
      highlights: [
        'Architected microservices infrastructure serving 10,000+ customers',
        'Led team of 5 engineers with 3 successful promotions',
        'Optimized database performance by 40%',
        'Implemented monitoring and alerting systems'
      ]
    },
    {
      name: 'StartupXYZ',
      position: 'Full Stack Developer',
      startDate: '2017-06',
      endDate: '2020-02',
      summary: 'Early employee building MVP and scaling to 1000+ paying customers. Built React frontend serving 50,000+ monthly users, developed RESTful APIs handling 1M+ requests/day, and implemented CI/CD pipeline.',
      highlights: [
        'Built React frontend serving 50,000+ monthly users',
        'Developed RESTful APIs handling 1M+ requests/day',
        'Implemented CI/CD pipeline reducing deployment time by 60%',
        'Scaled infrastructure to handle 10x growth'
      ]
    }
  ],
  education: [
    {
      institution: 'University of California, Berkeley',
      studyType: 'Bachelor of Science',
      area: 'Computer Science',
      score: '3.8',
      startDate: '2013-08',
      endDate: '2017-05',
      courses: ['Distributed Systems', 'Algorithms', 'Software Engineering']
    }
  ],
  skills: [
    {
      name: 'Frontend',
      keywords: ['JavaScript', 'TypeScript', 'React', 'Redux', 'Next.js']
    },
    {
      name: 'Backend',
      keywords: ['Node.js', 'Express', 'PostgreSQL', 'MongoDB', 'REST APIs', 'GraphQL']
    },
    {
      name: 'DevOps',
      keywords: ['AWS', 'Docker', 'Kubernetes', 'CI/CD', 'Git']
    },
    {
      name: 'Testing',
      keywords: ['Jest', 'Cypress', 'React Testing Library']
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
  console.log('=== Phase 4.7: Complete Workflow Integration Test ===\n');

  // Check for API key
  if (!process.env.OPENAI_API_KEY) {
    console.error('❌ Error: OPENAI_API_KEY environment variable not set');
    console.log('Please set it with: export OPENAI_API_KEY=your-key-here');
    process.exit(1);
  }

  console.log('Test Configuration:');
  console.log(`- User ID: ${MOCK_USER_ID}`);
  console.log(`- Job: Senior Frontend Engineer at [Test Company]`);
  console.log(`- Profile: ${testProfile.basics?.name}\n`);

  console.log('Running complete workflow...\n');
  console.log('═══════════════════════════════════════════════════════════════\n');

  try {
    const startTime = Date.now();

    const result = await generateResume({
      userId: MOCK_USER_ID,
      jobDescription: testJobDescription,
      jobTitle: 'Senior Frontend Engineer',
      companyName: 'Test Company',
      userResume: testProfile
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
    
    // Display comprehensive results
    if (result.resume) {
      const resume = result.resume;
      
      console.log('═══════════════════════════════════════════════════════════════');
      console.log('📄 GENERATED RESUME');
      console.log('═══════════════════════════════════════════════════════════════\n');
      
      console.log('📋 Personal Information:');
      console.log(`   ${resume.basics?.name}`);
      console.log(`   ${resume.basics?.email} | ${resume.basics?.phone || 'N/A'}`);
      console.log(`   ${resume.basics?.location?.city || 'N/A'}`);
      const linkedIn = resume.basics?.profiles?.find(p => p.network === 'LinkedIn');
      const github = resume.basics?.profiles?.find(p => p.network === 'GitHub');
      if (linkedIn) console.log(`   LinkedIn: ${linkedIn.url}`);
      if (github) console.log(`   GitHub: ${github.url}`);
      
      console.log('\n📝 Professional Summary:');
      console.log(`   ${resume.basics?.summary}`);
      
      console.log('\n💼 Work Experience:');
      resume.work?.forEach((exp, i) => {
        const dates = exp.endDate ? `${exp.startDate} - ${exp.endDate}` : `${exp.startDate} - Present`;
        console.log(`\n   ${i + 1}. ${exp.position} at ${exp.name}`);
        console.log(`      ${dates}`);
        console.log(`      ${exp.summary || ''}`);
        if (exp.highlights && exp.highlights.length > 0) {
          console.log(`\n      Key Achievements:`);
          exp.highlights.forEach((bullet) => {
            console.log(`      • ${bullet}`);
          });
        }
      });
      
      console.log('\n🎓 Education:');
      resume.education?.forEach((edu, i) => {
        const dates = edu.endDate ? `${edu.startDate} - ${edu.endDate}` : edu.startDate;
        console.log(`   ${i + 1}. ${edu.studyType} in ${edu.area}`);
        console.log(`      ${edu.institution}`);
        if (edu.score) console.log(`      GPA: ${edu.score}`);
        console.log(`      ${dates}`);
      });
      
      console.log('\n🔧 Technical Skills:');
      if (resume.skills && resume.skills.length > 0) {
        resume.skills.forEach((skill, i) => {
          console.log(`   ${i + 1}. ${skill.name}: ${skill.keywords?.join(', ') || ''}`);
        });
      }
      
      console.log('\n═══════════════════════════════════════════════════════════════');
      console.log('📊 WORKFLOW METRICS');
      console.log('═══════════════════════════════════════════════════════════════\n');
      
      console.log(`⏱️  Execution Time: ${duration}s`);
      if (resume.work && resume.work.length > 0) {
        console.log(`💼 Target Role: ${resume.work[0].position} at ${resume.work[0].name}`);
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
    console.log('✅ ALL TESTS PASSED');
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
