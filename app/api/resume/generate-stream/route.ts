/**
 * Resume Generation with Progress Streaming
 * POST /api/resume/generate-stream
 * 
 * Generates a resume with real-time progress updates via Server-Sent Events (SSE)
 * Supports configurable workflows via the `workflow` parameter
 */

import { NextRequest } from 'next/server';
import { auth } from '@/lib/auth/config';
import { z } from 'zod';
import { checkRateLimit, RateLimitConfigs } from '@/lib/middleware/rate-limit-helpers';
import { logger } from '@/lib/utils/logger';
import { profileService } from '@/lib/services/profile.service';
import { resumeSchema, type Resume } from '@/lib/validations/jsonresume';
import { generateResume } from '@/lib/ai';
import { getWorkflow, createCustomWorkflow } from '@/lib/ai/workflow';
import { generatedResumeRepository } from '@/lib/repositories/generated-resume.repository';

// Request validation schema
const generateResumeSchema = z.object({
  jobDescription: z.string().min(50, 'Job description must be at least 50 characters'),
  profileId: z.string().optional(),
  templateId: z.string().optional(),
  modelId: z.string().optional(),
  /** Workflow type: 'resume', 'cover-letter', or 'full' */
  workflowType: z.enum(['resume', 'cover-letter', 'full']).optional().default('resume'),
  /** Custom workflow steps (overrides workflowType) */
  customSteps: z.array(z.string()).optional(),
});

/**
 * Resolve AI provider from user settings or environment
 */
async function resolveProvider(userId: string, modelId?: string) {
  if (modelId) {
    const { apiProviderService } = await import('@/lib/services/api-provider.service');
    const modelsResult = await apiProviderService.getAvailableModels(userId);
    if (!modelsResult.success) {
      throw new Error('No API providers configured. Please add one in Settings → API Keys');
    }

    const modelInfo = modelsResult.data.allModels.find(m => m.id === modelId);
    if (!modelInfo) {
      throw new Error(`Model ${modelId} not found in your configured providers`);
    }

    const providerResult = await apiProviderService.getProviderInstance(modelInfo.providerId, userId);
    if (!providerResult.success) {
      throw new Error(providerResult.error || 'Failed to get AI provider configuration');
    }

    return { provider: providerResult.data.provider, modelId, providerType: providerResult.data.providerType };
  }

  // Fallback to environment API key
  const apiKey = process.env.OPENAI_API_KEY || '';
  if (!apiKey) {
    throw new Error('No AI provider configured. Please add an API key in Settings or set OPENAI_API_KEY environment variable.');
  }
  const { createProvider } = await import('@/lib/ai/providers');
  return { provider: createProvider('openai', apiKey), modelId: 'gpt-4o-mini', providerType: 'openai' };
}

/**
 * POST /api/resume/generate-stream - Generate resume with progress streaming
 */
export async function POST(request: NextRequest) {
  try {
    // Apply rate limiting
    const rateLimitCheck = await checkRateLimit(request, RateLimitConfigs.resumeGeneration);
    if (rateLimitCheck.limited) {
      return rateLimitCheck.response!;
    }

    // Check authentication
    const session = await auth();
    if (!session?.user?.id) {
      return new Response(
        JSON.stringify({ error: 'Unauthorized' }),
        { status: 401, headers: { 'Content-Type': 'application/json' } }
      );
    }

    // Parse and validate request body
    const body = await request.json();
    const validation = generateResumeSchema.safeParse(body);

    if (!validation.success) {
      return new Response(
        JSON.stringify({
          error: 'Invalid request',
          details: validation.error.issues.map(e => ({
            field: e.path.join('.'),
            message: e.message
          }))
        }),
        { status: 400, headers: { 'Content-Type': 'application/json' } }
      );
    }

    const { jobDescription, profileId, templateId, modelId, workflowType, customSteps } = validation.data;
    const userId = session.user.id;

    logger.info('SSE: Resume generation started', {
      userId,
      profileId: profileId || 'default',
      workflowType,
      customSteps: customSteps?.join(', ') || 'none',
    });

    // Create a readable stream for SSE
    const encoder = new TextEncoder();
    const stream = new ReadableStream({
      async start(controller) {
        let isControllerClosed = false;

        const sendEvent = (event: string, data: unknown) => {
          if (isControllerClosed) {
            logger.warn(`SSE: Attempted to send ${event} after stream closed`);
            return;
          }
          try {
            const message = `event: ${event}\ndata: ${JSON.stringify(data)}\n\n`;
            controller.enqueue(encoder.encode(message));
          } catch (error) {
            logger.error(`SSE: Error sending ${event}`, error);
            isControllerClosed = true;
          }
        };

        const closeController = () => {
          if (!isControllerClosed) {
            isControllerClosed = true;
            controller.close();
          }
        };

        try {
          sendEvent('connected', { message: 'Connection established' });
          sendEvent('start', { message: 'Starting workflow...' });

          // Fetch and validate profile
          sendEvent('progress', { step: 'profile', message: 'Fetching profile...', progress: 5 });
          
          const profileResult = profileId
            ? await profileService.getProfileById(profileId, userId)
            : await profileService.getProfile(userId);

          if (!profileResult.success || !profileResult.data) {
            throw new Error('Profile not found. Please complete your profile before generating.');
          }

          const profileData = profileResult.data;
          if (!profileData.resume) {
            throw new Error('Profile does not contain resume data.');
          }

          const userResume = resumeSchema.parse(profileData.resume);
          sendEvent('progress', { step: 'profile', message: 'Profile loaded', progress: 10 });

          // Resolve provider
          sendEvent('progress', { step: 'provider', message: 'Configuring AI provider...', progress: 12 });
          const { provider, modelId: resolvedModelId, providerType } = await resolveProvider(userId, modelId);
          logger.info('Using AI provider', { providerType, modelId: resolvedModelId });

          // Determine workflow
          const workflow = customSteps?.length
            ? await createCustomWorkflow('Custom Workflow', 'User-defined workflow', customSteps)
            : getWorkflow(workflowType);

          sendEvent('workflow', { 
            name: workflow.name, 
            steps: workflow.steps.map(s => ({ id: s.id, name: s.name })) 
          });

          // Progress callback for workflow engine
          const onProgress = (stepId: string, message: string, progress: number) => {
            logger.debug(`SSE Progress: ${stepId} - ${message} (${progress}%)`);
            sendEvent('progress', {
              step: stepId,
              message,
              progress,
              timestamp: new Date().toISOString(),
            });
          };

          // Execute workflow
          const result = await generateResume({
            provider,
            modelId: resolvedModelId,
            jobDescription,
            userResume,
            userId,
            onProgress,
            workflow,
          });

          if (!result.success) {
            sendEvent('error', {
              error: 'Workflow failed',
              details: result.error,
            });
            closeController();
            return;
          }

          // Save to database if we have a resume
          if (result.resume) {
            sendEvent('progress', { step: 'save', message: 'Saving to database...', progress: 95 });
            
            const savedResume = await generatedResumeRepository.create({
              userId,
              jobDescription,
              jobMetadata: {
                jobTitle: result.jobTitle,
                companyName: result.companyName,
              },
              templateId: templateId ?? undefined,
              resume: result.resume,
              metadata: {
                model: resolvedModelId,
                executedSteps: result.executedSteps,
                executionTime: result.executionTime,
                generatedAt: new Date().toISOString(),
              },
            });

            sendEvent('complete', {
              success: true,
              resumeId: savedResume.id,
              resume: {
                id: savedResume.id,
                content: savedResume.resume,
                metadata: savedResume.metadata,
                createdAt: savedResume.createdAt,
              },
              jobTitle: result.jobTitle,
              companyName: result.companyName,
              executedSteps: result.executedSteps,
              executionTime: result.executionTime,
            });

            logger.info('SSE: Resume generation complete', { resumeId: savedResume.id });
          } else {
            // Workflow completed but no resume (e.g., cover letter only workflow)
            sendEvent('complete', {
              success: true,
              coverLetter: result.resume, // In this case it might be cover letter data
              jobTitle: result.jobTitle,
              companyName: result.companyName,
              executedSteps: result.executedSteps,
              executionTime: result.executionTime,
            });
          }

          closeController();
        } catch (error) {
          logger.error('SSE: Error during generation', error);
          sendEvent('error', {
            error: error instanceof Error ? error.message : 'Unknown error occurred'
          });
          closeController();
        }
      },

      cancel() {
        logger.debug('SSE: Client disconnected');
      },
    });

    return new Response(stream, {
      headers: {
        'Content-Type': 'text/event-stream',
        'Cache-Control': 'no-cache',
        'Connection': 'keep-alive',
        'X-Accel-Buffering': 'no',
      },
    });

  } catch (error) {
    logger.error('SSE: Error setting up stream', error);
    return new Response(
      JSON.stringify({
        error: error instanceof Error ? error.message : 'Failed to start generation'
      }),
      { status: 500, headers: { 'Content-Type': 'application/json' } }
    );
  }
}
