"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.pdfService = exports.PdfService = exports.DEFAULT_PDF_CONFIG = void 0;
const puppeteer_1 = __importDefault(require("puppeteer"));
const service_wrapper_1 = require("../utils/service-wrapper");
const logger_1 = require("../../utils/logger");
exports.DEFAULT_PDF_CONFIG = {
    format: 'A4',
    printBackground: true,
    margin: {
        top: '0.4in',
        right: '0.4in',
        bottom: '0.4in',
        left: '0.4in',
    },
};
class PdfService {
    constructor(config = {}) {
        this.browser = null;
        this.browserPromise = null;
        this.config = {
            puppeteerArgs: config.puppeteerArgs || ['--no-sandbox', '--disable-setuid-sandbox', '--disable-dev-shm-usage'],
            timeout: config.timeout || 30000,
        };
    }
    async getBrowser() {
        if (this.browserPromise)
            return this.browserPromise;
        this.browserPromise = (async () => {
            try {
                const browser = await puppeteer_1.default.launch({
                    headless: true,
                    args: this.config.puppeteerArgs,
                });
                browser.on('disconnected', () => {
                    logger_1.logger.warn('Puppeteer browser disconnected, resetting...');
                    this.browser = null;
                    this.browserPromise = null;
                });
                this.browser = browser;
                return browser;
            }
            catch (error) {
                this.browserPromise = null;
                logger_1.logger.error('Failed to launch Puppeteer browser', error);
                throw error;
            }
        })();
        return this.browserPromise;
    }
    /**
     * Generates a PDF from HTML content
     */
    async generateFromHtml(html, options = exports.DEFAULT_PDF_CONFIG) {
        let page = null;
        try {
            const browser = await this.getBrowser();
            page = await browser.newPage();
            // Security: Block all network requests except data URIs and about:blank
            await page.setRequestInterception(true);
            page.on('request', (req) => {
                const url = req.url();
                if (url.startsWith('data:') || url.startsWith('about:')) {
                    req.continue();
                }
                else {
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
        }
        catch (error) {
            logger_1.logger.error('PDF generation failed', error);
            // If the browser crashed or is invalid, reset it
            if (error instanceof Error && (error.message.includes('Browser closed') || error.message.includes('Connection closed'))) {
                this.browser = null;
                this.browserPromise = null;
            }
            throw service_wrapper_1.ServiceErrors.externalService('Failed to generate PDF', error);
        }
        finally {
            if (page) {
                await page.close().catch(() => { });
            }
        }
    }
    /**
     * Gracefully shuts down the browser instance
     */
    async shutdown() {
        if (this.browser) {
            await this.browser.close().catch(() => { });
            this.browser = null;
            this.browserPromise = null;
        }
    }
}
exports.PdfService = PdfService;
exports.pdfService = new PdfService();
