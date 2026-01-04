import { z } from 'zod';

export const commonSchemas = {
  name: (required = true) => 
    z.string().min(required ? 1 : 0).max(100),
  description: () => 
    z.string().max(500).optional(),
  instructions: () => 
    z.string().max(1000).optional(),
  email: () => 
    z.string().email(),
  url: () => 
    z.string().url().optional(),
};
