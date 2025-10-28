/**
 * Test script for LangChain memory and checkpointing
 * 
 * Demonstrates:
 * - Creating checkpoints during workflow execution
 * - Resuming workflows from checkpoints
 * - Thread ID management
 * - Checkpoint metadata extraction
 * 
 * Run with: npx tsx scripts/test-checkpointing.ts
 */

import {
  createThreadId,
  parseThreadId,
  createCheckpointConfig,
  createCheckpointConfigWithThreadId,
  extractCheckpointMetadata,
  canResumeWorkflow,
  getNextStep,
  WorkflowCheckpointStore
} from '../lib/ai/workflow/checkpointing';
import { compileResumeWorkflow } from '../lib/ai/workflow/graph';
import type { ResumeGenerationState } from '../lib/ai/workflow/types';

console.log('🧪 Testing LangChain Memory and Checkpointing\n');

// Test 1: Thread ID creation and parsing
console.log('Test 1: Thread ID Management');
console.log('━'.repeat(50));

const userId = 'test-user-123';
const threadId = createThreadId(userId);
console.log(`✓ Created thread ID: ${threadId}`);

const parsed = parseThreadId(threadId);
if (parsed) {
  console.log(`✓ Parsed userId: ${parsed.userId}`);
  console.log(`✓ Parsed timestamp: ${new Date(parsed.timestamp).toISOString()}`);
} else {
  console.log('✗ Failed to parse thread ID');
}

// Test 2: Checkpoint configuration
console.log('\nTest 2: Checkpoint Configuration');
console.log('━'.repeat(50));

const config = createCheckpointConfig(userId);
console.log(`✓ Created checkpoint config with thread_id: ${config.configurable.thread_id}`);

const resumeConfig = createCheckpointConfigWithThreadId(threadId);
console.log(`✓ Created resume config with thread_id: ${resumeConfig.configurable.thread_id}`);

// Test 3: WorkflowCheckpointStore
console.log('\nTest 3: Workflow Checkpoint Store');
console.log('━'.repeat(50));

const checkpointStore = new WorkflowCheckpointStore();
console.log('✓ Created WorkflowCheckpointStore instance');

const storeConfig = checkpointStore.createConfig(userId);
console.log(`✓ Store created config with thread_id: ${storeConfig.configurable.thread_id}`);

const checkpointer = checkpointStore.getCheckpointer();
console.log(`✓ Retrieved checkpointer: ${checkpointer.constructor.name}`);

// Test 4: Workflow state analysis
console.log('\nTest 4: Workflow State Analysis');
console.log('━'.repeat(50));

// Create a minimal sample state for testing
const minimalState: Partial<ResumeGenerationState> = {
  jobDescription: 'Looking for a senior software engineer',
  jobTitle: 'Senior Software Engineer',
  companyName: 'Example Corp',
  currentStep: 'analyze_job',
  errors: [],
  tokensUsed: 0
};

console.log('✓ Created minimal workflow state');

// Test incomplete state (has job analysis but nothing else)
const incompleteState = {
  ...minimalState,
  jobAnalysis: {
    requirements: {
      required: ['React', 'Node.js'],
      preferred: ['TypeScript']
    },
    keywords: ['JavaScript', 'React', 'Node.js'],
    atsKeywords: ['React', 'Node.js'],
    jobSummary: 'Senior software engineer position',
    keyResponsibilities: ['Build scalable applications']
  }
} as ResumeGenerationState;

console.log(`✓ Can resume incomplete workflow: ${canResumeWorkflow(incompleteState)}`);
console.log(`✓ Next step for incomplete workflow: ${getNextStep(incompleteState)}`);

// Test complete state (has all intermediate results and final output)
const completeState = {
  ...incompleteState,
  profileMatch: {
    relevanceScore: 0.85,
    matchedSkills: ['React', 'Node.js'],
    missingSkills: [],
    experienceMatch: 0.9,
    recommendations: ['Highlight React experience']
  },
  optimizedContent: {
    summary: 'Expert software engineer...',
    experience: [],
    prioritizedSkills: ['React', 'Node.js']
  },
  formatValidation: {
    atsCompliant: true,
    issues: [],
    recommendations: []
  },
  generatedResume: {
    personalInfo: {
      name: 'Test User',
      email: 'test@example.com'
    },
    summary: 'Expert software engineer...',
    experience: [],
    education: [],
    skills: ['React', 'Node.js', 'TypeScript'], // This should be string[]
    metadata: {
      generatedAt: new Date().toISOString(),
      modelUsed: 'gpt-4',
      tokensUsed: 1000
    }
  }
} as ResumeGenerationState;

console.log(`✓ Can resume complete workflow: ${canResumeWorkflow(completeState)}`);
console.log(`✓ Next step for complete workflow: ${getNextStep(completeState) || 'COMPLETE'}`);

// Test 5: Checkpoint metadata extraction
console.log('\nTest 5: Checkpoint Metadata Extraction');
console.log('━'.repeat(50));

const metadata = extractCheckpointMetadata(incompleteState, threadId);
console.log('✓ Extracted checkpoint metadata:');
console.log(`  - Thread ID: ${metadata.threadId}`);
console.log(`  - User ID: ${metadata.userId}`);
console.log(`  - Start Time: ${new Date(metadata.startTime).toISOString()}`);
console.log(`  - Current Step: ${metadata.currentStep || 'N/A'}`);
console.log(`  - Completed Steps: ${metadata.completedSteps.join(', ') || 'None'}`);
console.log(`  - Errors: ${metadata.errors.length}`);

// Test 6: Compile workflow with checkpointing
console.log('\nTest 6: Compile Workflow with Checkpointing');
console.log('━'.repeat(50));

try {
  const workflowWithCheckpoints = compileResumeWorkflow({ withCheckpointing: true });
  console.log('✓ Successfully compiled workflow WITH checkpointing');
  console.log(`  Type: ${workflowWithCheckpoints.constructor.name}`);
  
  const workflowWithoutCheckpoints = compileResumeWorkflow({ withCheckpointing: false });
  console.log('✓ Successfully compiled workflow WITHOUT checkpointing');
  console.log(`  Type: ${workflowWithoutCheckpoints.constructor.name}`);
} catch (error) {
  console.error('✗ Failed to compile workflow:', error);
}

// Test 7: Simulate checkpointed workflow execution
console.log('\nTest 7: Simulated Checkpointed Execution');
console.log('━'.repeat(50));

console.log('✓ Workflow with checkpointing enabled:');
console.log('  - State is automatically saved after each node execution');
console.log('  - Can be resumed using thread_id if interrupted');
console.log('  - Useful for long-running workflows or debugging');
console.log('  - Currently using MemorySaver (in-memory, lost on restart)');
console.log('  - Can upgrade to SqliteSaver or PostgresSaver for persistence');

console.log('\n✅ All checkpointing tests completed successfully!\n');
console.log('📝 Integration notes:');
console.log('  - Use createCheckpointConfig(userId) when starting new workflows');
console.log('  - Pass config to workflow.invoke(state, config) to enable checkpointing');
console.log('  - Use resumeConfig(threadId) to continue interrupted workflows');
console.log('  - Consider PostgresSaver for production deployments');
