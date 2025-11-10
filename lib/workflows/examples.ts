/**
 * Example Usage of Simple AI Workflow
 * 
 * This file demonstrates how to use the Vercel AI SDK workflow
 */

import { generateResume } from '@/lib/workflows';
import type { Resume } from '@/lib/validations/jsonresume';

// Example: Basic usage
async function basicExample() {
  const userResume: Resume = {
    basics: {
      name: 'John Doe',
      email: 'john@example.com',
      phone: '555-0100',
      summary: 'Experienced software engineer with 5 years in web development',
    },
    work: [
      {
        name: 'Tech Corp',
        position: 'Senior Developer',
        startDate: '2020-01',
        highlights: [
          'Led team of 5 developers',
          'Improved performance by 40%',
        ],
      },
    ],
    skills: [
      {
        name: 'Programming',
        keywords: ['JavaScript', 'TypeScript', 'React', 'Node.js'],
      },
    ],
  };

  const result = await generateResume({
    apiKey: 'sk-...', // User's OpenAI API key
    jobDescription: `
      Senior Full Stack Engineer at Acme Corp
      
      We're looking for an experienced engineer to join our team.
      
      Requirements:
      - 5+ years of web development experience
      - Strong TypeScript and React skills
      - Experience with Node.js backends
      - Team leadership experience
      
      Responsibilities:
      - Build and maintain web applications
      - Lead technical projects
      - Mentor junior developers
    `,
    userResume, // Pass the resume object
    includeCoverLetter: true,
    personalInstructions: 'Emphasize my leadership and mentoring experience',
  });

  if (result.success) {
    console.log('✅ Resume generated!');
    console.log('Resume:', result.resume);
    console.log('Cover Letter:', result.coverLetter);
  } else {
    console.error('❌ Failed:', result.error);
  }
}

// Example: Without cover letter
async function quickExample() {
  const result = await generateResume({
    apiKey: 'sk-...',
    jobDescription: 'Software Engineer at Startup Inc...',
    userResume: {
      basics: { name: 'Jane Smith' },
      work: [
        {
          name: 'Previous Company',
          position: 'Developer',
          startDate: '2021-01',
        },
      ],
    },
    includeCoverLetter: false, // Skip cover letter
  });

  return result;
}

// Example: Error handling
async function errorHandlingExample() {
  try {
    const result = await generateResume({
      apiKey: 'invalid-key',
      jobDescription: 'Job description...',
      userResume: { basics: { name: 'Test User' } },
    });

    if (!result.success) {
      // Handle the error
      console.error('Generation failed:', result.error);
      
      // Show user-friendly message
      if (result.error?.includes('API key')) {
        console.log('Please check your OpenAI API key');
      } else if (result.error?.includes('rate limit')) {
        console.log('Too many requests, please try again later');
      } else {
        console.log('Something went wrong, please try again');
      }
    }
  } catch (error) {
    // Handle unexpected errors
    console.error('Unexpected error:', error);
  }
}

// Export examples (you can delete this file or use it for testing)
export { basicExample, quickExample, errorHandlingExample };
