import { Queue } from 'bullmq';
import { env } from '../config/env';

// ── Analysis Queue ──────────────────────────────────────────────────────────
// This handles long-running batch processing jobs.
// It uses Redis to store job data and manage workers.

export const analysisQueue = new Queue('analysis-queue', {
    connection: {
        url: env.REDIS_URL,
        // BullMQ requires more stable connections
        maxRetriesPerRequest: null,
    },
    defaultJobOptions: {
        attempts: 2,
        backoff: {
            type: 'exponential',
            delay: 1000,
        },
        removeOnComplete: {
            age: 3600, // Keep for 1 hour
            count: 1000, // or last 1000
        },
        removeOnFail: false,
    },
});
