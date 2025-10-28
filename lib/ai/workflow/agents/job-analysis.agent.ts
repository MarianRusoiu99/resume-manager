/**
 * Job Analysis Agent
 * 
 * Analyzes job descriptions to extract structured information including:
 * - Required and preferred skills
 * - ATS keywords
 * - Key responsibilities
 * - Job summary
 * 
 * This agent uses OpenAI to parse unstructured job postings into
 * structured data that can be used for profile matching and content optimization.
 */

import { ChatOpenAI } from '@langchain/openai';
import { PromptTemplate } from '@langchain/core/prompts';
import { RunnableSequence } from '@langchain/core/runnables';
import { StringOutputParser } from '@langchain/core/output_parsers';
import type { ResumeGenerationState } from '../types';
import { addMessage, addError, addTokens, createSystemMessage, createAIMessage, parseAgentJSON } from '../utils';
import { retryWithBackoff, AI_RETRY_CONFIG } from '@/lib/utils/retry';

/**
 * Prompt template for job analysis
 * Instructs the AI to extract structured information from job descriptions
 */
const JOB_ANALYSIS_PROMPT = `You are an expert recruiter and ATS (Applicant Tracking System) specialist. Your task is to analyze job descriptions and extract key information that will help tailor a resume.

Analyze the following job posting and extract:
1. **Required Skills**: Must-have technical and soft skills explicitly stated
2. **Preferred Skills**: Nice-to-have skills or "bonus" qualifications
3. **ATS Keywords**: Important terms that ATS systems look for (technologies, methodologies, certifications)
4. **Key Responsibilities**: Main duties and expectations (max 5)
5. **Job Summary**: A 2-3 sentence overview of the role

Job Title: {jobTitle}
Company: {companyName}

Job Description:
{jobDescription}

Provide your analysis in the following JSON format:
\`\`\`json
{{
  "requiredSkills": ["skill1", "skill2", ...],
  "preferredSkills": ["skill1", "skill2", ...],
  "atsKeywords": ["keyword1", "keyword2", ...],
  "keyResponsibilities": ["responsibility1", "responsibility2", ...],
  "summary": "Brief summary of the role..."
}}
\`\`\`

Guidelines:
- Be specific and extract actual terms from the job description
- For requiredSkills: Look for "required", "must have", "essential"
- For preferredSkills: Look for "preferred", "nice to have", "bonus"
- For atsKeywords: Include technologies, tools, certifications, methodologies
- For keyResponsibilities: Focus on main duties and deliverables
- Keep summary concise and focused on role's core purpose
- Return ONLY the JSON object, nothing else`;

/**
 * Create a job analysis chain using LangChain
 */
function createJobAnalysisChain(apiKey: string, model: string = 'gpt-4-turbo-preview') {
  const llm = new ChatOpenAI({
    openAIApiKey: apiKey,
    modelName: model,
    temperature: 0.3, // Lower temperature for more consistent extraction
    maxTokens: 2000,
  });

  const prompt = PromptTemplate.fromTemplate(JOB_ANALYSIS_PROMPT);
  
  return RunnableSequence.from([
    prompt,
    llm,
    new StringOutputParser(),
  ]);
}

/**
 * Job Analysis Agent
 * 
 * Analyzes a job description and extracts structured information
 * 
 * @param state - Current workflow state
 * @param apiKey - OpenAI API key (from user's settings)
 * @param model - OpenAI model to use (default: gpt-4-turbo-preview)
 * @returns Updated state with job analysis results
 */
export async function analyzeJobAgent(
  state: ResumeGenerationState,
  apiKey: string,
  model?: string
): Promise<Partial<ResumeGenerationState>> {
  console.log('[analyzeJobAgent] Starting job analysis...');
  
  try {
    // Validate input
    if (!state.jobDescription || state.jobDescription.trim().length === 0) {
      const error = 'Job description is required for analysis';
      console.error('[analyzeJobAgent]', error);
      return addError(state, error);
    }

    // Create the analysis chain
    const chain = createJobAnalysisChain(apiKey, model);

    // Add system message
    let updatedState = addMessage(
      state,
      createSystemMessage('Analyzing job description to extract requirements and keywords...')
    );

    // Invoke the chain
    console.log('[analyzeJobAgent] Calling OpenAI for job analysis...');
    const startTime = Date.now();
    
    const result = await retryWithBackoff(
      () => chain.invoke({
        jobTitle: state.jobTitle || 'Not specified',
        companyName: state.companyName || 'Not specified',
        jobDescription: state.jobDescription,
      }),
      {
        ...AI_RETRY_CONFIG,
        onRetry: (error, attempt, delay) => {
          console.warn(`[analyzeJobAgent] Retry attempt ${attempt} after ${delay}ms due to: ${error.message}`);
        },
      }
    );

    const duration = Date.now() - startTime;
    console.log(`[analyzeJobAgent] Analysis completed in ${duration}ms`);

    // Parse the JSON response
    const analysis = parseAgentJSON<{
      requiredSkills: string[];
      preferredSkills: string[];
      atsKeywords: string[];
      keyResponsibilities: string[];
      summary: string;
    }>(result);

    if (!analysis) {
      const error = 'Failed to parse job analysis response';
      console.error('[analyzeJobAgent]', error);
      console.error('[analyzeJobAgent] Raw response:', result);
      return addError(state, error);
    }

    // Validate the parsed data
    if (!analysis.requiredSkills || !Array.isArray(analysis.requiredSkills)) {
      const error = 'Invalid job analysis format: missing requiredSkills array';
      console.error('[analyzeJobAgent]', error);
      return addError(state, error);
    }

    // Add AI response message
    updatedState = addMessage(
      updatedState,
      createAIMessage(`Analyzed job description and extracted ${analysis.requiredSkills.length} required skills, ${analysis.preferredSkills?.length || 0} preferred skills, and ${analysis.atsKeywords?.length || 0} ATS keywords.`)
    );

    // Estimate token usage (rough estimate: ~4 chars per token)
    const inputTokens = Math.ceil(
      (state.jobDescription.length + (state.jobTitle?.length || 0) + (state.companyName?.length || 0)) / 4
    );
    const outputTokens = Math.ceil(result.length / 4);
    updatedState = addTokens(updatedState, inputTokens + outputTokens);

    console.log('[analyzeJobAgent] Successfully extracted job analysis');
    console.log('[analyzeJobAgent] Required skills:', analysis.requiredSkills.length);
    console.log('[analyzeJobAgent] Preferred skills:', analysis.preferredSkills?.length || 0);
    console.log('[analyzeJobAgent] ATS keywords:', analysis.atsKeywords?.length || 0);

    // Return updated state with job analysis (matching ResumeGenerationState structure)
    return {
      ...updatedState,
      jobAnalysis: {
        requirements: {
          required: analysis.requiredSkills,
          preferred: analysis.preferredSkills || [],
        },
        keywords: analysis.atsKeywords || [],
        atsKeywords: analysis.atsKeywords || [],
        jobSummary: analysis.summary || '',
        keyResponsibilities: analysis.keyResponsibilities || [],
      },
    };
  } catch (error) {
    const errorMessage = `Job analysis failed: ${error instanceof Error ? error.message : 'Unknown error'}`;
    console.error('[analyzeJobAgent]', errorMessage);
    console.error('[analyzeJobAgent] Error details:', error);
    return addError(state, errorMessage);
  }
}

/**
 * Test function for the job analysis agent
 * Can be called independently for testing purposes
 */
export async function testJobAnalysisAgent(
  jobDescription: string,
  apiKey: string,
  jobTitle?: string,
  companyName?: string
): Promise<void> {
  console.log('\n🧪 Testing Job Analysis Agent\n' + '='.repeat(60));
  
  const testState: ResumeGenerationState = {
    jobDescription,
    jobTitle: jobTitle || 'Software Engineer',
    companyName: companyName || 'Test Company',
    userProfile: {
      personalInfo: {
        name: 'Test User',
        email: 'test@example.com',
        phone: '',
        location: '',
        linkedin: '',
        github: '',
        website: '',
      },
      summary: '',
      experience: [],
      education: [],
      skills: {
        technical: [],
        soft: [],
        languages: [],
      },
    },
    messages: [],
    currentStep: 'analyze_job',
    errors: [],
    tokensUsed: 0,
  };

  const result = await analyzeJobAgent(testState, apiKey);
  
  console.log('\n📊 Analysis Results:');
  console.log('='.repeat(60));
  
  if (result.jobAnalysis) {
    console.log('\n✅ Job Analysis Successful!\n');
    console.log('Required Skills:', result.jobAnalysis.requirements.required);
    console.log('Preferred Skills:', result.jobAnalysis.requirements.preferred);
    console.log('ATS Keywords:', result.jobAnalysis.atsKeywords);
    console.log('Key Responsibilities:', result.jobAnalysis.keyResponsibilities);
    console.log('Summary:', result.jobAnalysis.jobSummary);
    console.log('\nTokens Used:', result.tokensUsed);
    console.log('Messages:', result.messages?.length || 0);
  } else if (result.errors && result.errors.length > 0) {
    console.log('\n❌ Analysis Failed!\n');
    console.log('Errors:', result.errors);
  } else {
    console.log('\n⚠️ Unexpected result\n');
    console.log('Result:', result);
  }
  
  console.log('\n' + '='.repeat(60));
}
