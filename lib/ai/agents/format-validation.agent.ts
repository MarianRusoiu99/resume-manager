import { ChatOpenAI } from '@langchain/openai';
import { PromptTemplate } from '@langchain/core/prompts';
import { RunnableSequence } from '@langchain/core/runnables';
import { StringOutputParser } from '@langchain/core/output_parsers';
import type { ResumeGenerationState } from '../workflow/types';
import { resumeSchema } from '@/lib/validations/jsonresume';
import { retryWithBackoff, AI_RETRY_CONFIG } from '@/lib/utils/retry';
import { parseAgentJSON } from '../workflow/utils';
import { estimateTokenCount } from '../config/token-limits';
import { FORMAT_VALIDATION_USER_TEMPLATE } from '../prompts/agents/format-validation';

export async function formatValidationAgent(
  state: ResumeGenerationState,
  apiKey: string,
  model?: string
): Promise<Partial<ResumeGenerationState>> {
  console.log('Starting format validation agent...');
  
  if (!state.optimizedResume) {
    throw new Error('Optimized resume is required for format validation');
  }

  const { optimizedResume } = state;

  try {
    const schemaValidation = resumeSchema.safeParse(optimizedResume);
    if (!schemaValidation.success) {
      console.error('Resume failed JSON Resume schema validation:', schemaValidation.error);
      return {
        formatValidation: {
          atsCompliant: false,
          issues: schemaValidation.error.issues.map((err) => ({
            severity: 'error' as const,
            message: `${err.path.join('.')}: ${err.message}`,
            location: err.path.join('.'),
          })),
          recommendations: ['Fix JSON Resume schema validation errors before proceeding'],
        },
      };
    }

    console.log('Resume passed JSON Resume schema validation');

    const summary = optimizedResume.basics?.summary || 'No summary provided';
    const formattedWork = (optimizedResume.work || [])
      .map((job, index) => {
        const dates = job.endDate
          ? `${job.startDate || 'N/A'} - ${job.endDate}`
          : `${job.startDate || 'N/A'} - Present`;
        
        let formatted = `\n${index + 1}. ${job.position || 'Position'} at ${job.name || 'Company'}`;
        formatted += `\n   Dates: ${dates}`;
        if (job.summary) {
          formatted += `\n   Summary: ${job.summary}`;
        }
        if (job.highlights && job.highlights.length > 0) {
          formatted += `\n   Highlights:`;
          job.highlights.forEach((highlight: string) => {
            formatted += `\n   • ${highlight}`;
          });
        }
        return formatted;
      })
      .join('\n');
    const formattedSkills = (optimizedResume.skills || []).map(s => s.name).join(', ');

    const chain = createFormatValidationChain(apiKey, model);
    
    console.log('Validating format with AI...');
    const result = await retryWithBackoff(
      () => chain.invoke({
        summary: summary,
        workExperience: formattedWork,
        skills: formattedSkills,
      }),
      {
        ...AI_RETRY_CONFIG,
        onRetry: (error, attempt, delay) => {
          console.warn(`Retry attempt ${attempt} after ${delay}ms due to: ${error.message}`);
        },
      }
    );

    const validation = parseAgentJSON<{
      atsCompliant: boolean;
      issues: Array<{
        severity: 'error' | 'warning' | 'info';
        message: string;
        location?: string;
      }>;
      recommendations: string[];
    }>(result);

    if (!validation) {
      throw new Error('Failed to parse format validation response from AI');
    }

    type Issue = { severity: 'error' | 'warning' | 'info'; message: string; location?: string };
    const errorCount = validation.issues.filter((i: Issue) => i.severity === 'error').length;
    const warningCount = validation.issues.filter((i: Issue) => i.severity === 'warning').length;
    const infoCount = validation.issues.filter((i: Issue) => i.severity === 'info').length;

    console.log('Format validation complete');
    console.log(`- ATS Compliant: ${validation.atsCompliant ? 'YES' : 'NO'}`);
    console.log(`- Issues: ${errorCount} errors, ${warningCount} warnings, ${infoCount} info`);
    console.log(`- Recommendations: ${validation.recommendations.length}`);

    return {
      formatValidation: {
        atsCompliant: validation.atsCompliant,
        issues: validation.issues,
        recommendations: validation.recommendations,
      },
      currentStep: 'validate_format',
      tokensUsed: estimateTokenCount(result),
    };
  } catch (error) {
    console.error('Error in format validation agent:', error);
    return {
      errors: [
        `Format validation failed: ${error instanceof Error ? error.message : 'Unknown error'}`,
      ],
    };
  }
}

function createFormatValidationChain(
  apiKey: string,
  model: string = 'gpt-4-turbo-preview'
) {
  const prompt = PromptTemplate.fromTemplate(FORMAT_VALIDATION_USER_TEMPLATE);

  const llm = new ChatOpenAI({
    openAIApiKey: apiKey,
    modelName: model || 'gpt-4-turbo-preview',
    temperature: 0.2,
    maxTokens: 2000,
  });

  return RunnableSequence.from([
    prompt,
    llm,
    new StringOutputParser(),
  ]);
}

export async function testFormatValidationAgent() {
  console.log('Format validation agent test - stub implementation');
}
