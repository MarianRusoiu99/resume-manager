# LangChain Checkpointing Guide

## Overview

The resume generation workflow now includes **checkpointing** functionality, which provides:

- **Workflow resumption** after interruption or failure
- **State persistence** across node executions
- **Debugging capabilities** to inspect intermediate states
- **Rollback support** to previous workflow states

## Architecture

### Components

1. **MemorySaver**: In-memory checkpoint storage (current implementation)
2. **Thread ID System**: Unique identifier format: `{userId}-{timestamp}`
3. **WorkflowCheckpointStore**: High-level API for checkpoint management
4. **Checkpoint Metadata**: Progress tracking and error context

### File Structure

```
lib/ai/workflow/
├── checkpointing.ts      # Checkpointing utilities and MemorySaver
├── graph.ts              # StateGraph with checkpoint compilation
├── service.ts            # High-level workflow service
└── index.ts              # Public API exports
```

## Usage

### Basic Workflow with Checkpointing

```typescript
import { 
  compileResumeWorkflow,
  createCheckpointConfig 
} from '@/lib/ai/workflow';

// Create checkpoint-enabled workflow
const workflow = compileResumeWorkflow({ withCheckpointing: true });

// Create checkpoint configuration for a user
const config = createCheckpointConfig('user-123');

// Execute workflow with checkpointing
const result = await workflow.invoke(initialState, config);

// Thread ID is automatically generated: "user-123-1234567890"
console.log('Thread ID:', config.configurable.thread_id);
```

### Resuming Interrupted Workflows

```typescript
import { 
  compileResumeWorkflow,
  createCheckpointConfigWithThreadId 
} from '@/lib/ai/workflow';

// Resume workflow from specific thread
const threadId = 'user-123-1234567890'; // From previous execution
const config = createCheckpointConfigWithThreadId(threadId);

const workflow = compileResumeWorkflow({ withCheckpointing: true });
const result = await workflow.invoke(partialState, config);
```

### Using WorkflowCheckpointStore

```typescript
import { WorkflowCheckpointStore } from '@/lib/ai/workflow';

// Create checkpoint store instance
const checkpointStore = new WorkflowCheckpointStore();

// Start new workflow with checkpointing
const config = checkpointStore.createConfig('user-123');
const workflow = compileResumeWorkflow({ withCheckpointing: true });

// Get checkpointer for manual inspection (advanced)
const checkpointer = checkpointStore.getCheckpointer();
```

### Analyzing Workflow State

```typescript
import { 
  canResumeWorkflow,
  getNextStep,
  extractCheckpointMetadata 
} from '@/lib/ai/workflow';

// Check if workflow can be resumed
if (canResumeWorkflow(state)) {
  const nextStep = getNextStep(state);
  console.log('Resume from step:', nextStep);
}

// Extract checkpoint metadata
const metadata = extractCheckpointMetadata(state, threadId);
console.log('Progress:', metadata.completedSteps);
console.log('Errors:', metadata.errors);
```

## Configuration

### Compile Options

```typescript
// With checkpointing (default)
const workflow1 = compileResumeWorkflow({ withCheckpointing: true });

// Without checkpointing (stateless)
const workflow2 = compileResumeWorkflow({ withCheckpointing: false });

// Default (checkpointing enabled)
const workflow3 = compileResumeWorkflow();
```

## Production Considerations

### Current Implementation: MemorySaver

- **Pros**: Fast, no external dependencies, simple setup
- **Cons**: Checkpoints lost on server restart, not scalable across instances

### Recommended for Production: PostgresSaver

```typescript
// Future implementation (when needed)
import { PostgresSaver } from '@langchain/langgraph-checkpoint-postgres';

const checkpointer = PostgresSaver.fromConnString(
  process.env.DATABASE_URL
);

const workflow = graph.compile({ checkpointer });
```

**Benefits**:
- Persistent storage in PostgreSQL database
- Survives server restarts
- Scalable across multiple instances
- Queryable checkpoint history

### Alternative: SqliteSaver

```typescript
// For single-server deployments
import { SqliteSaver } from '@langchain/langgraph-checkpoint-sqlite';

const checkpointer = SqliteSaver.fromConnString('checkpoints.db');
const workflow = graph.compile({ checkpointer });
```

## Testing

Run the test suite:

```bash
npx tsx scripts/test-checkpointing.ts
```

Tests cover:
- Thread ID creation and parsing
- Checkpoint configuration
- Workflow state analysis
- Resume detection
- Metadata extraction
- Workflow compilation

## API Reference

### Thread ID Functions

#### `createThreadId(userId: string): string`
Generates unique thread ID: `{userId}-{timestamp}`

#### `parseThreadId(threadId: string): { userId, timestamp } | null`
Extracts user ID and timestamp from thread ID

### Configuration Functions

#### `createCheckpointConfig(userId: string): CheckpointConfig`
Creates new checkpoint config for starting workflows

#### `createCheckpointConfigWithThreadId(threadId: string): CheckpointConfig`
Creates checkpoint config for resuming workflows

### State Analysis Functions

#### `canResumeWorkflow(state: ResumeGenerationState): boolean`
Checks if workflow has intermediate results and can be resumed

#### `getNextStep(state: ResumeGenerationState): string | null`
Determines next workflow step to execute

#### `extractCheckpointMetadata(state, threadId): CheckpointMetadata`
Extracts progress tracking metadata from workflow state

### Classes

#### `WorkflowCheckpointStore`
High-level checkpoint management API

**Methods**:
- `createConfig(userId)`: Create config for new workflow
- `resumeConfig(threadId)`: Create config for resuming workflow
- `getCheckpointer()`: Access underlying MemorySaver instance

## Examples

### Example 1: Auto-Resume on Error

```typescript
async function resilientWorkflowExecution(userId: string, state: any) {
  const store = new WorkflowCheckpointStore();
  let config = store.createConfig(userId);
  
  try {
    const workflow = compileResumeWorkflow({ withCheckpointing: true });
    return await workflow.invoke(state, config);
  } catch (error) {
    console.error('Workflow failed:', error);
    
    // Resume from checkpoint
    if (canResumeWorkflow(state)) {
      console.log('Attempting to resume from checkpoint...');
      config = store.resumeConfig(config.configurable.thread_id);
      return await workflow.invoke(state, config);
    }
    
    throw error;
  }
}
```

### Example 2: Progress Tracking

```typescript
async function trackWorkflowProgress(userId: string, state: any) {
  const config = createCheckpointConfig(userId);
  const workflow = compileResumeWorkflow({ withCheckpointing: true });
  
  // Execute with progress logging
  for await (const event of workflow.stream(state, config)) {
    const metadata = extractCheckpointMetadata(event, config.configurable.thread_id);
    console.log(`Step ${metadata.currentStep}: ${metadata.completedSteps.length}/5 complete`);
  }
}
```

## Migration Path

### Current (MVP): MemorySaver
- Suitable for development and testing
- Acceptable for low-traffic production (single instance)
- No database required

### Phase 2: PostgresSaver
When you need:
- Multi-instance deployment
- Checkpoint persistence across restarts
- Long-running workflows (hours/days)
- Compliance/audit requirements

Migration steps:
1. Install `@langchain/langgraph-checkpoint-postgres`
2. Update `createMemoryCheckpointer()` to use `PostgresSaver`
3. Configure database connection
4. Test checkpoint retrieval

## Best Practices

1. **Always use checkpointing in production** to prevent data loss
2. **Store thread IDs** with resume records for manual recovery
3. **Monitor checkpoint storage size** (especially with MemorySaver)
4. **Clean up old checkpoints** to prevent memory leaks
5. **Log thread IDs** for debugging and support
6. **Test resume scenarios** regularly

## Troubleshooting

### Checkpoints not persisting
- Verify `withCheckpointing: true` in compile options
- Check if checkpointer is passed to `graph.compile()`
- Confirm MemorySaver instance is not being recreated

### Cannot resume workflow
- Verify thread ID format is correct
- Check if state has intermediate results
- Use `canResumeWorkflow()` to validate state

### Thread ID parsing fails
- Ensure userId doesn't conflict with delimiter format
- Use `parseThreadId()` to validate format
- Check for special characters in userId

## Future Enhancements

1. **PostgresSaver Integration**: Database-backed persistence
2. **Checkpoint Expiration**: Auto-cleanup of old checkpoints
3. **Resume API Endpoints**: HTTP API for workflow resumption
4. **Checkpoint Visualization**: UI for inspecting workflow state
5. **Distributed Checkpointing**: Redis/DynamoDB support
