/**
 * Shared JSON Response Instructions
 * 
 * Reusable instructions for ensuring proper JSON responses from AI agents
 */

export const JSON_RESPONSE_INSTRUCTIONS = `**CRITICAL JSON FORMATTING RULES:**

1. Return ONLY valid JSON - no markdown, no explanations, no additional text
2. If using markdown code blocks, use exactly: \`\`\`json and \`\`\`
3. Ensure all strings are properly escaped
4. Do not include comments in JSON
5. Use double quotes for all keys and string values
6. Ensure all brackets and braces are properly closed
7. Arrays should contain consistent types
8. Null values should be explicitly null, not undefined or empty strings`;

export const JSON_PARSING_HINT = `
Example valid response:
\`\`\`json
{
  "field1": "value",
  "field2": ["item1", "item2"],
  "field3": null
}
\`\`\``;

/**
 * Append JSON instructions to any prompt
 */
export function withJsonInstructions(prompt: string): string {
  return `${prompt}\n\n${JSON_RESPONSE_INSTRUCTIONS}`;
}
