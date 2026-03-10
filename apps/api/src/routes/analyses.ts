import { Router, Request, Response } from 'express';
import { db } from '../db';
import { analyses, results } from '../db/schema';
import { requireAuth } from '../middleware/auth';
import { eq, desc, and, count, avg, sql } from 'drizzle-orm';

const router = Router();

// GET /api/v1/analyses — paginated history for logged-in user
router.get('/', requireAuth, async (req: Request, res: Response) => {
    const page = Math.max(1, parseInt(req.query.page as string) || 1);
    const limit = Math.min(50, parseInt(req.query.limit as string) || 20);
    const offset = (page - 1) * limit;
    const projectId = req.query.projectId as string | undefined;

    try {
        const conditions = [eq(analyses.userId, req.userId!)];
        if (projectId) conditions.push(eq(analyses.projectId, projectId));

        const rows = await db
            .select({
                id: analyses.id,
                inputText: analyses.inputText,
                charCount: analyses.charCount,
                source: analyses.source,
                createdAt: analyses.createdAt,
                score: results.score,
                label: results.label,
                confidence: results.confidence,
                summary: results.summary,
                emotions: results.emotions,
                keywords: results.keywords,
                sentences: results.sentences,
                resultId: results.id,
            })
            .from(analyses)
            .leftJoin(results, eq(results.analysisId, analyses.id))
            .where(and(...conditions))
            .orderBy(desc(analyses.createdAt))
            .limit(limit)
            .offset(offset);

        const [{ total }] = await db
            .select({ total: count() })
            .from(analyses)
            .where(and(...conditions));

        return res.json({
            data: rows,
            meta: { page, limit, total: Number(total), pages: Math.ceil(Number(total) / limit) },
        });
    } catch (err: any) {
        return res.status(500).json({ error: 'FETCH_FAILED', message: err.message });
    }
});

// GET /api/v1/analyses/:id — single analysis detail
router.get('/:id', requireAuth, async (req: Request, res: Response) => {
    try {
        const [row] = await db
            .select({
                id: analyses.id,
                inputText: analyses.inputText,
                charCount: analyses.charCount,
                source: analyses.source,
                createdAt: analyses.createdAt,
                score: results.score,
                label: results.label,
                confidence: results.confidence,
                summary: results.summary,
                emotions: results.emotions,
                keywords: results.keywords,
                sentences: results.sentences,
            })
            .from(analyses)
            .leftJoin(results, eq(results.analysisId, analyses.id))
            .where(and(eq(analyses.id, req.params.id), eq(analyses.userId, req.userId!)))
            .limit(1);

        if (!row) return res.status(404).json({ error: 'NOT_FOUND', message: 'Analysis not found.' });
        return res.json({ data: row });
    } catch (err: any) {
        return res.status(500).json({ error: 'FETCH_FAILED', message: err.message });
    }
});

// DELETE /api/v1/analyses/:id
router.delete('/:id', requireAuth, async (req: Request, res: Response) => {
    try {
        const deleted = await db
            .delete(analyses)
            .where(and(eq(analyses.id, req.params.id), eq(analyses.userId, req.userId!)))
            .returning({ id: analyses.id });

        if (!deleted.length) return res.status(404).json({ error: 'NOT_FOUND' });
        return res.json({ data: { deleted: true } });
    } catch (err: any) {
        return res.status(500).json({ error: 'DELETE_FAILED', message: err.message });
    }
});

export default router;
