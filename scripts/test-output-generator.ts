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
      console.log(`   Name: ${resume.basics?.name || 'N/A'}`);
      console.log(`   Email: ${resume.basics?.email || 'N/A'}`);
      console.log(`   Phone: ${resume.basics?.phone || 'N/A'}`);
      console.log(`   Location: ${resume.basics?.location?.city || 'N/A'}`);
      const linkedIn = resume.basics?.profiles?.find(p => p.network === 'LinkedIn');
      const github = resume.basics?.profiles?.find(p => p.network === 'GitHub');
      if (linkedIn) console.log(`   LinkedIn: ${linkedIn.url}`);
      if (github) console.log(`   GitHub: ${github.url}`);
      
      console.log('\n📝 Summary:');
      console.log(`   ${resume.basics?.summary || 'N/A'}`);
      
      console.log('\n💼 Experience:');
      resume.work?.forEach((exp, i) => {
        const dates = exp.endDate ? `${exp.startDate} - ${exp.endDate}` : `${exp.startDate} - Present`;
        console.log(`   ${i + 1}. ${exp.position} at ${exp.name} (${dates})`);
        console.log(`      ${exp.summary || ''}`);
        if (exp.highlights && exp.highlights.length > 0) {
          console.log(`      Achievements:`);
          exp.highlights.forEach((bullet: string) => {
            console.log(`      • ${bullet}`);
          });
        }
      });
      
      console.log('\n🎓 Education:');
      resume.education?.forEach((edu, i) => {
        const dates = edu.endDate ? `${edu.startDate} - ${edu.endDate}` : edu.startDate;
        console.log(`   ${i + 1}. ${edu.studyType} in ${edu.area} - ${edu.institution}`);
        if (edu.score) console.log(`      GPA: ${edu.score}`);
        console.log(`      ${dates}`);
      });
      
      console.log('\n🔧 Skills:');
      resume.skills?.forEach((skill, i) => {
        console.log(`   ${i + 1}. ${skill.name}: ${skill.keywords?.join(', ') || ''}`);
      });
      
      console.log('\n📊 Metadata:');
      console.log(`   Generated: ${resume.meta?.version || 'N/A'}`);
      if (resume.work && resume.work.length > 0) {
        console.log(`   Latest Position: ${resume.work[0].position} at ${resume.work[0].name}`);
      }
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
