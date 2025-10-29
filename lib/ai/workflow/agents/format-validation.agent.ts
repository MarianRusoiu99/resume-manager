/**
 * Format Validation Agent
 * 
 * This agent validates resume formatting for ATS compliance and readability.
 * Checks for common parsing issues, formatting inconsistencies, and provides
 * actionable recommendations.
 */

import { ChatOpenAI } from '@langchain/openai';
import { PromptTemplate } from '@langchain/core/prompts';
import { RunnableSequence } from '@langchain/core/runnables';
import { StringOutputParser } from '@langchain/core/output_parsers';
import type { ResumeGenerationState } from '../types';
import { retryWithBackoff, AI_RETRY_CONFIG } from '@/lib/utils/retry';
import { parseAgentJSON } from '../utils';

/**
 * Format Validation Agent
 * 
 * Validates optimized content for ATS compliance and formatting issues.
 * 
 * @param state - Current workflow state with optimizedContent
 * @param apiKey - OpenAI API key (from user's settings)
 * @param model - OpenAI model to use (default: gpt-4-turbo-preview)
 * @returns Updated state with formatValidation results
 */
export async function formatValidationAgent(
  state: ResumeGenerationState,
  apiKey: string,
  model?: string
): Promise<Partial<ResumeGenerationState>> {
  console.log('✅ Starting format validation agent...');

  // Validate prerequisites
  if (!state.optimizedContent) {
    throw new Error('Optimized content is required for format validation');
  }

  const { optimizedContent, jobTitle, companyName } = state;

  try {
    // Create the validation chain
    const chain = createFormatValidationChain(
      apiKey,
      model,
      optimizedContent
    );

    // Execute the chain
    console.log('Validating format with AI...');
    const result = await retryWithBackoff(
      () => chain.invoke({
        jobTitle: jobTitle || 'the position',
        companyName: companyName || 'the company',
      }),
      {
        ...AI_RETRY_CONFIG,
        onRetry: (error, attempt, delay) => {
          console.warn(`[formatValidationAgent] Retry attempt ${attempt} after ${delay}ms due to: ${error.message}`);
        },
      }
    );

    // Parse the JSON response - handles both markdown-wrapped and plain JSON
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

    // Count issues by severity
    type Issue = { severity: 'error' | 'warning' | 'info'; message: string; location?: string };
    const errorCount = validation.issues.filter((i: Issue) => i.severity === 'error').length;
    const warningCount = validation.issues.filter((i: Issue) => i.severity === 'warning').length;
    const infoCount = validation.issues.filter((i: Issue) => i.severity === 'info').length;

    console.log('✅ Format validation complete');
    console.log(`- ATS Compliant: ${validation.atsCompliant ? 'YES' : 'NO'}`);
    console.log(`- Issues: ${errorCount} errors, ${warningCount} warnings, ${infoCount} info`);
    console.log(`- Recommendations: ${validation.recommendations.length}`);

    return {
      ...state,
      formatValidation: {
        atsCompliant: validation.atsCompliant,
        issues: validation.issues,
        recommendations: validation.recommendations,
      },
      currentStep: 'validate_format',
      tokensUsed: (state.tokensUsed || 0) + estimateTokens(result),
    };
  } catch (error) {
    console.error('Error in format validation agent:', error);
    return {
      ...state,
      errors: [
        ...(state.errors || []),
        `Format validation failed: ${error instanceof Error ? error.message : 'Unknown error'}`,
      ],
    };
  }
}

/**
 * Create the LangChain chain for format validation
 */
function createFormatValidationChain(
  apiKey: string,
  model: string = 'gpt-4-turbo-preview',
  optimizedContent: NonNullable<ResumeGenerationState['optimizedContent']>
) {
  // Format the content for validation
  const formattedExperience = optimizedContent.experience
    .map((exp, index) => {
      const dates = exp.current
        ? `${exp.startDate} - Present`
        : `${exp.startDate} - ${exp.endDate || 'Present'}`;
      
      let formatted = `\n${index + 1}. ${exp.title} at ${exp.company}`;
      formatted += `\n   Dates: ${dates}`;
      formatted += `\n   Description: ${exp.description}`;
      formatted += `\n   Bullet Points:`;
      exp.bulletPoints.forEach(bullet => {
        formatted += `\n   • ${bullet}`;
      });
      return formatted;
    })
    .join('\n');

  const formattedSkills = optimizedContent.prioritizedSkills.join(', ');

  const prompt = PromptTemplate.fromTemplate(`You are an ATS (Applicant Tracking System) expert and resume formatting specialist. Your task is to validate resume formatting for optimal ATS parsing and readability.

JOB CONTEXT:
Title: {jobTitle}
Company: {companyName}

RESUME CONTENT TO VALIDATE:

PROFESSIONAL SUMMARY:
${optimizedContent.summary}

WORK EXPERIENCE:
${formattedExperience}

SKILLS:
${formattedSkills}

YOUR TASK:
Analyze the resume content for ATS compliance and formatting issues. Check for:

1. **ATS COMPLIANCE CHECKS**:
   - Date format consistency (should be "Month YYYY - Month YYYY" or "MM/YYYY - MM/YYYY")
   - No special characters that confuse ATS (✓, →, |, fancy bullets)
   - No tables, columns, or complex layouts in text
   - Standard section headers
   - Phone numbers and emails in standard format
   - Consistent formatting throughout

2. **BULLET POINT VALIDATION**:
   - Each bullet starts with strong action verb
   - Bullets are concise (ideally 1-2 lines, max 3 lines)
   - Consistent punctuation (all end with period or none do)
   - No overly long bullets (>150 characters)
   - Quantifiable metrics included when possible

3. **DATE VALIDATION**:
   - Date ranges present for all experiences
   - Consistent date format across all entries
   - No overlapping employment dates (unless part-time)
   - "Present" used consistently for current role
   - Chronological order (most recent first)

4. **READABILITY & STRUCTURE**:
   - Clear, professional language
   - No jargon or acronyms without context
   - Appropriate use of technical terms
   - Logical flow and organization
   - No grammatical errors or typos

5. **COMMON ATS PARSING ISSUES**:
   - Skills listed as comma-separated text (not tables)
   - No merged words or unusual spacing
   - Standard job titles and company names
   - Contact info in plain text format
   - No images, charts, or graphics in text sections

OUTPUT FORMAT:
Return ONLY valid JSON with this exact structure:
{{
  "atsCompliant": boolean,
  "issues": [
    {{
      "severity": "error" | "warning" | "info",
      "message": "Clear description of the issue",
      "location": "section name (e.g., 'Experience - Job Title', 'Summary', 'Skills')"
    }}
  ],
  "recommendations": [
    "Specific actionable recommendation to improve ATS compliance or readability"
  ]
}}

SEVERITY GUIDELINES:
- **error**: Critical issues that will likely cause ATS parsing failures
- **warning**: Issues that may reduce ATS effectiveness or readability
- **info**: Suggestions for improvement (nice-to-have)

IMPORTANT:
- Be thorough but focus on issues that actually exist
- Provide specific, actionable recommendations
- If content is ATS-compliant, set atsCompliant to true
- Include at least 3-5 recommendations even if no major issues found
- Focus on improvements that maintain authenticity

Analyze the resume content now:`);

  const llm = new ChatOpenAI({
    openAIApiKey: apiKey,
    modelName: model || 'gpt-4-turbo-preview',
    temperature: 0.2, // Low temperature for consistent validation
    maxTokens: 2000,
  });

  return RunnableSequence.from([
    prompt,
    llm,
    new StringOutputParser(),
  ]);
}

/**
 * Estimate token count for tracking
 */
function estimateTokens(text: string): number {
  // Rough estimate: ~4 characters per token
  return Math.ceil(text.length / 4);
}

/**
 * Test function for standalone format validation testing
 */
export async function testFormatValidationAgent(
  apiKey: string,
  model: string = 'gpt-4-turbo-preview'
) {
  console.log('Testing Format Validation Agent\n');
  console.log('='.repeat(50));

  // Import dependencies for testing
  const { analyzeJobAgent } = await import('./job-analysis.agent');
  const { profileMatchingAgent } = await import('./profile-matching.agent');
  const { contentOptimizationAgent } = await import('./content-optimization.agent');
  const { createMockUserProfile, createMockJobDescription } = await import('../testing');

  // Create mock data
  const mockProfile = createMockUserProfile();
  const mockJob = createMockJobDescription();

  // Initial state
  let state: ResumeGenerationState = {
    jobDescription: mockJob,
    jobTitle: 'Senior Software Engineer',
    companyName: 'Tech Corp',
    userProfile: mockProfile,
    currentStep: 'validate_input',
    messages: [],
    errors: [],
    tokensUsed: 0,
  };

  console.log('\nStep 1: Analyzing job description...');
  const jobResult = await analyzeJobAgent(state, apiKey, model);
  state = { ...state, ...jobResult };

  if (!state.jobAnalysis) {
    throw new Error('Job analysis failed');
  }

  console.log('\nStep 2: Matching profile to job...');
  const matchResult = await profileMatchingAgent(state, apiKey, model);
  state = { ...state, ...matchResult };

  if (!state.profileMatch) {
    throw new Error('Profile matching failed');
  }

  console.log('\nStep 3: Optimizing content...');
  const optimizeResult = await contentOptimizationAgent(state, apiKey, model);
  state = { ...state, ...optimizeResult };

  if (!state.optimizedContent) {
    throw new Error('Content optimization failed');
  }

  console.log('\nStep 4: Validating format...');
  const validateResult = await formatValidationAgent(state, apiKey, model);
  state = { ...state, ...validateResult };

  if (!state.formatValidation) {
    throw new Error('Format validation failed');
  }

  // Display results
  console.log('\n' + '='.repeat(50));
  console.log('FORMAT VALIDATION RESULTS');
  console.log('='.repeat(50));

  console.log(`\n✅ ATS Compliant: ${state.formatValidation.atsCompliant ? 'YES' : 'NO'}`);

  if (state.formatValidation.issues.length > 0) {
    console.log(`\n⚠️  ISSUES FOUND (${state.formatValidation.issues.length}):`);
    
    const errors = state.formatValidation.issues.filter(i => i.severity === 'error');
    const warnings = state.formatValidation.issues.filter(i => i.severity === 'warning');
    const info = state.formatValidation.issues.filter(i => i.severity === 'info');

    if (errors.length > 0) {
      console.log(`\n🔴 ERRORS (${errors.length}):`);
      errors.forEach((issue, index) => {
        console.log(`${index + 1}. [${issue.location || 'General'}] ${issue.message}`);
      });
    }

    if (warnings.length > 0) {
      console.log(`\n🟡 WARNINGS (${warnings.length}):`);
      warnings.forEach((issue, index) => {
        console.log(`${index + 1}. [${issue.location || 'General'}] ${issue.message}`);
      });
    }

    if (info.length > 0) {
      console.log(`\n🔵 INFO (${info.length}):`);
      info.forEach((issue, index) => {
        console.log(`${index + 1}. [${issue.location || 'General'}] ${issue.message}`);
      });
    }
  } else {
    console.log('\n✅ No formatting issues found!');
  }

  console.log(`\n💡 RECOMMENDATIONS (${state.formatValidation.recommendations.length}):`);
  state.formatValidation.recommendations.forEach((rec, index) => {
    console.log(`${index + 1}. ${rec}`);
  });

  console.log('\n📊 TOKEN USAGE:');
  console.log(`Total tokens used: ${state.tokensUsed || 0}`);

  console.log('\n✅ Format validation test complete!');

  return state;
}
