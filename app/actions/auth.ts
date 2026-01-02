'use server';

/**
 * Authentication Server Actions
 * 
 * Server Actions for login, register, and logout.
 * Uses the new Next.js 16 patterns with useActionState.
 * 
 * @see https://nextjs.org/docs/app/guides/authentication
 */

import { signIn, signOut } from '@/lib/auth/config';
import { prisma } from '@/lib/db/index';
import { hashPassword } from '@/lib/auth/password';
import { isRedirectError } from 'next/dist/client/components/redirect-error';
import {
  loginSchema,
  registerSchema,
  type AuthFormState,
} from '@/lib/validations/auth';
import { DEFAULT_LOGIN_REDIRECT } from '@/lib/auth/routes';
import { sanitizeCallbackUrl } from '@/lib/utils/redirects';
import { logger } from '@/lib/utils/logger';
import { notificationService } from '@/lib/services';
import { getVerifiedSession } from '@/lib/auth/dal';

/**
 * Login action for use with useActionState
 */
export async function loginAction(
  prevState: AuthFormState,
  formData: FormData
): Promise<AuthFormState> {
  // Validate form fields
  const validatedFields = loginSchema.safeParse({
    email: formData.get('email'),
    password: formData.get('password'),
  });

  if (!validatedFields.success) {
    return {
      errors: validatedFields.error.flatten().fieldErrors,
      message: 'Invalid credentials.',
    };
  }

  const { email, password } = validatedFields.data;

  try {
    await signIn('credentials', {
      email,
      password,
      redirect: false,
    });

    // Success - will redirect
    return { success: true };
  } catch (error) {
    // Re-throw redirect errors (expected for successful login with redirect)
    if (isRedirectError(error)) {
      throw error;
    }

    logger.warn('Login failed', { email });

    return {
      message: 'Invalid email or password.',
    };
  }
}

/**
 * Register action for use with useActionState
 */
export async function registerAction(
  prevState: AuthFormState,
  formData: FormData
): Promise<AuthFormState> {
  // Validate form fields
  const validatedFields = registerSchema.safeParse({
    email: formData.get('email'),
    password: formData.get('password'),
  });

  if (!validatedFields.success) {
    return {
      errors: validatedFields.error.flatten().fieldErrors,
      message: 'Please fix the errors below.',
    };
  }

  const { email, password } = validatedFields.data;

  try {
    // Check if user already exists
    const existingUser = await prisma.user.findUnique({
      where: { email },
    });

    if (existingUser) {
      return {
        errors: { email: ['An account with this email already exists.'] },
        message: 'Registration failed.',
      };
    }

    // Hash password and create user
    const passwordHash = await hashPassword(password);

    const user = await prisma.user.create({
      data: {
        email,
        passwordHash,
      },
    });

    // Send onboarding notifications
    await notificationService.notifySystem(
      user.id,
      'Welcome! Configure AI',
      'Set up your API providers and model preferences to enable all features.',
      '/settings/ai-config',
      'Configure AI'
    );

    logger.info('User registered', { email });

    return {
      success: true,
      message: 'Account created successfully. Please sign in.',
    };
  } catch (error) {
    logger.error('Registration error', error);

    return {
      message: 'An error occurred. Please try again.',
    };
  }
}

/**
 * Delete account action
 */
export async function deleteAccountAction(): Promise<AuthFormState> {
  const session = await getVerifiedSession();

  if (!session?.userId) {
    return {
      message: 'You must be signed in to delete your account.',
    };
  }

  try {
    const userId = session.userId;

    // Delete user from database (cascades will handle related data)
    await prisma.user.delete({
      where: { id: userId },
    });

    logger.info('User deleted account', { userId });

    // Sign out the user
    await signOut({ redirectTo: '/login' });

    return { success: true };
  } catch (error) {
    logger.error('Delete account error', error);
    return {
      message: 'An error occurred while deleting your account. Please try again.',
    };
  }
}

/**
 * Logout action
 */
export async function logoutAction() {
  await signOut({ redirectTo: '/login' });
}

/**
 * Login and redirect (for programmatic use)
 */
export async function loginAndRedirect(
  email: string,
  password: string,
  callbackUrl?: string
) {
  try {
    const redirectTo = sanitizeCallbackUrl(callbackUrl, DEFAULT_LOGIN_REDIRECT);

    await signIn('credentials', {
      email,
      password,
      redirectTo,
    });
  } catch (error) {
    // Re-throw redirect errors (expected for successful login with redirect)
    if (isRedirectError(error)) {
      throw error;
    }
    throw new Error('Invalid credentials');
  }
}
