import puppeteer, { type PDFOptions, type Browser, type Page, type HTTPRequest } from 'puppeteer';
import type { LaunchOptions } from 'puppeteer-core';
import { ServiceErrors } from '../utils/service-wrapper';
import { logger } from '../../utils/logger';

export interface PdfServiceConfig {
  puppeteerArgs?: string[];
  timeout?: number;
  executablePath?: string;
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
  private browser: Browser | null = null;
  private browserPromise: Promise<Browser> | null = null;

  constructor(config: PdfServiceConfig = {}) {
    const executablePath = process.env.PUPPETEER_EXECUTABLE_PATH || config.executablePath;
    
    this.config = {
      puppeteerArgs: config.puppeteerArgs || [
        '--no-sandbox', 
        '--disable-setuid-sandbox', 
        '--disable-dev-shm-usage',
        '--font-render-hinting=none',
      ],
      timeout: config.timeout || 30000,
      executablePath,
    };

    if (executablePath) {
      logger.info(`Using Puppeteer executable path: ${executablePath}`);
    }
  }

  private async getBrowser(): Promise<Browser> {
    if (this.browserPromise) return this.browserPromise;

    this.browserPromise = (async () => {
      try {
        const launchOptions: LaunchOptions = {
          headless: true,
          args: this.config.puppeteerArgs,
        };

        if (this.config.executablePath) {
          launchOptions.executablePath = this.config.executablePath;
        }

        const browser = await puppeteer.launch(launchOptions);

        browser.on('disconnected', () => {
          logger.warn('Puppeteer browser disconnected, resetting...');
          this.browser = null;
          this.browserPromise = null;
        });

        this.browser = browser;
        return browser;
      } catch (error) {
        this.browserPromise = null;
        logger.error('Failed to launch Puppeteer browser', error);
        throw error;
      }
    })();

    return this.browserPromise;
  }

  /**
   * Generates a PDF from HTML content
   */
  async generateFromHtml(html: string, options: PDFOptions = DEFAULT_PDF_CONFIG): Promise<Buffer> {
    let page: Page | null = null;

    try {
      const browser = await this.getBrowser();
      page = await browser.newPage();

      // Security: Block all network requests except data URIs and about:blank
      await page.setRequestInterception(true);
      page.on('request', (req: HTTPRequest) => {
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
      logger.error('PDF generation failed', error);
      
      // If the browser crashed or is invalid, reset it
      if (error instanceof Error && (error.message.includes('Browser closed') || error.message.includes('Connection closed'))) {
        this.browser = null;
        this.browserPromise = null;
      }

      throw ServiceErrors.externalService('Failed to generate PDF', error);
    } finally {
      if (page) {
        await page.close().catch(() => {});
      }
    }
  }

  /**
   * Gracefully shuts down the browser instance
   */
  async shutdown(): Promise<void> {
    if (this.browser) {
      await this.browser.close().catch(() => {});
      this.browser = null;
      this.browserPromise = null;
    }
  }
}

export const pdfService = new PdfService();
