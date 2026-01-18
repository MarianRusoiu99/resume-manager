import { ApiProvider, ApiModel } from '@prisma/client';
import { TransactionClient } from '@/lib/db/transaction';

export type ApiProviderWithModels = ApiProvider & { models: ApiModel[] };

export interface CreateApiProviderInput {
  userId: string;
  name: string;
  provider: string;
  encryptedKey: string;
  models: string[];
}

export interface UpdateApiProviderInput {
  name?: string;
  encryptedKey?: string;
  isActive?: boolean;
  lastUsedAt?: Date;
  keyVersion?: number;
  revokedAt?: Date;
  scopes?: string[];
}

export interface IApiProviderRepository {
  create(data: CreateApiProviderInput, tx?: TransactionClient): Promise<ApiProviderWithModels>;
  findByUserId(userId: string, includeInactive?: boolean, tx?: TransactionClient): Promise<ApiProviderWithModels[]>;
  findById(id: string, userId?: string, tx?: TransactionClient): Promise<ApiProviderWithModels | null>;
  findByProviderType(userId: string, provider: string, tx?: TransactionClient): Promise<ApiProviderWithModels[]>;
  update(id: string, data: UpdateApiProviderInput, userId?: string, tx?: TransactionClient): Promise<ApiProviderWithModels>;
  updateLastUsed(id: string, ipAddress?: string, tx?: TransactionClient): Promise<ApiProvider>;
  incrementUsage(id: string, ipAddress?: string, tx?: TransactionClient): Promise<ApiProvider>;
  delete(id: string, userId?: string, tx?: TransactionClient): Promise<ApiProviderWithModels>;
  toggleActive(id: string, userId: string, isActive: boolean, tx?: TransactionClient): Promise<ApiProvider>;
  countActive(userId: string, tx?: TransactionClient): Promise<number>;
}
