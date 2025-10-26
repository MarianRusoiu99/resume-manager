/**
 * Test script for Format Validation Agent
 * 
 * This script tests the complete workflow:
 * 1. Job analysis
 * 2. Profile matching  
 * 3. Content optimization
 * 4. Format validation (NEW)
 * 
 * Usage:
 *   OPENAI_API_KEY=sk-... npx tsx scripts/test-format-validation.ts
 */

import { testFormatValidationAgent } from '../lib/ai/workflow';

async function main() {
  const apiKey = process.env.OPENAI_API_KEY;

  if (!apiKey) {
    console.error('❌ Error: OPENAI_API_KEY environment variable is required');
    console.log('\nUsage:');
    console.log('  OPENAI_API_KEY=sk-... npx tsx scripts/test-format-validation.ts');
    process.exit(1);
  }

  try {
    console.log('🚀 Starting Format Validation Agent Test...\n');
    
    // Run the test
    const result = await testFormatValidationAgent(apiKey);
    
    console.log('\n✅ All tests passed!');
    console.log(`\nFinal token count: ${result.tokensUsed || 0}`);
    console.log(`ATS Compliant: ${result.formatValidation?.atsCompliant ? 'YES' : 'NO'}`);
    
  } catch (error) {
    console.error('\n❌ Test failed:', error);
    process.exit(1);
  }
}

main();
