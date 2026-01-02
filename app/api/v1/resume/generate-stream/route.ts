/**
 * Resume Generation with Progress Streaming
 * POST /api/resume/generate-stream
 */

import { z } from 'zod';
import { createApiHandler } from '@/lib/api/handler';
import { generateResumeSchema } from '@/lib/validations/api-schemas';
import { logger } from '@/lib/utils/logger';
import { resumeService, profileService, notificationService } from '@/lib/services';
import { resumeSchema } from '@/lib/validations/jsonresume';
import { generateResume } from '@/lib/ai';
import { getWorkflow, createCustomWorkflow } from '@/lib/ai/workflow';
import { resolveAIModelOrThrow } from '@/lib/ai/runtime';
import { generatedResumeRepository } from '@/lib/repositories/generated-resumes.repository';

const generateResumeStreamSchema = generateResumeSchema.extend({
  workflowType: z.enum(['resume', 'cover-letter', 'full']).optional().default('resume'),
  customSteps: z.array(z.string()).optional(),
});

export const POST = createApiHandler(
  async (request, context, session, body, meta) => {
    const { jobDescription, profileId, templateId, modelId, workflowType, customSteps } = body!;
    const userId = session.user.id;
    const requestId = meta.requestId;

    logger.info('SSE: Resume generation started', {
      userId,
      profileId: profileId || 'default',
      workflowType,
    });

    const encoder = new TextEncoder();
    const stream = new ReadableStream({
      async start(controller) {
        let isControllerClosed = false;

        const sendEvent = (event: string, data: unknown) => {
          if (isControllerClosed) return;
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
          sendEvent('connected', { message: 'Connection established', requestId });
          sendEvent('start', { message: 'Starting workflow...' });

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

          sendEvent('progress', { step: 'provider', message: 'Configuring AI provider...', progress: 12 });
          const resolvedModel = await resolveAIModelOrThrow({ userId, feature: 'resume', modelId });

          const workflow = customSteps?.length
            ? await createCustomWorkflow('Custom Workflow', 'User-defined workflow', customSteps)
            : getWorkflow(workflowType);

          sendEvent('workflow', { 
            name: workflow.name, 
            steps: workflow.steps.map(s => ({ id: s.id, name: s.name })) 
          });

          const onProgress = (stepId: string, message: string, progress: number) => {
            sendEvent('progress', {
              step: stepId,
              message,
              progress,
              timestamp: new Date().toISOString(),
            });
          };

          const result = await generateResume({
            provider: resolvedModel.provider,
            modelKey: resolvedModel.modelKey,
            jobDescription,
            userResume,
            userId,
            onProgress,
            workflow,
          });

          if (!result.success) {
            sendEvent('error', { error: 'Workflow failed', details: result.error, requestId });
            closeController();
            return;
          }

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
                model: resolvedModel.modelKey,
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

            await notificationService.notifyResumeGenerated(
              userId,
              savedResume.id,
              result.jobTitle,
              result.companyName
            );
          } else {
            sendEvent('complete', {
              success: true,
              coverLetter: result.resume,
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
            error: error instanceof Error ? error.message : 'Unknown error occurred',
            requestId,
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
  },
  {
    verifyUser: true,
    rateLimit: 'resumeGeneration',
    bodySchema: generateResumeStreamSchema,
  }
);
