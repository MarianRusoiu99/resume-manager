/**
 * API Provider Service (Facade)
 *
 * This file is intentionally kept as a stable import path.
 * The implementation lives in `lib/services/api-provider/*`.
 */

export { ApiProviderService, apiProviderService } from './api-provider';
export type {
  AddApiProviderInput,
  UpdateApiProviderInput,
  ProviderWithModels,
  ProviderInfo,
  ProviderListItem,
  ProviderInstanceData,
  AvailableModelsData,
  ValidationData,
} from './api-provider';
