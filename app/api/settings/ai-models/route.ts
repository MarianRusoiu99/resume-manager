/**
 * AI Settings API Endpoint
 * GET /api/settings/ai-models - Get all AI model preferences
 * PATCH /api/settings/ai-models - Update a feature's model preference
 */

import { NextResponse } from 'next/server';
import { createApiHandler } from '@/lib/api-handler';
import { userAISettingsService } from '@/lib/services/user-ai-settings.service';
import { updateAIPreferenceSchema } from '@/lib/validations/settings';

/**
 * @swagger
 * /api/settings/ai-models:
 *   get:
 *     summary: Get AI model settings
 *     description: Retrieve user's AI model preferences for all features
 *     tags:
 *       - Settings
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: AI settings retrieved successfully
 *       401:
 *         description: Unauthorized
 */
export const GET = createApiHandler(
  async (request, context, session) => {
    const result = await userAISettingsService.getSettings(session.user.id);

    if (!result.success) {
      return NextResponse.json({ error: result.error }, { status: 500 });
    }

    return NextResponse.json(result.data);
  },
  { rateLimit: 'apiKeys' }
);

/**
 * @swagger
 * /api/settings/ai-models:
 *   patch:
 *     summary: Update AI model preference
 *     description: Update the preferred AI model for a specific feature
 *     tags:
 *       - Settings
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - feature
 *             properties:
 *               feature:
 *                 type: string
 *                 enum: [resume, coverLetter, enhance, template]
 *               providerId:
 *                 type: string
 *                 nullable: true
 *               modelId:
 *                 type: string
 *                 nullable: true
 *     responses:
 *       200:
 *         description: Preference updated successfully
 *       400:
 *         description: Invalid request
 *       401:
 *         description: Unauthorized
 */
export const PATCH = createApiHandler(
  async (request, context, session, body) => {
    const result = await userAISettingsService.updateFeaturePreference({
      userId: session.user.id,
      feature: body!.feature,
      providerId: body!.providerId,
      modelId: body!.modelId,
    });

    if (!result.success) {
      const status = result.code === 'NOT_FOUND' ? 404 : 400;
      return NextResponse.json({ error: result.error }, { status });
    }

    return NextResponse.json(result.data);
  },
  { bodySchema: updateAIPreferenceSchema, rateLimit: 'apiKeys' }
);
