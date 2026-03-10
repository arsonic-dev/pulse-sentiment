import { Router, Request, Response } from 'express';
import multer from 'multer';
import { parse } from 'csv-parse';
import { analysisQueue } from '../services/queue';
import { softAuth } from '../middleware/auth';
import { batchLimiter } from '../middleware/rateLimit';

const router = Router();
const upload = multer({
    storage: multer.memoryStorage(),
    limits: { fileSize: 5 * 1024 * 1024 } // 5MB limit
});

// POST /api/v1/analyze/batch — Submit CSV for offline processing
router.post('/', softAuth, batchLimiter, upload.single('file'), async (req: Request, res: Response) => {
    if (!req.file) {
        return res.status(400).json({
            error: 'MISSING_FILE',
            message: 'Please upload a CSV file.'
        });
    }

    try {
        const csvContent = req.file.buffer.toString('utf-8');

        // Validation: Parse CSV headers/rows to ensure it is valid before queuing
        parse(csvContent, {
            columns: true,
            skip_empty_lines: true,
            to: 51, // Limit trial batches (header + 50 rows)
        }, async (err, records: any[]) => {
            if (err) {
                return res.status(400).json({
                    error: 'INVALID_CSV',
                    message: 'Could not parse CSV. Ensure it has a header row.'
                });
            }

            if (records.length === 0) {
                return res.status(400).json({
                    error: 'EMPTY_FILE',
                    message: 'CSV file contains no data rows.'
                });
            }

            // Extract rows (we only need the "text" column)
            const rows = records.map((r, i) => ({
                id: r.id || `row-${i}`,
                text: r.text || r.content || r.message || '',
            })).filter(r => r.text.length > 5);

            if (rows.length === 0) {
                return res.status(400).json({
                    error: 'INVALID_DATA',
                    message: 'No valid text found in rows. Ensure you have a "text" column.'
                });
            }

            // Create background job
            const job = await analysisQueue.add('batch-process', {
                rows,
                userId: req.userId,
                projectId: req.body.projectId || null,
                fileName: req.file?.originalname,
            });

            return res.status(202).json({
                data: {
                    jobId: job.id,
                    rowCount: rows.length,
                    status: 'queued',
                },
                message: 'Batch processing started. You can track progress in the dashboard.'
            });
        });
    } catch (err: unknown) {
        console.error('[Batch Route] Error:', err);
        return res.status(500).json({
            error: 'BATCH_ERROR',
            message: 'Failed to initiate batch processing.'
        });
    }
});

// GET /api/v1/analyze/batch/:id — Check status
router.get('/:id', softAuth, async (req: Request, res: Response) => {
    const job = await analysisQueue.getJob(req.params.id);

    if (!job) {
        return res.status(404).json({ error: 'JOB_NOT_FOUND', message: 'The batch job does not exist.' });
    }

    const state = await job.getState();
    const progress = job.progress;

    return res.json({
        data: {
            id: job.id,
            status: state,
            progress: typeof progress === 'number' ? progress : 0,
            failedReason: job.failedReason,
            finishedOn: job.finishedOn,
        }
    });
});

export default router;
