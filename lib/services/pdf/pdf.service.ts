import puppeteer, { type PDFOptions, type Browser } from 'puppeteer';
import { ServiceErrors } from '../utils/service-wrapper';

export interface PdfServiceConfig {
  puppeteerArgs?: string[];
  timeout?: number;
}

export const DEFAULT_PDF_CONFIG: PDFOptions = {
  format: 'A4',
  printBackground: true,
  margin: {
    top: '0.4in',
    right: '0.4in',
    bottom: '0.4in',
    left: '0.4in',
  },
};

export class PdfService {
  private config: PdfServiceConfig;

  constructor(config: PdfServiceConfig = {}) {
    this.config = {
      puppeteerArgs: config.puppeteerArgs || ['--no-sandbox', '--disable-setuid-sandbox', '--disable-dev-shm-usage'],
      timeout: config.timeout || 30000,
    };
  }

  /**
   * Generates a PDF from HTML content
   */
  async generateFromHtml(html: string, options: PDFOptions = DEFAULT_PDF_CONFIG): Promise<Buffer> {
    let browser: Browser | null = null;

    try {
      browser = await puppeteer.launch({
        headless: true,
        args: this.config.puppeteerArgs,
      });

      const page = await browser.newPage();

      // Security: Block all network requests except data URIs and about:blank
      await page.setRequestInterception(true);
      page.on('request', (req) => {
        const url = req.url();
        if (url.startsWith('data:') || url.startsWith('about:')) {
          req.continue();
        } else {
          req.abort();
        }
      });

      await page.setContent(html, {
        waitUntil: 'networkidle0',
        timeout: this.config.timeout,
      });

      // Emulate screen/print media if necessary
      await page.emulateMediaType('print');

      const pdfBuffer = await page.pdf(options);
      return Buffer.from(pdfBuffer);
    } catch (error) {
      console.error('PDF Generation Error:', error);
      throw ServiceErrors.externalService('Failed to generate PDF', error);
    } finally {
      if (browser) {
        await browser.close().catch(() => {});
      }
    }
  }
}

export const pdfService = new PdfService();
