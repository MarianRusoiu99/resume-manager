/**
 * Test script for Content Optimization Agent
 * 
 * This script tests the complete workflow:
 * 1. Job analysis
 * 2. Profile matching  
 * 3. Content optimization (NEW)
 * 
 * Usage:
 *   OPENAI_API_KEY=sk-... npx tsx scripts/test-content-optimization.ts
 */

import { testContentOptimizationAgent } from '../lib/ai/workflow';

async function main() {
  const apiKey = process.env.OPENAI_API_KEY;

  if (!apiKey) {
    console.error('❌ Error: OPENAI_API_KEY environment variable is required');
    console.log('\nUsage:');
    console.log('  OPENAI_API_KEY=sk-... npx tsx scripts/test-content-optimization.ts');
    process.exit(1);
  }

  try {
    console.log('🚀 Starting Content Optimization Agent Test...\n');
    
    // Run the test
    const result = await testContentOptimizationAgent(apiKey);
    
    console.log('\n✅ All tests passed!');
    console.log(`\nFinal token count: ${result.tokensUsed || 0}`);
    
  } catch (error) {
    console.error('\n❌ Test failed:', error);
    process.exit(1);
  }
}

main();
