import { prisma } from '@/lib/db';

export type MemoryMode = 'resume' | 'cover-letter' | 'template' | 'global';

export interface AgentMemoryRecord {
  id: string;
  mode: MemoryMode;
  content: string;
  updatedAt: Date;
}

export async function getAgentMemory(
  userId: string,
  mode: MemoryMode
): Promise<AgentMemoryRecord | null> {
  const record = await prisma.agentMemory.findUnique({
    where: { userId_mode: { userId, mode } },
    select: { id: true, mode: true, content: true, updatedAt: true },
  });
  if (!record) return null;
  return { ...record, mode: record.mode as MemoryMode };
}

export async function upsertAgentMemory(
  userId: string,
  mode: MemoryMode,
  content: string
): Promise<AgentMemoryRecord> {
  const record = await prisma.agentMemory.upsert({
    where: { userId_mode: { userId, mode } },
    create: { userId, mode, content },
    update: { content },
    select: { id: true, mode: true, content: true, updatedAt: true },
  });
  return { ...record, mode: record.mode as MemoryMode };
}

export async function deleteAgentMemory(
  userId: string,
  mode: MemoryMode
): Promise<void> {
  await prisma.agentMemory.deleteMany({
    where: { userId, mode },
  });
}

export async function getAllAgentMemories(
  userId: string
): Promise<AgentMemoryRecord[]> {
  const records = await prisma.agentMemory.findMany({
    where: { userId },
    select: { id: true, mode: true, content: true, updatedAt: true },
    orderBy: { updatedAt: 'desc' },
  });
  return records.map((r) => ({ ...r, mode: r.mode as MemoryMode }));
}
