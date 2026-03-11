import { Worker, Job } from 'bullmq';
import { env } from '../config/env';
import { analyzeText } from '../services/ai';
import { db } from '../db';
import { analyses, results } from '../db/schema';

/**
 * Analysis Worker
 * Processes batches of rows off-thread to avoid blocking the main API.
 */
export const startAnalysisWorker = () => {
    const worker = new Worker(
        'analysis-queue',
        async (job: Job) => {
            const { rows, userId, projectId } = job.data;
            const total = rows.length;

            console.log(`[Worker] Starting job ${job.id} with ${total} rows...`);

            const resultsList = [];
            for (let i = 0; i < total; i++) {
                const row = rows[i];

                try {
                    // 1. Call AI service for this specific row
                    const result = await analyzeText(row.text);

                    // 2. Persist result to database
                    const [record] = await db.insert(analyses).values({
                        inputText: row.text,
                        charCount: row.text.length,
                        source: 'batch',
                        userId: userId || null,
                        projectId: projectId || null,
                    }).returning({ id: analyses.id, createdAt: analyses.createdAt });

                    await db.insert(results).values({
                        analysisId: record.id,
                        score: result.score,
                        label: result.label,
                        confidence: result.confidence,
                        summary: result.summary,
                        emotions: result.emotions as any,
                        keywords: result.keywords as any,
                        sentences: result.sentences as any,
                    });

                    // Add to result list for the job return value
                    resultsList.push({
                        id: record.id,
                        inputText: row.text,
                        charCount: row.text.length,
                        source: 'batch',
                        createdAt: record.createdAt,
                        ...result
                    });

                } catch (err) {
                    console.error(`[Worker] Failed row ${i} in job ${job.id}:`, err);
                }

                // 3. Update progress (0 to 100)
                const progress = Math.round(((i + 1) / total) * 100);
                await job.updateProgress(progress);
            }

            console.log(`[Worker] Finished job ${job.id}.`);
            return resultsList;
        },
        {
            connection: {
                url: env.REDIS_URL,
                maxRetriesPerRequest: null,
            },
            concurrency: 2, // Process 2 rows at a time per worker instance
        }
    );

    worker.on('failed', (job, err) => {
        console.error(`[Worker] Job ${job?.id} failed with ${err.message}`);
    });

    return worker;
};
