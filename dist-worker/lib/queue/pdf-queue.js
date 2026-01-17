"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.PDF_QUEUE_NAME = exports.queueConnection = void 0;
exports.getPdfQueue = getPdfQueue;
const bullmq_1 = require("bullmq");
const connection_1 = require("../redis/connection");
const redisUrl = process.env.REDIS_URL || 'redis://localhost:6379';
exports.queueConnection = {
    ...(0, connection_1.getRedisConfig)({ url: redisUrl }),
    // BullMQ requires this for its internal lua scripts
    maxRetriesPerRequest: null,
};
exports.PDF_QUEUE_NAME = 'pdf-generation';
// Global queue instance
let pdfQueue;
function getPdfQueue() {
    if (!pdfQueue) {
        pdfQueue = new bullmq_1.Queue(exports.PDF_QUEUE_NAME, {
            connection: exports.queueConnection,
            defaultJobOptions: {
                attempts: 3,
                backoff: {
                    type: 'exponential',
                    delay: 1000,
                },
                removeOnComplete: true,
            },
        });
    }
    return pdfQueue;
}
