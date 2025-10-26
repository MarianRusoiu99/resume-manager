#!/usr/bin/env ts-node

/**
 * Test script for Phase 4.6 - Output Generator Agent
 * Tests the complete workflow end-to-end:
 * 1. Job analysis
 * 2. Profile matching
 * 3. Content optimization
 * 4. Format validation
 * 5. Output generation (final resume assembly)
 * 
 * Run with: npx ts-node scripts/test-output-generator.ts
 */

import { testOutputGeneratorAgent } from '../lib/ai/workflow';

async function main() {
  console.log('=== Phase 4.6: Output Generator Agent Test ===\n');

  // Check for API key
  if (!process.env.OPENAI_API_KEY) {
    console.error('❌ Error: OPENAI_API_KEY environment variable not set');
    console.log('Please set it with: export OPENAI_API_KEY=your-key-here');
    process.exit(1);
  }

  console.log('Running complete workflow (job analysis → profile matching → content optimization → format validation → output generation)...\n');

  try {
    const finalState = await testOutputGeneratorAgent();

    // Display results
    console.log('\n=== FINAL RESUME OUTPUT ===\n');
    
    if (finalState.generatedResume) {
      const resume = finalState.generatedResume;
      
      console.log('📋 Personal Information:');
      console.log(`   Name: ${resume.personalInfo.name}`);
      console.log(`   Email: ${resume.personalInfo.email}`);
      console.log(`   Phone: ${resume.personalInfo.phone || 'N/A'}`);
      console.log(`   Location: ${resume.personalInfo.location || 'N/A'}`);
      if (resume.personalInfo.linkedin) console.log(`   LinkedIn: ${resume.personalInfo.linkedin}`);
      if (resume.personalInfo.github) console.log(`   GitHub: ${resume.personalInfo.github}`);
      
      console.log('\n📝 Summary:');
      console.log(`   ${resume.summary}`);
      
      console.log('\n💼 Experience:');
      resume.experience.forEach((exp, i) => {
        const dates = exp.current ? `${exp.startDate} - Present` : `${exp.startDate} - ${exp.endDate}`;
        console.log(`   ${i + 1}. ${exp.title} at ${exp.company} (${dates})`);
        console.log(`      ${exp.description}`);
        console.log(`      Achievements:`);
        exp.bulletPoints.forEach((bullet: string) => {
          console.log(`      • ${bullet}`);
        });
      });
      
      console.log('\n🎓 Education:');
      resume.education.forEach((edu, i) => {
        const dates = edu.endDate ? `${edu.startDate} - ${edu.endDate}` : edu.startDate;
        console.log(`   ${i + 1}. ${edu.degree} in ${edu.field} - ${edu.school}`);
        if (edu.gpa) console.log(`      GPA: ${edu.gpa}`);
        console.log(`      ${dates}`);
      });
      
      console.log('\n🔧 Skills (Prioritized):');
      resume.skills.forEach((skill, i) => {
        console.log(`   ${i + 1}. ${skill}`);
      });
      
      console.log('\n📊 Metadata:');
      console.log(`   Generated: ${resume.metadata.generatedAt}`);
      console.log(`   Model: ${resume.metadata.modelUsed}`);
      console.log(`   Tokens: ${resume.metadata.tokensUsed}`);
      console.log(`   Target: ${resume.metadata.jobTitle} at ${resume.metadata.companyName}`);
    } else {
      console.log('❌ No resume generated');
    }

    // Show validation results
    if (finalState.formatValidation) {
      console.log('\n=== ATS VALIDATION RESULTS ===\n');
      console.log(`✓ ATS Compliant: ${finalState.formatValidation.atsCompliant ? '✅ Yes' : '❌ No'}`);
      
      if (finalState.formatValidation.issues.length > 0) {
        console.log('\n⚠️  Issues Found:');
        finalState.formatValidation.issues.forEach((issue) => {
          const icon = issue.severity === 'error' ? '❌' : issue.severity === 'warning' ? '⚠️' : 'ℹ️';
          const location = issue.location ? ` (${issue.location})` : '';
          console.log(`   ${icon} ${issue.message}${location}`);
        });
      }
      
      if (finalState.formatValidation.recommendations.length > 0) {
        console.log('\n💡 Recommendations:');
        finalState.formatValidation.recommendations.forEach((rec) => {
          console.log(`   • ${rec}`);
        });
      }
    }

    // Show profile match summary
    if (finalState.profileMatch) {
      console.log('\n=== PROFILE MATCH SUMMARY ===\n');
      console.log(`🎯 Relevance Score: ${finalState.profileMatch.relevanceScore}/100`);
      console.log(`💪 Experience Match: ${finalState.profileMatch.experienceMatch}/10`);
      console.log(`✅ Matched Skills: ${finalState.profileMatch.matchedSkills.length}`);
      console.log(`❌ Missing Skills: ${finalState.profileMatch.missingSkills.length}`);
    }

    console.log('\n✅ Test completed successfully!\n');
  } catch (error) {
    console.error('\n❌ Test failed:', error);
    if (error instanceof Error) {
      console.error('Error message:', error.message);
      console.error('Stack trace:', error.stack);
    }
    process.exit(1);
  }
}

main();
