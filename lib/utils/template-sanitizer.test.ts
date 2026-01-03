import { describe, expect, it } from 'vitest';
import { sanitizeTemplateHtml } from '../templates/utils/sanitizer';

describe('template-sanitizer', () => {
  it('removes <script> tags', () => {
    const input = '<div>ok</div><script>alert(1)</script><div>after</div>';
    const output = sanitizeTemplateHtml(input);
    expect(output).toContain('<div>ok</div>');
    expect(output).toContain('<div>after</div>');
    expect(output).not.toMatch(/<script/i);
  });

  it('removes inline event handlers', () => {
    const input = '<img src="x" onerror="alert(1)" /><div onclick="doBad()">x</div>';
    const output = sanitizeTemplateHtml(input);
    expect(output).toContain('src="x"');
    expect(output).not.toMatch(/onerror\s*=/i);
    expect(output).not.toMatch(/onclick\s*=/i);
  });

  it('neutralizes javascript: href/src', () => {
    const input = '<a href="javascript:alert(1)">x</a><img src="javascript:alert(2)" />';
    const output = sanitizeTemplateHtml(input);
    expect(output).toContain('href="#"');
    expect(output).toContain('src="#"');
  });

  it('strips iframes', () => {
    const input = '<iframe src="https://example.com"></iframe><div>ok</div>';
    const output = sanitizeTemplateHtml(input);
    expect(output).toContain('<div>ok</div>');
    expect(output).not.toMatch(/<iframe/i);
  });
});
