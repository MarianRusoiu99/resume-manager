#!/usr/bin/env ts-node

/**
 * Test script for Phase 4.7 - Complete Workflow Integration
 * Tests the full end-to-end workflow using the service layer
 * 
 * Run with: npx ts-node scripts/test-workflow-integration.ts
 */

import { generateResume } from '../lib/ai/workflow';
import type { GenerateResumeInput } from '../lib/ai/workflow';

// Mock user ID for testing
const MOCK_USER_ID = 'test-user-123';

// Create test profile
const testProfile: GenerateResumeInput['userProfile'] = {
  personalInfo: {
    name: 'Sarah Johnson',
    email: 'sarah.johnson@email.com',
    phone: '+1 (555) 123-4567',
    location: 'San Francisco, CA',
    linkedin: 'https://linkedin.com/in/sarahjohnson',
    github: 'https://github.com/sarah-johnson'
  },
  summary: 'Senior Full Stack Engineer with 7+ years of experience building scalable web applications. Expert in React, Node.js, and cloud infrastructure. Passionate about creating user-friendly products and mentoring junior developers.',
  experience: [
    {
      company: 'TechCorp Solutions',
      title: 'Senior Software Engineer',
      startDate: '2020-03',
      current: true,
      description: 'Lead engineer for flagship SaaS product serving 10,000+ enterprise customers. Architected microservices infrastructure, led team of 5 engineers, optimized database performance, and mentored junior developers resulting in 3 promotions.'
    },
    {
      company: 'StartupXYZ',
      title: 'Full Stack Developer',
      startDate: '2017-06',
      endDate: '2020-02',
      current: false,
      description: 'Early employee building MVP and scaling to 1000+ paying customers. Built React frontend serving 50,000+ monthly users, developed RESTful APIs handling 1M+ requests/day, and implemented CI/CD pipeline.'
    }
  ],
  education: [
    {
      school: 'University of California, Berkeley',
      degree: 'Bachelor of Science',
      field: 'Computer Science',
      gpa: '3.8',
      startDate: '2013-08',
      endDate: '2017-05',
      description: 'Focus on software engineering and distributed systems. Dean\'s List all semesters.'
    }
  ],
  skills: {
    technical: [
      'JavaScript', 'TypeScript', 'React', 'Node.js', 'Express', 'PostgreSQL',
      'MongoDB', 'AWS', 'Docker', 'Kubernetes', 'Git', 'CI/CD', 'REST APIs',
      'GraphQL', 'Redux', 'Jest', 'Cypress'
    ],
    soft: [
      'Team Leadership', 'Mentoring', 'Agile/Scrum', 'Problem Solving',
      'Communication', 'Code Review', 'Technical Writing'
    ],
    languages: ['English (Native)', 'Spanish (Conversational)']
  }
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
  console.log(`- Profile: ${testProfile.personalInfo.name}\n`);

  console.log('Running complete workflow...\n');
  console.log('═══════════════════════════════════════════════════════════════\n');

  try {
    const startTime = Date.now();

    const result = await generateResume({
      userId: MOCK_USER_ID,
      jobDescription: testJobDescription,
      jobTitle: 'Senior Frontend Engineer',
      companyName: 'Test Company',
      userProfile: testProfile
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
      console.log(`   ${resume.personalInfo.name}`);
      console.log(`   ${resume.personalInfo.email} | ${resume.personalInfo.phone || 'N/A'}`);
      console.log(`   ${resume.personalInfo.location || 'N/A'}`);
      if (resume.personalInfo.linkedin) console.log(`   LinkedIn: ${resume.personalInfo.linkedin}`);
      if (resume.personalInfo.github) console.log(`   GitHub: ${resume.personalInfo.github}`);
      
      console.log('\n📝 Professional Summary:');
      console.log(`   ${resume.summary}`);
      
      console.log('\n💼 Work Experience:');
      resume.experience.forEach((exp, i) => {
        const dates = exp.current ? `${exp.startDate} - Present` : `${exp.startDate} - ${exp.endDate}`;
        console.log(`\n   ${i + 1}. ${exp.title} at ${exp.company}`);
        console.log(`      ${dates}`);
        console.log(`      ${exp.description}`);
        console.log(`\n      Key Achievements:`);
        exp.bulletPoints.forEach((bullet: string) => {
          console.log(`      • ${bullet}`);
        });
      });
      
      console.log('\n🎓 Education:');
      resume.education.forEach((edu, i) => {
        const dates = edu.endDate ? `${edu.startDate} - ${edu.endDate}` : edu.startDate;
        console.log(`   ${i + 1}. ${edu.degree} in ${edu.field}`);
        console.log(`      ${edu.school}`);
        if (edu.gpa) console.log(`      GPA: ${edu.gpa}`);
        console.log(`      ${dates}`);
      });
      
      console.log('\n🔧 Technical Skills:');
      const skillsPerLine = 5;
      for (let i = 0; i < resume.skills.length; i += skillsPerLine) {
        const chunk = resume.skills.slice(i, i + skillsPerLine);
        console.log(`   ${chunk.join(' • ')}`);
      }
      
      console.log('\n═══════════════════════════════════════════════════════════════');
      console.log('📊 WORKFLOW METRICS');
      console.log('═══════════════════════════════════════════════════════════════\n');
      
      console.log(`⏱️  Execution Time: ${duration}s`);
      console.log(`🎯 Tokens Used: ${resume.metadata.tokensUsed}`);
      console.log(`🤖 Model: ${resume.metadata.modelUsed}`);
      console.log(`📅 Generated: ${new Date(resume.metadata.generatedAt).toLocaleString()}`);
      console.log(`💼 Target Role: ${resume.metadata.jobTitle} at ${resume.metadata.companyName}`);
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
      if (result.state.optimizedContent) console.log('   3. Content Optimization ✓');
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
