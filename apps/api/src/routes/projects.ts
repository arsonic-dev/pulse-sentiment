import { Router, Request, Response } from 'express';
import { db } from '../db';
import { projects, analyses, results } from '../db/schema';
import { requireAuth } from '../middleware/auth';
import { validate, projectSchema } from '../middleware/validate';
import { eq, desc, and, count, avg } from 'drizzle-orm';

const router = Router();

// GET /api/v1/projects
router.get('/', requireAuth, async (req: Request, res: Response) => {
    try {
        const rows = await db
            .select()
            .from(projects)
            .where(eq(projects.userId, req.userId!))
            .orderBy(desc(projects.createdAt));
        return res.json({ data: rows });
    } catch (err: any) {
        return res.status(500).json({ error: 'FETCH_FAILED', message: err.message });
    }
});

// POST /api/v1/projects
router.post('/', requireAuth, validate(projectSchema), async (req: Request, res: Response) => {
    const { name, description } = req.body;
    try {
        const [row] = await db
            .insert(projects)
            .values({ userId: req.userId!, name, description })
            .returning();
        return res.status(201).json({ data: row });
    } catch (err: unknown) {
        const msg = err instanceof Error ? err.message : 'Unknown error';
        return res.status(500).json({ error: 'CREATE_FAILED', message: msg });
    }
});

// PATCH /api/v1/projects/:id
router.patch('/:id', requireAuth, validate(projectSchema.partial()), async (req: Request, res: Response) => {
    const { name, description } = req.body;
    try {
        const [row] = await db
            .update(projects)
            .set({ ...(name && { name }), ...(description !== undefined && { description }) })
            .where(and(eq(projects.id, req.params.id), eq(projects.userId, req.userId!)))
            .returning();
        if (!row) return res.status(404).json({ error: 'NOT_FOUND' });
        return res.json({ data: row });
    } catch (err: unknown) {
        const msg = err instanceof Error ? err.message : 'Unknown error';
        return res.status(500).json({ error: 'UPDATE_FAILED', message: msg });
    }
});

// DELETE /api/v1/projects/:id
router.delete('/:id', requireAuth, async (req: Request, res: Response) => {
    try {
        const deleted = await db
            .delete(projects)
            .where(and(eq(projects.id, req.params.id), eq(projects.userId, req.userId!)))
            .returning({ id: projects.id });
        if (!deleted.length) return res.status(404).json({ error: 'NOT_FOUND' });
        return res.json({ data: { deleted: true } });
    } catch (err: any) {
        return res.status(500).json({ error: 'DELETE_FAILED', message: err.message });
    }
});

// GET /api/v1/projects/:id/analyses — analyses within a project
router.get('/:id/analyses', requireAuth, async (req: Request, res: Response) => {
    const limit = Math.min(50, parseInt(req.query.limit as string) || 20);
    const page = Math.max(1, parseInt(req.query.page as string) || 1);

    try {
        const rows = await db
            .select({
                id: analyses.id,
                inputText: analyses.inputText,
                charCount: analyses.charCount,
                createdAt: analyses.createdAt,
                score: results.score,
                label: results.label,
                summary: results.summary,
            })
            .from(analyses)
            .leftJoin(results, eq(results.analysisId, analyses.id))
            .where(and(
                eq(analyses.projectId, req.params.id),
                eq(analyses.userId, req.userId!),
            ))
            .orderBy(desc(analyses.createdAt))
            .limit(limit)
            .offset((page - 1) * limit);

        return res.json({ data: rows });
    } catch (err: any) {
        return res.status(500).json({ error: 'FETCH_FAILED', message: err.message });
    }
});

export default router;
