/**
 * User Repository
 * 
 * Data access layer for user operations.
 * Abstracts Prisma operations for better testability and separation of concerns.
 */

import { PrismaClient, User, Prisma } from '@prisma/client';
import { prisma } from '@/lib/db/index';
import { GenericRepository } from './generic.repository';
import { RecordNotFoundError } from '@/lib/errors/database';
import { TransactionClient } from '@/lib/db/transaction';
import { 
  IUserRepository, 
  CreateUserInput, 
  UpdateUserInput, 
  SafeUser,
  UserWithStats
} from './interfaces/users.repository.interface';

/**
 * Repository for managing users in the database
 */
export class UserRepository 
  extends GenericRepository<User, CreateUserInput, UpdateUserInput, 'user', Prisma.UserDelegate>
  implements IUserRepository 
{
  constructor(dbClient: PrismaClient = prisma) {
    super('user', dbClient);
  }

  /**
   * Create a new user
   */
  override async create(data: CreateUserInput, tx?: TransactionClient): Promise<User> {
    return this.getDelegate(tx).create({
      data: {
        email: data.email,
        passwordHash: data.passwordHash,
        name: data.name,
      },
    }) as Promise<User>;
  }

  /**
   * Find user by ID
   */
  override async findById(id: string, userId?: string, tx?: TransactionClient): Promise<User | null> {
    // userId is ignored for users as they don't own themselves in the same way other entities do
    return this.getDelegate(tx).findUnique({
      where: { id },
    }) as Promise<User | null>;
  }

  /**
   * Find user by ID without password hash
   */
  async findByIdSafe(id: string, tx?: TransactionClient): Promise<SafeUser | null> {
    const user = await this.getDelegate(tx).findUnique({
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
  async findByEmail(email: string, tx?: TransactionClient): Promise<User | null> {
    return this.getDelegate(tx).findUnique({
      where: { email },
    }) as Promise<User | null>;
  }

  /**
   * Check if user exists by email
   */
  async existsByEmail(email: string, tx?: TransactionClient): Promise<boolean> {
    const count = await this.getDelegate(tx).count({
      where: { email },
    });
    return count > 0;
  }

  /**
   * Check if user exists by ID
   */
  async existsById(id: string, tx?: TransactionClient): Promise<boolean> {
    const count = await this.getDelegate(tx).count({
      where: { id },
    });
    return count > 0;
  }

  /**
   * Update user
   */
  override async update(id: string, data: UpdateUserInput, userId?: string, tx?: TransactionClient): Promise<User> {
    return this.getDelegate(tx).update({
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
  async updatePassword(id: string, passwordHash: string, tx?: TransactionClient): Promise<User> {
    return this.getDelegate(tx).update({
      where: { id },
      data: { passwordHash },
    }) as Promise<User>;
  }

  /**
   * Delete user and all related data (cascade)
   */
  override async delete(id: string, userId?: string, tx?: TransactionClient): Promise<User> {
    const user = await this.findById(id, userId, tx);
    if (!user) {
      throw new RecordNotFoundError('User', id, 'delete');
    }

    await this.getDelegate(tx).delete({
      where: { id },
    });

    return user;
  }

  /**
   * Get user with profile count
   */
  async findWithStats(id: string, tx?: TransactionClient): Promise<UserWithStats | null> {
    return this.getDelegate(tx).findUnique({
      where: { id },
      include: {
        _count: {
          select: {
            profiles: true,
            resumes: true,
          },
        },
      },
    }) as Promise<UserWithStats | null>;
  }
}

// Export singleton instance
export const userRepository = new UserRepository();
