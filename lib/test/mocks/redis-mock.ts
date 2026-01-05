import { vi } from 'vitest';

export const createRedisMock = () => ({
  get: vi.fn(),
  set: vi.fn(),
  del: vi.fn(),
  expire: vi.fn(),
  exists: vi.fn(),
});

export const redisMock = createRedisMock();

export function resetRedisMock() {
  Object.values(redisMock).forEach((fn) => fn.mockReset());
}
