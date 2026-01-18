/**
 * User Repository Interface
 * 
 * Defines the contract for user data access operations.
 */

import { User } from '@prisma/client';
import { TransactionClient } from '@/lib/db/transaction';

/**
 * User data without sensitive fields
 */
export type SafeUser = Omit<User, 'passwordHash'>;

/**
 * User with statistics (profile and resume counts)
 */
export type UserWithStats = User & {
  _count: {
    profiles: number;
    resumes: number;
  };
};

/**
 * Input for creating a new user
 */
export interface CreateUserInput {
  email: string;
  passwordHash: string;
  name?: string;
}

/**
 * Input for updating a user
 */
export interface UpdateUserInput {
  email?: string;
  passwordHash?: string;
  name?: string;
}

/**
 * User Repository Interface
 */
export interface IUserRepository {
  /**
   * Create a new user
   */
  create(data: CreateUserInput, tx?: TransactionClient): Promise<User>;

  /**
   * Find user by ID
   */
  findById(id: string, userId?: string, tx?: TransactionClient): Promise<User | null>;

  /**
   * Find user by ID without password hash
   */
  findByIdSafe(id: string, tx?: TransactionClient): Promise<SafeUser | null>;

  /**
   * Find user by email
   */
  findByEmail(email: string, tx?: TransactionClient): Promise<User | null>;

  /**
   * Check if user exists by email
   */
  existsByEmail(email: string, tx?: TransactionClient): Promise<boolean>;

  /**
   * Check if user exists by ID
   */
  existsById(id: string, tx?: TransactionClient): Promise<boolean>;

  /**
   * Update user
   */
  update(id: string, data: UpdateUserInput, userId?: string, tx?: TransactionClient): Promise<User>;

  /**
   * Update user password
   */
  updatePassword(id: string, passwordHash: string, tx?: TransactionClient): Promise<User>;

  /**
   * Delete user
   */
  delete(id: string, userId?: string, tx?: TransactionClient): Promise<User>;

  /**
   * Get user with profile count
   */
  findWithStats(id: string, tx?: TransactionClient): Promise<UserWithStats | null>;
}
