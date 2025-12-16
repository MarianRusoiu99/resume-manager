export function validateHandlebarsTemplateSyntax(htmlTemplate: string): {
  valid: boolean;
  errors: string[];
} {
  const errors: string[] = [];

  const openTags = htmlTemplate.match(/{{\s*#/g)?.length || 0;
  const closeTags = htmlTemplate.match(/{{\s*\//g)?.length || 0;

  if (openTags !== closeTags) {
    errors.push('Mismatched Handlebars block helpers (# and /)');
  }

  if (!htmlTemplate.includes('<html') && !htmlTemplate.includes('<!DOCTYPE')) {
    errors.push('Template should include HTML structure');
  }

  const requiredPlaceholders = ['{{basics.name}}', '{{basics.email}}'];
  for (const placeholder of requiredPlaceholders) {
    if (!htmlTemplate.includes(placeholder)) {
      errors.push(`Missing required placeholder: ${placeholder}`);
    }
  }

  return {
    valid: errors.length === 0,
    errors,
  };
}
