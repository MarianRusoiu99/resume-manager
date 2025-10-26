import { ResumeGenerationState } from './types';
import { createInitialState, validateUserProfile } from './utils';
import { testEmptyWorkflow } from './graph';

/**
 * Test helper to create a mock user profile
 */
export function createMockUserProfile(): ResumeGenerationState['userProfile'] {
  return {
    personalInfo: {
      name: 'John Doe',
      email: 'john.doe@example.com',
      phone: '+1-555-0123',
      location: 'San Francisco, CA',
      linkedin: 'https://linkedin.com/in/johndoe',
      github: 'https://github.com/johndoe',
      website: 'https://johndoe.com'
    },
    summary: 'Experienced software engineer with 5+ years building scalable web applications.',
    experience: [
      {
        company: 'Tech Corp',
        title: 'Senior Software Engineer',
        startDate: '2021-01',
        endDate: undefined,
        current: true,
        description: 'Leading development of cloud-native applications using TypeScript and React.'
      },
      {
        company: 'Startup Inc',
        title: 'Software Engineer',
        startDate: '2019-06',
        endDate: '2020-12',
        current: false,
        description: 'Built REST APIs and frontend features for a SaaS platform.'
      }
    ],
    education: [
      {
        school: 'University of California',
        degree: 'Bachelor of Science',
        field: 'Computer Science',
        gpa: '3.8',
        startDate: '2015-09',
        endDate: '2019-05',
        description: 'Focus on software engineering and algorithms.'
      }
    ],
    skills: {
      technical: ['TypeScript', 'React', 'Node.js', 'PostgreSQL', 'AWS'],
      soft: ['Leadership', 'Communication', 'Problem Solving'],
      languages: ['English (Native)', 'Spanish (Conversational)']
    }
  };
}

/**
 * Test helper to create a mock job description
 */
export function createMockJobDescription(): string {
  return `
We are seeking a Senior Full Stack Engineer to join our growing team.

Requirements:
- 5+ years of experience with TypeScript and React
- Strong background in Node.js and API development
- Experience with PostgreSQL or similar databases
- Cloud deployment experience (AWS, GCP, or Azure)
- Excellent communication skills

Responsibilities:
- Design and implement new features for our SaaS platform
- Collaborate with product and design teams
- Mentor junior engineers
- Participate in code reviews and architecture decisions

Nice to have:
- Experience with GraphQL
- Knowledge of CI/CD pipelines
- Open source contributions
  `.trim();
}

/**
 * Test the workflow validation
 */
export async function testWorkflowValidation(): Promise<void> {
  console.log('\n🧪 Test: Workflow Validation\n');

  try {
    // Test 1: Valid input
    console.log('Test 1: Valid input');
    const validProfile = createMockUserProfile();
    const validState = createInitialState(createMockJobDescription(), validProfile, {
      jobTitle: 'Senior Full Stack Engineer',
      companyName: 'Acme Corp'
    });

    const validation = validateUserProfile(validState.userProfile);
    console.log('Validation result:', validation);
    console.assert(validation.valid, 'Valid profile should pass validation');
    console.log('✅ Test 1 passed\n');

    // Test 2: Missing name
    console.log('Test 2: Missing name');
    const invalidProfile = {
      ...validProfile,
      personalInfo: { ...validProfile.personalInfo, name: '' }
    };
    const invalidValidation = validateUserProfile(invalidProfile);
    console.log('Validation result:', invalidValidation);
    console.assert(!invalidValidation.valid, 'Invalid profile should fail validation');
    console.assert(invalidValidation.errors.includes('Name is required'), 'Should have name error');
    console.log('✅ Test 2 passed\n');

    // Test 3: Missing experience
    console.log('Test 3: Missing experience');
    const noExperienceProfile = { ...validProfile, experience: [] };
    const noExpValidation = validateUserProfile(noExperienceProfile);
    console.log('Validation result:', noExpValidation);
    console.assert(!noExpValidation.valid, 'Profile without experience should fail');
    console.log('✅ Test 3 passed\n');

    console.log('✅ All validation tests passed!\n');
  } catch (error) {
    console.error('❌ Validation tests failed:', error);
    throw error;
  }
}

/**
 * Test the empty workflow execution
 */
export async function testEmptyWorkflowExecution(): Promise<void> {
  console.log('\n🧪 Test: Empty Workflow Execution\n');

  try {
    const profile = createMockUserProfile();
    const jobDescription = createMockJobDescription();

    const state = createInitialState(jobDescription, profile, {
      jobTitle: 'Senior Full Stack Engineer',
      companyName: 'Acme Corp'
    });

    console.log('Initial state created, invoking workflow...');
    const result = await testEmptyWorkflow(state);

    console.log('\nWorkflow execution completed');
    console.log('Result keys:', Object.keys(result));

    console.assert(result !== null, 'Result should not be null');
    console.log('✅ Empty workflow test passed!\n');
  } catch (error) {
    console.error('❌ Empty workflow test failed:', error);
    throw error;
  }
}

/**
 * Run all tests
 */
export async function runAllTests(): Promise<void> {
  console.log('🚀 Starting LangGraph Foundation Tests\n');
  console.log('='.repeat(50));

  try {
    await testWorkflowValidation();
    await testEmptyWorkflowExecution();

    console.log('='.repeat(50));
    console.log('\n✅ All tests passed successfully!\n');
  } catch (error) {
    console.log('='.repeat(50));
    console.error('\n❌ Tests failed!\n');
    throw error;
  }
}

// Export test utilities
export const testUtils = {
  createMockUserProfile,
  createMockJobDescription,
  testWorkflowValidation,
  testEmptyWorkflowExecution,
  runAllTests
};
