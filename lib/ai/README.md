# AI Module - Resume Optimizer

Clean, modular AI system for resume generation and optimization.

## 🎯 Quick Start

```typescript
import { getModelConfig } from '@/lib/ai/config';
import { JOB_ANALYSIS_SYSTEM_PROMPT, formatJobAnalysisPrompt } from '@/lib/ai/prompts';
import { createSystemMessage, robustParseJSON, addTokens } from '@/lib/ai/utils';

// Get agent configuration
const config = getModelConfig('job-analysis');

// Format prompts
const systemMsg = createSystemMessage(JOB_ANALYSIS_SYSTEM_PROMPT);
const userPrompt = formatJobAnalysisPrompt({
  jobTitle: 'Software Engineer',
  companyName: 'TechCorp',
  jobDescription: '...'
});

// Parse AI response
const result = robustParseJSON(aiResponse);
```

## 📁 Structure

```
lib/ai/
├── config/          # Centralized configuration
├── prompts/         # Organized prompt templates
├── utils/           # Domain-specific utilities
├── providers/       # AI provider abstractions
└── workflow/        # LangGraph orchestration
```

## 📖 Documentation

- **[Refactoring Guide](./REFACTORING-GUIDE.md)** - Complete architecture overview
- **[Configuration](./config/README.md)** - Model and retry settings
- **[Prompts](./prompts/README.md)** - Prompt management guide
- **[Utils](./utils/README.md)** - Utility functions reference

## 🏗️ Architecture Principles

### SOLID Design
- **Single Responsibility**: Each module has one clear purpose
- **Open/Closed**: Easy to extend without modifying existing code
- **Dependency Inversion**: Depend on abstractions, not implementations

### Key Features
✅ **Centralized Configuration** - No magic numbers  
✅ **Modular Prompts** - Easy to find and modify  
✅ **Clean Utilities** - Organized by domain  
✅ **Type-Safe** - Full TypeScript support  
✅ **Testable** - Mocks and dependency injection  

## 🧩 Core Modules

### Configuration (`config/`)
Centralized settings for models, retries, and token budgets.

```typescript
import { getModelConfig, TOKEN_BUDGETS } from '@/lib/ai/config';

const config = getModelConfig('content-optimization');
// { name: 'gpt-4-turbo-preview', temperature: 0.7, maxTokens: 4000 }
```

### Prompts (`prompts/`)
Organized prompt templates with type-safe formatting.

```typescript
import { formatJobAnalysisPrompt } from '@/lib/ai/prompts';

const prompt = formatJobAnalysisPrompt({
  jobTitle: 'Senior Developer',
  companyName: 'Acme Inc',
  jobDescription: '...'
});
```

### Utils (`utils/`)
Domain-specific utilities for common operations.

```typescript
import { 
  createSystemMessage,
  robustParseJSON,
  addTokens,
  TokenTracker 
} from '@/lib/ai/utils';

// Create messages
const msg = createSystemMessage('You are an expert...');

// Parse responses
const data = robustParseJSON<MyType>(aiResponse);

// Track tokens
const tracker = new TokenTracker();
tracker.addInput(1000);
tracker.addOutput(500);
```

## 🔧 Common Tasks

### Add a New Agent

1. Create prompts in `prompts/agents/my-agent/`
2. Add config to `config/models.ts`
3. Implement agent logic using utilities
4. Export from appropriate index files

### Modify Existing Prompts

Edit the prompt file directly - no need to dig through agent code:

```typescript
// lib/ai/prompts/agents/job-analysis/system-prompt.ts
export const JOB_ANALYSIS_SYSTEM_PROMPT = `
  Your modified prompt here...
`;
```

### Adjust Configuration

```typescript
// lib/ai/config/models.ts
export const MODEL_CONFIGS = {
  MY_AGENT: {
    temperature: 0.8,  // Adjust here
    maxTokens: 3000
  }
};
```

## 🧪 Testing

The modular structure makes testing easy:

```typescript
// Test prompt formatting
test('formats prompt correctly', () => {
  const prompt = formatJobAnalysisPrompt({ ... });
  expect(prompt).toContain('expected text');
});

// Test parsing
test('parses AI response', () => {
  const result = robustParseJSON(mockResponse);
  expect(result).toEqual(expectedOutput);
});

// Test state management
test('adds tokens to state', () => {
  const updated = addTokens(state, 100);
  expect(updated.tokensUsed).toBe(state.tokensUsed + 100);
});
```

## 📊 Benefits

| Aspect | Improvement |
|--------|-------------|
| Code organization | ⭐⭐⭐⭐⭐ |
| Maintainability | ⭐⭐⭐⭐⭐ |
| Testability | ⭐⭐⭐⭐⭐ |
| Reusability | ⭐⭐⭐⭐⭐ |
| Developer experience | ⭐⭐⭐⭐⭐ |

## 🤝 Contributing

When adding new AI functionality:

1. Add configuration to `config/`
2. Create prompts in `prompts/`
3. Use existing utilities from `utils/`
4. Follow existing patterns
5. Add tests
6. Update documentation

## 📝 License

MIT - See LICENSE file for details
