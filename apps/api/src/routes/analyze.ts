import { Router, Request, Response } from 'express';
import { db } from '../db';
import { analyses, results } from '../db/schema';
import { analyzeText } from '../services/ai';
import { softAuth } from '../middleware/auth';
import { validate, analyzeSchema } from '../middleware/validate';
import { eq, desc } from 'drizzle-orm';

const router = Router();

// POST /api/v1/analyze — single text analysis
// validate(analyzeSchema) guarantees: text (10–5000 chars, trimmed), optional projectId (UUID)
router.post('/', softAuth, validate(analyzeSchema), async (req: Request, res: Response) => {
    const { text, projectId } = req.body as { text: string; projectId?: string };

    try {
        const analysisResult = await analyzeText(text);

        const [analysisRecord] = await db.insert(analyses)
            .values({
                inputText: text,
                charCount: text.length,
                source: 'dashboard',
                userId: req.userId ?? null,
                projectId: projectId ?? null,
            })
            .returning({ id: analyses.id });

        await db.insert(results).values({
            analysisId: analysisRecord.id,
            score: analysisResult.score,
            confidence: analysisResult.confidence,
            label: analysisResult.label,
            summary: analysisResult.summary,
            emotions: analysisResult.emotions as unknown as Record<string, number>,
            keywords: analysisResult.keywords as unknown as string[],
            sentences: analysisResult.sentences as unknown as { text: string; label: string; score: number }[],
            tokensUsed: 0,
        });

        return res.status(200).json({
            data: { id: analysisRecord.id, ...analysisResult },
            meta: { fromCache: analysisResult.fromCache || false },
        });
    } catch (err: unknown) {
        const msg = err instanceof Error ? err.message : 'Analysis failed';
        console.error('[Analyze Route]', err);
        return res.status(500).json({ error: 'ANALYSIS_FAILED', message: msg });
    }
});

export default router;
