import { StateGraph, END, START, Annotation } from '@langchain/langgraph';
import { ResumeGenerationState } from './types';
import { setCurrentStep, addError, logState } from './utils';
import { createMemoryCheckpointer } from './checkpointing';

// Define the state annotation for LangGraph
const ResumeStateAnnotation = Annotation.Root({
  jobDescription: Annotation<string>(),
  jobTitle: Annotation<string | undefined>(),
  companyName: Annotation<string | undefined>(),
  userResume: Annotation<ResumeGenerationState['userResume']>(),
  personalInstructions: Annotation<string | undefined>(),
  includeCoverLetter: Annotation<boolean | undefined>(),
  jobAnalysis: Annotation<ResumeGenerationState['jobAnalysis']>(),
  profileMatch: Annotation<ResumeGenerationState['profileMatch']>(),
  optimizedResume: Annotation<ResumeGenerationState['optimizedResume']>(),
  formatValidation: Annotation<ResumeGenerationState['formatValidation']>(),
  generatedResume: Annotation<ResumeGenerationState['generatedResume']>(),
  coverLetter: Annotation<ResumeGenerationState['coverLetter']>(),
  messages: Annotation<ResumeGenerationState['messages']>(),
  currentStep: Annotation<string | undefined>(),
  errors: Annotation<string[]>(),
  tokensUsed: Annotation<number>()
});

/**
 * Create the base StateGraph for resume generation
 * This sets up the workflow structure that agents will populate
 */
export function createResumeWorkflowGraph() {
  // Create the graph with our state annotation
  const workflow = new StateGraph(ResumeStateAnnotation);

  // Placeholder nodes - will be implemented in subsequent phases
  
  /**
   * Entry point - validate input
   */
  workflow.addNode('validate_input', async (state: ResumeGenerationState) => {
    console.log('📋 Validating input...');
    
    try {
      // Check for required fields
      if (!state.jobDescription || state.jobDescription.trim().length === 0) {
        return addError(
          setCurrentStep(state, 'validate_input'),
          'Job description is required'
        );
      }

      if (!state.userResume) {
        return addError(
          setCurrentStep(state, 'validate_input'),
          'User resume is required'
        );
      }

      console.log('✅ Input validation passed');
      return setCurrentStep(state, 'validate_input');
    } catch (error) {
      console.error('❌ Input validation failed:', error);
      return addError(
        setCurrentStep(state, 'validate_input'),
        `Validation error: ${error instanceof Error ? error.message : 'Unknown error'}`
      );
    }
  });

  /**
   * Job analysis node placeholder
   */
  workflow.addNode('analyze_job', async (state: ResumeGenerationState) => {
    console.log('🔍 Analyzing job description...');
    // Will be implemented in Phase 4.2
    return setCurrentStep(state, 'analyze_job');
  });

  /**
   * Profile matching node placeholder
   */
  workflow.addNode('match_profile', async (state: ResumeGenerationState) => {
    console.log('🎯 Matching profile to job...');
    // Will be implemented in Phase 4.3
    return setCurrentStep(state, 'match_profile');
  });

  /**
   * Content optimization node placeholder
   */
  workflow.addNode('optimize_content', async (state: ResumeGenerationState) => {
    console.log('✨ Optimizing content...');
    // Will be implemented in Phase 4.4
    return setCurrentStep(state, 'optimize_content');
  });

  /**
   * Format validation node placeholder
   */
  workflow.addNode('validate_format', async (state: ResumeGenerationState) => {
    console.log('📐 Validating format...');
    // Will be implemented in Phase 4.5
    return setCurrentStep(state, 'validate_format');
  });

  /**
   * Output generation node placeholder
   */
  workflow.addNode('generate_output', async (state: ResumeGenerationState) => {
    console.log('📄 Generating final output...');
    // Will be implemented in Phase 4.6
    return setCurrentStep(state, 'generate_output');
  });

  /**
   * Cover letter generation node (conditional)
   */
  workflow.addNode('generate_cover_letter', async (state: ResumeGenerationState) => {
    console.log('✉️ Generating cover letter...');
    // Will be implemented in Phase 7.2
    return setCurrentStep(state, 'generate_cover_letter');
  });

  /**
   * Error handling node
   */
  workflow.addNode('handle_error', async (state: ResumeGenerationState) => {
    console.error('❌ Workflow error encountered:', state.errors);
    logState(state, '  ');
    return setCurrentStep(state, 'error');
  });

  // Define the workflow edges
  // Note: Using type assertions to work around LangGraph v1.0.1 type inference issues
  // The StateGraph type system doesn't properly infer node names from addNode calls
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  (workflow as any).addEdge(START, 'validate_input');

  // Conditional edge: if validation fails, go to error handler
  // Third parameter explicitly lists possible destinations for graph visualization
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  (workflow as any).addConditionalEdges('validate_input', (state: typeof ResumeStateAnnotation.State) => {
    if (state.errors && state.errors.length > 0) {
      return 'handle_error';
    }
    return 'analyze_job';
  }, ['handle_error', 'analyze_job']);

  // Sequential agent workflow
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  (workflow as any).addEdge('analyze_job', 'match_profile');
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  (workflow as any).addEdge('match_profile', 'optimize_content');
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  (workflow as any).addEdge('optimize_content', 'validate_format');
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  (workflow as any).addEdge('validate_format', 'generate_output');
  
  // Conditional edge: generate cover letter if requested
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  (workflow as any).addConditionalEdges('generate_output', (state: typeof ResumeStateAnnotation.State) => {
    // Check if cover letter was requested
    if (state.includeCoverLetter === true) {
      return 'generate_cover_letter';
    }
    return END;
  }, [END, 'generate_cover_letter']);
  
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  (workflow as any).addEdge('generate_cover_letter', END);
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  (workflow as any).addEdge('handle_error', END);

  return workflow;
}

/**
 * Compile the workflow into an executable runnable
 * 
 * @param options - Optional configuration
 * @param options.withCheckpointing - Enable checkpointing for workflow persistence (default: true)
 * @returns Compiled workflow graph
 */
export function compileResumeWorkflow(options?: { withCheckpointing?: boolean }) {
  const graph = createResumeWorkflowGraph();
  
  // Enable checkpointing by default
  const enableCheckpointing = options?.withCheckpointing !== false;
  
  if (enableCheckpointing) {
    // Compile with memory-based checkpointing
    // This allows workflow state to be persisted and resumed
    const checkpointer = createMemoryCheckpointer();
    return graph.compile({ checkpointer });
  }
  
  // Compile without checkpointing (stateless execution)
  return graph.compile();
}

/**
 * Test the workflow with empty agents (for validation)
 */
export async function testEmptyWorkflow(state: ResumeGenerationState): Promise<typeof ResumeStateAnnotation.State> {
  console.log('🧪 Testing workflow with empty agents...');
  
  const workflow = compileResumeWorkflow();
  
  try {
    const result = await workflow.invoke(state);
    console.log('✅ Workflow test completed');
    if (result) {
      logState(result as unknown as ResumeGenerationState, '  ');
    }
    return result;
  } catch (error) {
    console.error('❌ Workflow test failed:', error);
    throw error;
  }
}
