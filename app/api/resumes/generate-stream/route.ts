/**
 * Resume Generation with Progress Streaming
 * POST /api/resumes/generate-stream
 * 
 * Generates a resume with real-time progress updates via Server-Sent Events (SSE)
 */

import { NextRequest } from 'next/server';
import { auth } from '@/lib/auth/config';
import { resumeService } from '@/lib/services/resume.service';
import { z } from 'zod';
import { checkRateLimit, RateLimitConfigs } from '@/lib/middleware/rate-limit-helpers';

// Request validation schema
const generateResumeSchema = z.object({
  jobDescription: z.string().min(50, 'Job description must be at least 50 characters'),
  templateId: z.string().optional(),
  generateCoverLetter: z.boolean().optional(),
  personalInstructions: z.string().optional(),
});

/**
 * POST /api/resumes/generate-stream - Generate resume with progress streaming
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

    const { jobDescription, templateId, generateCoverLetter, personalInstructions } = validation.data;

    console.log(`\n📡 SSE: Resume generation with streaming for user ${session.user.id}`);
    console.log(`   Cover letter: ${generateCoverLetter ? 'Yes' : 'No'}`);

    // Create a readable stream for SSE
    const encoder = new TextEncoder();
    const stream = new ReadableStream({
      async start(controller) {
        // Track controller state to prevent "already closed" errors
        let isControllerClosed = false;

        // Helper function to send SSE messages (only if controller is open)
        const sendEvent = (event: string, data: unknown) => {
          if (isControllerClosed) {
            console.warn(`📡 SSE: Attempted to send ${event} after stream closed`);
            return;
          }
          try {
            const message = `event: ${event}\ndata: ${JSON.stringify(data)}\n\n`;
            controller.enqueue(encoder.encode(message));
          } catch (error) {
            console.error(`📡 SSE: Error sending ${event}:`, error);
            isControllerClosed = true;
          }
        };

        // Helper to safely close controller
        const closeController = () => {
          if (!isControllerClosed) {
            isControllerClosed = true;
            controller.close();
          }
        };

        try {
          // Send initial connection event
          sendEvent('connected', { message: 'Connection established' });

          // Progress callback function
          const onProgress = (step: string, message: string, progress: number) => {
            console.log(`📡 SSE Progress: ${step} - ${message} (${progress}%)`);
            sendEvent('progress', {
              step,
              message,
              progress,
              timestamp: new Date().toISOString(),
            });
          };

          // Start generation
          sendEvent('start', { message: 'Starting resume generation...' });

          // Call resume service with progress callback (job title and company extracted from description)
          const result = await resumeService.generateResumeWithProgress({
            userId: session.user.id,
            jobDescription,
            templateId,
            generateCoverLetter,
            personalInstructions,
            onProgress,
          });

          if (!result.success) {
            sendEvent('error', {
              error: 'Resume generation failed',
              details: result.errors,
            });
            closeController();
            return;
          }

          // Send completion event
          sendEvent('complete', {
            success: true,
            resumeId: result.resumeId,
            resume: result.resume,
            coverLetter: result.coverLetter,
          });

          console.log(`✅ SSE: Resume generation complete (ID: ${result.resumeId})`);

          // Close the stream
          closeController();
        } catch (error) {
          console.error('❌ SSE: Error during generation:', error);
          sendEvent('error', {
            error: error instanceof Error ? error.message : 'Unknown error occurred'
          });
          closeController();
        }
      },

      cancel() {
        console.log('📡 SSE: Client disconnected');
      },
    });

    // Return SSE response with proper headers
    return new Response(stream, {
      headers: {
        'Content-Type': 'text/event-stream',
        'Cache-Control': 'no-cache',
        'Connection': 'keep-alive',
        'X-Accel-Buffering': 'no', // Disable buffering for nginx
      },
    });

  } catch (error) {
    console.error('❌ SSE: Error setting up stream:', error);
    return new Response(
      JSON.stringify({
        error: error instanceof Error ? error.message : 'Failed to start generation'
      }),
      { status: 500, headers: { 'Content-Type': 'application/json' } }
    );
  }
}
