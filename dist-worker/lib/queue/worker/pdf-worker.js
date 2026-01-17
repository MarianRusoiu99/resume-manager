"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.createPdfWorker = createPdfWorker;
const bullmq_1 = require("bullmq");
const pdf_queue_1 = require("../pdf-queue");
const pdf_service_1 = require("../../services/pdf/pdf.service");
const logger_1 = require("../../utils/logger");
const emitter_1 = require("../../notifications/emitter");
const client_1 = require("@prisma/client");
function createPdfWorker() {
    const worker = new bullmq_1.Worker(pdf_queue_1.PDF_QUEUE_NAME, async (job) => {
        const { resumeId, userId } = job.data;
        logger_1.logger.info(`Starting PDF generation for resume ${resumeId}`, { job: job.id, userId });
        try {
            const { html } = job.data;
            const buffer = await pdf_service_1.pdfService.generateFromHtml(html);
            logger_1.logger.info(`Completed PDF generation for resume ${resumeId}`, { job: job.id });
            // Notify user via SSE/Redis PubSub
            await (0, emitter_1.emitNotification)(userId, {
                id: `pdf-${job.id}`,
                type: client_1.NotificationType.EXPORT_COMPLETE,
                title: 'PDF Ready',
                message: 'Your resume PDF has been generated successfully. You can now download it.',
                createdAt: new Date().toISOString(),
                metadata: {
                    jobId: job.id,
                    resumeId,
                    status: 'completed'
                }
            });
            return { success: true };
        }
        catch (error) {
            logger_1.logger.error(`PDF generation failed for job ${job.id}`, error);
            // Notify user of failure
            await (0, emitter_1.emitNotification)(userId, {
                id: `pdf-err-${job.id}`,
                type: client_1.NotificationType.SYSTEM,
                title: 'PDF Generation Failed',
                message: 'There was an error generating your resume PDF. Please try again.',
                createdAt: new Date().toISOString(),
                metadata: {
                    jobId: job.id,
                    resumeId,
                    status: 'failed'
                }
            });
            throw error;
        }
    }, {
        connection: pdf_queue_1.queueConnection,
        concurrency: 2,
    });
    worker.on('failed', (job, err) => {
        logger_1.logger.error(`Job ${job?.id} failed`, err);
    });
    return worker;
}
