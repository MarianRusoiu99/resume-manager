/**
 * AI Settings API Endpoint
 * GET /api/v1/settings/ai-models - Get all AI model preferences
 * PATCH /api/v1/settings/ai-models - Update a feature's model preference
 */

import { createApiHandler } from '@/lib/api-handler';
import { userAISettingsService } from '@/lib/services/user-ai-settings.service';
import { updateAIPreferenceSchema } from '@/lib/validations/settings';

/**
 * @swagger
 * /api/v1/settings/ai-models:
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
    return userAISettingsService.getSettings(session.user.id);
  },
  { rateLimit: 'apiKeys' }
);

/**
 * @swagger
 * /api/v1/settings/ai-models:
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
  async (_request, _context, session, body) => {
    return userAISettingsService.updateFeaturePreference({
      userId: session.user.id,
      feature: body!.feature,
      providerId: body!.providerId,
      modelId: body!.modelId,
    });
  },
  { bodySchema: updateAIPreferenceSchema, rateLimit: 'apiKeys' }
);
