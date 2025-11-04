# Agents Module

## Overview

The agents module provides a clean, modular architecture for AI agents in the resume optimization workflow. All agents extend the `BaseAgent` class for consistency and code reuse.

## Architecture

### BaseAgent Class

Abstract base class that provides:
- **LLM Initialization**: Configured with retry logic
- **Prompt Building**: Abstract method for agent-specific prompts
- **Response Parsing**: Robust JSON parsing with Zod validation
- **Error Handling**: Consistent error formatting and logging
- **Token Tracking**: Automatic token usage estimation
- **Execution Flow**: Standard execute() method with retry logic

### Agent Lifecycle

```
1. Initialize Agent → Constructor with config
2. Build Prompt → buildPrompt(input)
3. Call LLM → createChain() with retry logic
4. Parse Response → parseResponse(rawResponse)
5. Validate Output → validateOutput(parsedOutput)
6. Return Result → AgentResult<T>
```

## Usage

### Creating a New Agent

```typescript
import { BaseAgent, createAgentMessages } from './base-agent';
import type { BaseMessage } from '@langchain/core/messages';

export class MyAgent extends BaseAgent<InputType, OutputType> {
  constructor(apiKey: string, model?: string) {
    super({
      apiKey,
      agentType: 'my-agent',
      model,
      enableLogging: true,
    });
  }

  protected buildPrompt(input: InputType): BaseMessage[] {
    const systemPrompt = 'You are an expert...';
    const userPrompt = `Analyze: ${input.data}`;
    
    return createAgentMessages(systemPrompt, userPrompt);
  }

  protected parseResponse(rawResponse: string): OutputType {
    const parsed = this.parseJSON<OutputType>(rawResponse);
    
    if (!parsed) {
      throw new Error('Failed to parse response');
    }
    
    // Validate with Zod
    const validation = MyOutputSchema.safeParse(parsed);
    if (!validation.success) {
      throw new Error(`Validation failed: ${validation.error.message}`);
    }
    
    return validation.data;
  }

  protected validateOutput(output: OutputType): boolean {
    // Custom validation logic
    if (!output.requiredField) {
      throw new Error('Missing required field');
    }
    return true;
  }
}
```

### Using an Agent

```typescript
// Create agent instance
const agent = new JobAnalysisAgent(apiKey);

// Execute
const result = await agent.execute({
  jobTitle: 'Software Engineer',
  companyName: 'Acme Corp',
  jobDescription: 'We are looking for...'
});

// Check result
if (result.success) {
  console.log('Analysis:', result.data);
  console.log('Tokens used:', result.tokensUsed);
  console.log('Duration:', result.duration, 'ms');
} else {
  console.error('Error:', result.error);
}
```

### Helper Function Pattern

```typescript
// Provide a simple function wrapper for convenience
export async function analyzeJob(
  input: JobAnalysisInput,
  apiKey: string,
  model?: string
) {
  const agent = new JobAnalysisAgent(apiKey, model);
  return agent.execute(input);
}

// Usage
const result = await analyzeJob(input, apiKey);
```

## Benefits

### Code Reuse
- No duplicate LLM initialization code
- Shared error handling and retry logic
- Common parsing and validation patterns

### Consistency
- All agents follow the same structure
- Predictable execution flow
- Standard result format

### Type Safety
- Generic types for input/output
- Zod validation for runtime checks
- TypeScript interfaces for compile-time safety

### Testability
- Easy to mock LLM responses
- Isolated validation logic
- Unit test individual methods

### Maintainability
- Clear separation of concerns
- Easy to add new agents
- Simple to modify existing agents

## Refactored Agents

- ✅ **JobAnalysisAgent** - Extracts job requirements and keywords
- 🔄 **ProfileMatchingAgent** - Analyzes candidate fit (TODO)
- 🔄 **ContentOptimizationAgent** - Optimizes resume content (TODO)
- 🔄 **FormatValidationAgent** - Validates resume format (TODO)
- 🔄 **CoverLetterAgent** - Generates cover letters (partially done)

## Configuration

Each agent automatically loads its configuration from `lib/ai/config/models.ts`:

```typescript
const agent = new JobAnalysisAgent(apiKey);
// Uses: 
// - model: 'gpt-4-turbo-preview'
// - temperature: 0.3
// - maxTokens: 2000

// Override if needed:
const agent = new JobAnalysisAgent(apiKey, 'gpt-3.5-turbo');
```

## Error Handling

Agents return a standard result format:

```typescript
interface AgentResult<T> {
  success: boolean;
  data?: T;
  error?: string;
  tokensUsed: number;
  duration: number;
}
```

Always check `success` before using `data`:

```typescript
const result = await agent.execute(input);

if (result.success) {
  // result.data is defined
  processData(result.data);
} else {
  // result.error is defined
  handleError(result.error);
}
```

## Logging

Enable/disable logging per agent:

```typescript
const agent = new JobAnalysisAgent(apiKey);
// Logging enabled by default

// Disable for production
const agent = new JobAnalysisAgent(apiKey);
agent.config.enableLogging = false;
```

## Testing

### Unit Testing Agents

```typescript
import { JobAnalysisAgent } from './job-analysis-refactored.agent';

describe('JobAnalysisAgent', () => {
  it('should parse valid response', async () => {
    const mockResponse = JSON.stringify({
      requiredSkills: ['JavaScript'],
      preferredSkills: ['TypeScript'],
      atsKeywords: ['React'],
      keyResponsibilities: ['Build apps'],
      summary: 'Software engineer role'
    });
    
    const agent = new JobAnalysisAgent(apiKey);
    const parsed = agent['parseResponse'](mockResponse);
    
    expect(parsed.requiredSkills).toContain('JavaScript');
  });
});
```

### Integration Testing

```typescript
it('should execute full workflow', async () => {
  const agent = new JobAnalysisAgent(process.env.OPENAI_API_KEY!);
  
  const result = await agent.execute({
    jobTitle: 'Engineer',
    companyName: 'Acme',
    jobDescription: 'Build cool things'
  });
  
  expect(result.success).toBe(true);
  expect(result.data?.requiredSkills.length).toBeGreaterThan(0);
});
```

## Migration Guide

### Before (Old Pattern)

```typescript
// Scattered logic in agent file
async function myAgent(state, apiKey) {
  const llm = new ChatOpenAI({ 
    openAIApiKey: apiKey,
    modelName: 'gpt-4',
    temperature: 0.7 
  });
  
  const prompt = PromptTemplate.fromTemplate(PROMPT);
  const chain = RunnableSequence.from([prompt, llm, new StringOutputParser()]);
  
  try {
    const result = await chain.invoke({ data: state.data });
    const parsed = JSON.parse(result);
    return { ...state, result: parsed };
  } catch (error) {
    return { ...state, errors: [...state.errors, error.message] };
  }
}
```

### After (New Pattern)

```typescript
// Clean agent class
class MyAgent extends BaseAgent<InputType, OutputType> {
  constructor(apiKey: string) {
    super({ apiKey, agentType: 'my-agent', enableLogging: true });
  }
  
  protected buildPrompt(input: InputType): BaseMessage[] {
    return createAgentMessages(SYSTEM_PROMPT, formatUserPrompt(input));
  }
  
  protected parseResponse(raw: string): OutputType {
    const parsed = this.parseJSON<OutputType>(raw);
    if (!parsed) throw new Error('Parse failed');
    
    const validated = MySchema.parse(parsed);
    return validated;
  }
}

// Usage
const agent = new MyAgent(apiKey);
const result = await agent.execute(input);
```

## Next Steps

1. Refactor remaining agents (profile-matching, content-optimization, format-validation)
2. Update workflow graph to use new agent classes
3. Add comprehensive tests for all agents
4. Document each agent's specific behavior
5. Add performance monitoring and observability
