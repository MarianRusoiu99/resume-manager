/**
 * Resume Generation Workflow Graph (Refactored)
 * 
 * Clean, modular workflow orchestration using LangGraph
 * Nodes are extracted for better testability and maintainability
 */

import { StateGraph, END, START, Annotation } from '@langchain/langgraph';
import type { ResumeGenerationState } from './types';
import { createMemoryCheckpointer } from './checkpointing';
import {
  validateInputNode,
  handleErrorNode,
  shouldContinue,
  shouldGenerateCoverLetter
} from './nodes';

/**
 * State annotation for LangGraph
 * Defines the shape of state that flows through the workflow
 */
const ResumeStateAnnotation = Annotation.Root({
  // Input data
  jobDescription: Annotation<string>(),
  jobTitle: Annotation<string | undefined>(),
  companyName: Annotation<string | undefined>(),
  userResume: Annotation<ResumeGenerationState['userResume']>(),
  personalInstructions: Annotation<string | undefined>(),
  includeCoverLetter: Annotation<boolean | undefined>(),
  
  // Agent results
  jobAnalysis: Annotation<ResumeGenerationState['jobAnalysis']>(),
  profileMatch: Annotation<ResumeGenerationState['profileMatch']>(),
  optimizedResume: Annotation<ResumeGenerationState['optimizedResume']>(),
  formatValidation: Annotation<ResumeGenerationState['formatValidation']>(),
  generatedResume: Annotation<ResumeGenerationState['generatedResume']>(),
  coverLetter: Annotation<ResumeGenerationState['coverLetter']>(),
  
  // Metadata
  messages: Annotation<ResumeGenerationState['messages']>(),
  currentStep: Annotation<string | undefined>(),
  errors: Annotation<string[]>(),
  tokensUsed: Annotation<number>()
});

/**
 * Create the workflow graph with node definitions
 * 
 * This function sets up the graph structure with nodes and edges.
 * 
 * @returns Configured StateGraph ready for compilation
 */
export function createResumeWorkflowGraph() {
  const workflow = new StateGraph(ResumeStateAnnotation);
  
  // ============================================================================
  // NODES
  // ============================================================================
  
  /**
   * Input validation node
   * Checks that all required inputs are present
   */
  workflow.addNode('validate_input', validateInputNode);
  
  /**
   * Job analysis node - will be injected with actual agent logic
   * Placeholder for dependency injection pattern
   */
  workflow.addNode('analyze_job', async () => {
    console.log('🔍 [analyze_job] Node (placeholder)');
    return { currentStep: 'analyze_job' };
  });
  
  /**
   * Profile matching node - will be injected
   */
  workflow.addNode('match_profile', async () => {
    console.log('🎯 [match_profile] Node (placeholder)');
    return { currentStep: 'match_profile' };
  });
  
  /**
   * Content optimization node - will be injected
   */
  workflow.addNode('optimize_content', async () => {
    console.log('✨ [optimize_content] Node (placeholder)');
    return { currentStep: 'optimize_content' };
  });
  
  /**
   * Format validation node - will be injected
   */
  workflow.addNode('validate_format', async () => {
    console.log('📐 [validate_format] Node (placeholder)');
    return { currentStep: 'validate_format' };
  });
  
  /**
   * Output generation node - will be injected
   */
  workflow.addNode('generate_output', async () => {
    console.log('📄 [generate_output] Node (placeholder)');
    return { currentStep: 'generate_output' };
  });
  
  /**
   * Cover letter generation node - will be injected
   */
  workflow.addNode('generate_cover_letter', async () => {
    console.log('✉️ [generate_cover_letter] Node (placeholder)');
    return { currentStep: 'generate_cover_letter' };
  });
  
  /**
   * Error handling node
   * Logs errors and sets final error state
   */
  workflow.addNode('handle_error', handleErrorNode);
  
  // ============================================================================
  // EDGES
  // ============================================================================
  
  // Start with input validation
  // Using type assertions due to LangGraph v1.0.1 type inference limitations
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  (workflow as any).addEdge(START, 'validate_input');
  
  // After validation: check for errors, route to job analysis or error handler
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  (workflow as any).addConditionalEdges(
    'validate_input',
    (state: typeof ResumeStateAnnotation.State) => {
      return shouldContinue(state as ResumeGenerationState) 
        ? 'analyze_job' 
        : 'handle_error';
    },
    ['analyze_job', 'handle_error']
  );
  
  // Sequential agent workflow
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  (workflow as any).addEdge('analyze_job', 'match_profile');
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  (workflow as any).addEdge('match_profile', 'optimize_content');
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  (workflow as any).addEdge('optimize_content', 'validate_format');
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  (workflow as any).addEdge('validate_format', 'generate_output');
  
  // After output generation: check if cover letter requested
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  (workflow as any).addConditionalEdges(
    'generate_output',
    (state: typeof ResumeStateAnnotation.State) => {
      return shouldGenerateCoverLetter(state as ResumeGenerationState)
        ? 'generate_cover_letter'
        : END;
    },
    ['generate_cover_letter', END]
  );
  
  // Terminal nodes
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  (workflow as any).addEdge('generate_cover_letter', END);
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  (workflow as any).addEdge('handle_error', END);
  
  return workflow;
}

/**
 * Compile the workflow into an executable runnable
 * 
 * @param options - Configuration options
 * @param options.withCheckpointing - Enable state persistence (default: true)
 * @returns Compiled workflow graph ready for execution
 */
export function compileResumeWorkflow(options?: {
  withCheckpointing?: boolean;
}) {
  const graph = createResumeWorkflowGraph();
  
  // Enable checkpointing by default for workflow persistence
  const enableCheckpointing = options?.withCheckpointing !== false;
  
  if (enableCheckpointing) {
    const checkpointer = createMemoryCheckpointer();
    return graph.compile({ checkpointer });
  }
  
  return graph.compile();
}

/**
 * Export state annotation for external use
 */
export { ResumeStateAnnotation };
