/**
 * User Repository
 * 
 * Data access layer for user operations.
 * Abstracts Prisma operations for better testability and separation of concerns.
 */

import { PrismaClient, User } from '@prisma/client';
import { prisma } from '@/lib/db/index';
import { GenericRepository } from './generic.repository';
import { RecordNotFoundError } from '@/lib/errors/database';

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
 * User data without sensitive fields
 */
export type SafeUser = Omit<User, 'passwordHash'>;

/**
 * Repository for managing users in the database
 */
export class UserRepository extends GenericRepository<User, CreateUserInput, UpdateUserInput> {
  constructor(dbClient: PrismaClient = prisma) {
    super('user', dbClient);
  }

  /**
   * Create a new user
   */
  async create(data: CreateUserInput): Promise<User> {
    return this.db.user.create({
      data: {
        email: data.email,
        passwordHash: data.passwordHash,
        name: data.name,
      },
    });
  }

  /**
   * Find user by ID
   */
  override async findById(id: string): Promise<User | null> {
    return this.delegate.findUnique({
      where: { id },
    }) as Promise<User | null>;
  }

  /**
   * Find user by ID without password hash
   */
  async findByIdSafe(id: string): Promise<SafeUser | null> {
    const user = await this.delegate.findUnique({
      where: { id },
      select: {
        id: true,
        email: true,
        name: true,
        isAdmin: true,
        createdAt: true,
        updatedAt: true,
      },
    });
    return user as SafeUser | null;
  }

  /**
   * Find user by email
   */
  async findByEmail(email: string): Promise<User | null> {
    return this.delegate.findUnique({
      where: { email },
    }) as Promise<User | null>;
  }

  /**
   * Check if user exists by email
   */
  async existsByEmail(email: string): Promise<boolean> {
    const count = await this.delegate.count({
      where: { email },
    });
    return count > 0;
  }

  /**
   * Check if user exists by ID
   */
  async existsById(id: string): Promise<boolean> {
    const count = await this.delegate.count({
      where: { id },
    });
    return count > 0;
  }

  /**
   * Update user
   */
  override async update(id: string, data: UpdateUserInput): Promise<User> {
    return this.delegate.update({
      where: { id },
      data: {
        ...(data.email !== undefined && { email: data.email }),
        ...(data.passwordHash !== undefined && { passwordHash: data.passwordHash }),
        ...(data.name !== undefined && { name: data.name }),
      },
    }) as Promise<User>;
  }

  /**
   * Update user password
   */
  async updatePassword(id: string, passwordHash: string): Promise<User> {
    return this.delegate.update({
      where: { id },
      data: { passwordHash },
    }) as Promise<User>;
  }

  /**
   * Delete user and all related data (cascade)
   */
  override async delete(id: string): Promise<User> {
    const user = await this.findById(id);
    if (!user) {
      throw new RecordNotFoundError('User', id, 'delete');
    }

    await this.delegate.delete({
      where: { id },
    });

    return user;
  }

  /**
   * Get user with profile count
   */
  async findWithStats(id: string): Promise<(User & { _count: { profiles: number; resumes: number } }) | null> {
    return this.delegate.findUnique({
      where: { id },
      include: {
        _count: {
          select: {
            profiles: true,
            resumes: true,
          },
        },
      },
    }) as Promise<(User & { _count: { profiles: number; resumes: number } }) | null>;
  }
}

// Export singleton instance
export const userRepository = new UserRepository();
