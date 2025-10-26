/**
 * Test script for the LangGraph workflow
 * Run with: npx ts-node --esm scripts/test-workflow.ts
 */

import { runAllTests } from '../lib/ai/workflow/testing';

async function main() {
  console.log('🧪 Testing LangGraph Resume Generation Workflow\n');
  console.log('='.repeat(60));
  
  try {
    await runAllTests();
    console.log('\n' + '='.repeat(60));
    console.log('✅ All tests completed!');
  } catch (error) {
    console.error('\n' + '='.repeat(60));
    console.error('❌ Test execution failed:',  error);
    process.exit(1);
  }
}

main();
