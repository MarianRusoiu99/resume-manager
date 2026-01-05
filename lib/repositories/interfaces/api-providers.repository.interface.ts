import { ApiProvider, ApiModel } from '@prisma/client';

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
  create(data: CreateApiProviderInput): Promise<ApiProviderWithModels>;
  findByUserId(userId: string, includeInactive?: boolean): Promise<ApiProviderWithModels[]>;
  findById(id: string, userId?: string): Promise<ApiProviderWithModels | null>;
  findByProviderType(userId: string, provider: string): Promise<ApiProviderWithModels[]>;
  update(id: string, data: UpdateApiProviderInput, userId?: string): Promise<ApiProviderWithModels>;
  updateLastUsed(id: string, ipAddress?: string): Promise<ApiProvider>;
  incrementUsage(id: string, ipAddress?: string): Promise<ApiProvider>;
  delete(id: string, userId?: string): Promise<ApiProviderWithModels>;
  toggleActive(id: string, userId: string, isActive: boolean): Promise<ApiProvider>;
  countActive(userId: string): Promise<number>;
}
