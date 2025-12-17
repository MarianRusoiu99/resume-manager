import { NotFoundError } from '@/lib/errors';

export abstract class BaseCrudService {
  protected async requireExists(existsPromise: Promise<boolean>, resourceName: string): Promise<void> {
    const exists = await existsPromise;
    if (!exists) {
      throw new NotFoundError(resourceName);
    }
  }

  protected async requireFound<T>(entityPromise: Promise<T | null>, resourceName: string): Promise<T> {
    const entity = await entityPromise;
    if (!entity) {
      throw new NotFoundError(resourceName);
    }

    return entity;
  }
}
