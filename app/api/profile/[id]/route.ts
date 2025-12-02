/**
 * GET /api/profile/[id] - Get a specific profile
 * PATCH /api/profile/[id] - Update a profile
 * DELETE /api/profile/[id] - Delete a profile
 */

import { NextResponse } from 'next/server';
import { profileService } from '@/lib/services/profile.service';
import { z } from 'zod';
import { createApiHandler } from '@/lib/api-handler';

// Schema for updating a profile
const updateProfileSchema = z.object({
  name: z.string().min(1).max(100).optional(),
  resume: z.object({}).passthrough().optional(),
  isDefault: z.boolean().optional(),
  selectedTemplateId: z.string().nullable().optional(), // Add template preference
});

export const GET = createApiHandler(async (request, { params }, session) => {
  const { id } = await params;

  const result = await profileService.getProfileById(id, session.user.id);

  if (!result.success) {
    return NextResponse.json(
      { error: result.error },
      { status: 404 }
    );
  }

  return NextResponse.json(result.data);
});

export const PATCH = createApiHandler(async (request, { params }, session) => {
  const { id } = await params;

  const body = await request.json();
  const validation = updateProfileSchema.safeParse(body);

  if (!validation.success) {
    return NextResponse.json(
      {
        error: 'Invalid request',
        details: validation.error.issues.map(e => ({
          field: e.path.join('.'),
          message: e.message
        }))
      },
      { status: 400 }
    );
  }

  const result = await profileService.updateProfile(
    id,
    session.user.id,
    validation.data
  );

  if (!result.success) {
    return NextResponse.json(
      { error: result.error },
      { status: 400 }
    );
  }

  return NextResponse.json(result.data);
});

export const DELETE = createApiHandler(async (request, { params }, session) => {
  const { id } = await params;

  const result = await profileService.deleteProfile(id, session.user.id);

  if (!result.success) {
    return NextResponse.json(
      { error: result.error },
      { status: 400 }
    );
  }

  return NextResponse.json({ success: true });
});
