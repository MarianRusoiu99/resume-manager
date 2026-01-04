import { PrismaClient } from '@prisma/client';
import { beforeAll, afterAll, afterEach } from 'vitest';

// Test database instance
let testPrisma: PrismaClient | null = null;
let databaseConnected = false;

// Check if database is available
const isDatabaseAvailable = () => {
  return process.env.DATABASE_URL !== undefined;
};

// Get or create test Prisma client
export function getTestPrisma(): PrismaClient {
  if (!testPrisma && isDatabaseAvailable()) {
    testPrisma = new PrismaClient({
      datasources: {
        db: {
          url: process.env.DATABASE_URL,
        },
      },
    });
  }
  
  if (!testPrisma) {
    throw new Error('Database not available for testing. Set DATABASE_URL environment variable.');
  }
  
  return testPrisma;
}

// Cleanup utilities
export async function cleanupDatabase() {
  if (!databaseConnected || !testPrisma) {
    return;
  }
  
  try {
    // Delete in correct order to respect foreign key constraints
    await testPrisma.coverLetter.deleteMany({});
    await testPrisma.generatedResume.deleteMany({});
    await testPrisma.resume.deleteMany({});
    await testPrisma.profile.deleteMany({});
    await testPrisma.template.deleteMany({});
    await testPrisma.apiKey.deleteMany({});
    await testPrisma.aiAuditLog.deleteMany({});
    await testPrisma.session.deleteMany({});
    await testPrisma.user.deleteMany({});
  } catch (error) {
    // Silently ignore cleanup errors
  }
}

export async function resetDatabase() {
  await cleanupDatabase();
}

// Global setup hooks - only if database is available
if (isDatabaseAvailable()) {
  beforeAll(async () => {
    try {
      const prisma = getTestPrisma();
      await prisma.$connect();
      databaseConnected = true;
    } catch (error) {
      console.warn('Database not available, some tests will be skipped');
      databaseConnected = false;
    }
  });

  afterAll(async () => {
    if (testPrisma && databaseConnected) {
      await cleanupDatabase();
      await testPrisma.$disconnect();
    }
  });

  // Clean up after each test
  afterEach(async () => {
    if (databaseConnected) {
      await cleanupDatabase();
    }
  });
}

// Helper to create isolated test context
export function createTestContext() {
  return {
    prisma: getTestPrisma(),
    cleanup: cleanupDatabase,
  };
}

// Helper to check if tests should be skipped
export function shouldSkipDatabaseTests(): boolean {
  return !isDatabaseAvailable() || !databaseConnected;
}
