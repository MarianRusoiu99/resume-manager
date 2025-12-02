/**
 * GET /api/profile - Get all profiles for the current user
 * POST /api/profile - Create a new profile
 */

import { NextResponse } from 'next/server';
import { profileService } from '@/lib/services/profile.service';
import { z } from 'zod';
import { createApiHandler } from '@/lib/api-handler';

// Schema for creating a new profile
const createProfileSchema = z.object({
  name: z.string().min(1, 'Profile name is required').max(100),
  resume: z.object({}).passthrough(), // JSON Resume format
  isDefault: z.boolean().optional(),
});

export const GET = createApiHandler(async (request, context, session) => {
  const result = await profileService.getProfiles(session.user.id);

  if (!result.success) {
    return NextResponse.json(
      { error: result.error },
      { status: 500 }
    );
  }

  return NextResponse.json(result.data);
});

export const POST = createApiHandler(async (request, context, session) => {
  const body = await request.json();
  const validation = createProfileSchema.safeParse(body);

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

  const { name, resume, isDefault } = validation.data;

  const result = await profileService.createProfile(
    session.user.id,
    name,
    resume,
    isDefault
  );

  if (!result.success) {
    return NextResponse.json(
      { error: result.error },
      { status: 400 }
    );
  }

  return NextResponse.json(result.data, { status: 201 });
});
