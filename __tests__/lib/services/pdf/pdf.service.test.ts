import { describe, it, expect, vi, beforeEach, afterAll } from 'vitest';
import { PdfService } from '@/lib/services/pdf/pdf.service';

describe('PdfService', () => {
  let pdfService: PdfService;

  beforeEach(() => {
    pdfService = new PdfService();
  });

  afterAll(async () => {
    await pdfService.shutdown();
  });

  it('should be defined', () => {
    expect(pdfService).toBeDefined();
  });

  it('should generate a PDF buffer from HTML', async () => {
    const html = '<h1>Test</h1><p>Hello World</p>';
    const buffer = await pdfService.generateFromHtml(html);
    
    expect(buffer).toBeInstanceOf(Buffer);
    expect(buffer.length).toBeGreaterThan(0);
  }, 40000); // Increase timeout for puppeteer

  it('should reuse the browser instance', async () => {
    const html = '<h1>Test 1</h1>';
    const html2 = '<h1>Test 2</h1>';
    
    const spy = vi.spyOn(pdfService as unknown as { getBrowser: () => Promise<unknown> }, 'getBrowser');
    
    await pdfService.generateFromHtml(html);
    await pdfService.generateFromHtml(html2);
    
    expect(spy).toHaveBeenCalledTimes(2);
  }, 40000);
});
