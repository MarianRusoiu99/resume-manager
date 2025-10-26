/**
 * Test script for the Job Analysis Agent
 * Run with: OPENAI_API_KEY=your-key npx tsx scripts/test-job-analysis.ts
 */

import { testJobAnalysisAgent } from '../lib/ai/workflow';

const JOB_DESCRIPTION = `
We are seeking a Senior Full Stack Engineer to join our growing team. 

Required Skills:
- 5+ years of experience in full-stack development
- Strong proficiency in TypeScript and JavaScript
- Experience with React and Next.js
- Proficiency in Node.js and Express
- Experience with PostgreSQL or other relational databases
- Strong understanding of RESTful APIs and GraphQL
- Experience with Git and CI/CD pipelines

Preferred Skills:
- Experience with cloud platforms (AWS, GCP, or Azure)
- Familiarity with Docker and Kubernetes
- Experience with microservices architecture
- Knowledge of Redis or other caching solutions
- Experience with test-driven development (TDD)

Responsibilities:
- Design and implement scalable web applications
- Collaborate with product managers and designers
- Write clean, maintainable code
- Mentor junior developers
- Participate in code reviews and architectural discussions

We offer competitive salary, equity, remote work flexibility, and comprehensive benefits.
`;

async function main() {
  const apiKey = process.env.OPENAI_API_KEY;
  
  if (!apiKey) {
    console.error('❌ Error: OPENAI_API_KEY environment variable is not set');
    console.log('\nUsage: OPENAI_API_KEY=your-key npx tsx scripts/test-job-analysis.ts');
    process.exit(1);
  }

  try {
    await testJobAnalysisAgent(
      JOB_DESCRIPTION,
      apiKey,
      'Senior Full Stack Engineer',
      'Tech Company Inc.'
    );
    console.log('\n✅ Test completed successfully!');
  } catch (error) {
    console.error('\n❌ Test failed:', error);
    process.exit(1);
  }
}

main();
