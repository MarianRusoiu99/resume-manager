/**
 * Parse template enhancement response (HTML)
 */
export function parseTemplateResponse(content: string): { html: string } {
  return {
    html: content.trim(),
  };
}

/**
 * Parse enhanced resume JSON from AI response
 */
export function parseResumeJson<T>(content: string): T {
  let cleaned = content.trim();

  const startBracket = cleaned.indexOf('{');
  const endBracket = cleaned.lastIndexOf('}');

  if (startBracket !== -1 && endBracket !== -1 && endBracket > startBracket) {
    cleaned = cleaned.substring(startBracket, endBracket + 1);
  } else if (cleaned.startsWith('```')) {
    cleaned = cleaned.replace(/^```(?:json)?\n?/, '').replace(/\n?```$/, '').trim();
  }

  try {
    const parsed = JSON.parse(cleaned);
    if (parsed && typeof parsed === 'object' && 'resume' in parsed) {
      return parsed.resume as T;
    }
    return parsed as T;
  } catch (e) {
    console.error('Parse error content:', cleaned);
    throw e;
  }
}
