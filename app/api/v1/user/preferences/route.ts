import { NextResponse } from 'next/server';
import { prisma } from '@/lib/db';
import { logger } from '@/lib/utils/logger';
import { createApiHandler } from '@/lib/api/handler';

/**
 * GET /api/v1/user/preferences
 * Retrieve all user preferences (AI models per feature, selected templates, etc.)
 */
export const GET = createApiHandler(async (req, ctx, session) => {
  try {
    const userId = session.user.id;

    // 1. Get AI Settings
    const aiPreferences = await prisma.userAiPreference.findMany({
      where: { userId },
      include: {
        model: true,
        provider: {
          select: {
            id: true,
            name: true,
            provider: true,
          }
        }
      },
    });

    // 2. Get Profile Default Template
    const defaultProfile = await prisma.profile.findFirst({
      where: { userId, isDefault: true },
      select: { id: true, selectedTemplateId: true },
    });

    const responseData = {
      ai: aiPreferences.map(p => ({
        feature: p.feature,
        modelId: p.modelId,
        modelKey: p.model?.modelKey,
        providerId: p.providerId,
        providerType: p.provider.provider,
      })),
      template: {
        defaultProfileId: defaultProfile?.id,
        defaultTemplateId: defaultProfile?.selectedTemplateId,
      }
    };
    // Return ServiceResult - will be automatically wrapped by createApiHandler
    return {
      success: true,
      data: responseData
    };
  } catch (error) {
    logger.error('Failed to fetch user preferences', error);
    return {
      success: false,
      error: 'Failed to fetch preferences',
      code: 'INTERNAL_ERROR'
    };
  }
});
