'use server';

import { getSession } from '@/lib/auth/dal';
import {
  getAgentMemory,
  upsertAgentMemory,
  deleteAgentMemory,
  getAllAgentMemories,
  type MemoryMode,
} from '@/lib/db/repositories/agent-memory';

async function requireUserId(): Promise<string> {
  const session = await getSession();
  if (!session) throw new Error('Unauthorized');
  return session.userId;
}

export async function getAgentMemoryAction(
  mode: MemoryMode
): Promise<{ content: string } | null> {
  const userId = await requireUserId();
  const record = await getAgentMemory(userId, mode);
  if (!record) return null;
  return { content: record.content };
}

export async function upsertAgentMemoryAction(
  mode: MemoryMode,
  content: string
): Promise<{ content: string }> {
  const userId = await requireUserId();
  const record = await upsertAgentMemory(userId, mode, content);
  return { content: record.content };
}

export async function deleteAgentMemoryAction(mode: MemoryMode): Promise<void> {
  const userId = await requireUserId();
  await deleteAgentMemory(userId, mode);
}

export async function getAllAgentMemoriesAction(): Promise<
  Array<{ mode: MemoryMode; content: string; updatedAt: Date }>
> {
  const userId = await requireUserId();
  const records = await getAllAgentMemories(userId);
  return records.map(({ mode, content, updatedAt }) => ({ mode, content, updatedAt }));
}
