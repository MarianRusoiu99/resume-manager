/**
 * Cover Letter Repository Interface
 * 
 * Defines the contract for cover letter data access operations.
 */

import { Prisma } from '@prisma/client';

/**
 * Cover letter data structure
 */
export interface CoverLetterData {
  id: string;
  userId: string;
  content: string;
  jobDescription: string;
  jobTitle: string | null;
  companyName: string | null;
  metadata: unknown;
  createdAt: Date;
  updatedAt: Date;
}

/**
 * Input for creating a cover letter
 */
export interface CreateCoverLetterInput {
  userId: string;
  content: string;
  jobDescription: string;
  jobTitle?: string;
  companyName?: string;
  metadata: {
    model?: string;
    tokens?: number;
    generationTime?: number;
    personalInstructions?: string;
  };
}

/**
 * Input for updating a cover letter
 */
export interface UpdateCoverLetterInput {
  content?: string;
  jobDescription?: string;
  jobTitle?: string;
  companyName?: string;
  metadata?: Prisma.InputJsonValue;
}

/**
 * Options for finding cover letters
 */
export interface FindCoverLettersOptions {
  limit?: number;
  offset?: number;
  orderBy?: 'createdAt' | 'updatedAt';
  orderDir?: 'asc' | 'desc';
}

/**
 * Cover Letter Repository Interface
 */
export interface ICoverLetterRepository {
  /**
   * Create a new cover letter
   */
  create(data: CreateCoverLetterInput): Promise<CoverLetterData>;

  /**
   * Find cover letter by ID with user ownership check
   */
  findById(id: string, userId: string): Promise<CoverLetterData | null>;

  /**
   * Find all cover letters for a user
   */
  findByUserId(
    userId: string,
    options?: FindCoverLettersOptions
  ): Promise<{ coverLetters: CoverLetterData[]; total: number }>;

  /**
   * Update a cover letter
   */
  update(id: string, userId: string, data: UpdateCoverLetterInput): Promise<CoverLetterData>;

  /**
   * Delete a cover letter
   */
  delete(id: string, userId: string): Promise<CoverLetterData>;

  /**
   * Check if cover letter exists and belongs to user
   */
  exists(id: string, userId: string): Promise<boolean>;
}
