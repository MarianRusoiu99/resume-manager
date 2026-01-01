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
    name: formData.get('name') || undefined,
  });

  if (!validatedFields.success) {
    return {
      errors: validatedFields.error.flatten().fieldErrors,
      message: 'Please fix the errors below.',
    };
  }

  const { email, password, name } = validatedFields.data;

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

    await prisma.user.create({
      data: {
        email,
        passwordHash,
        name,
      },
    });

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
