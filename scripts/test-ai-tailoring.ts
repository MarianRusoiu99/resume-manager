import { AIService } from '../lib/services/ai.service';
import { EnhanceTextInput } from '../lib/ai/features/enhance';

async function testTailoring() {
  const aiService = new AIService();
  const userId = 'test-user'; 
  
  const input: EnhanceTextInput = {
    content: JSON.stringify({
      basics: { name: 'John Doe', label: 'Software Engineer' },
      work: [{ company: 'Tech Corp', position: 'Developer', summary: 'Built web apps.' }]
    }),
    instructions: 'Tailor this resume for a Senior Frontend Engineer role at Google focusing on React and TypeScript.',
    contentType: 'text',
    attachments: [
      {
        name: 'job-description.txt',
        type: 'text/plain',
        content: 'We are looking for a Senior Frontend Engineer with 5+ years of experience in React, TypeScript, and Next.js. Experience with performance optimization is a plus.'
      }
    ]
  };

  console.log('Starting enhancement test...');
  try {
    const result = await aiService.enhanceText(userId, input);
    if (result.success) {
      console.log('Enhancement successful!');
      console.log('Enhanced Content:', JSON.stringify(result.data.enhancedContent, null, 2));
    } else {
      console.error('Enhancement failed:', result.error);
    }
  } catch (error) {
    console.error('Error during test:', error);
  }
}

testTailoring();
