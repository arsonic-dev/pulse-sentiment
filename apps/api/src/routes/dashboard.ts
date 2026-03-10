import { Router, Request, Response } from 'express';
import { db } from '../db';
import { analyses, results, users } from '../db/schema';
import { requireAuth } from '../middleware/auth';
import { eq, desc, and, count, avg, gte, sql } from 'drizzle-orm';

const router = Router();

// GET /api/v1/dashboard/stats
router.get('/stats', requireAuth, async (req: Request, res: Response) => {
    try {
        const userId = req.userId!;

        // Total analyses for this user
        const [{ total }] = await db
            .select({ total: count() })
            .from(analyses)
            .where(eq(analyses.userId, userId));

        // Average score
        const [{ avgScore }] = await db
            .select({ avgScore: avg(results.score) })
            .from(results)
            .leftJoin(analyses, eq(analyses.id, results.analysisId))
            .where(eq(analyses.userId, userId));

        // Analyses today
        const today = new Date();
        today.setHours(0, 0, 0, 0);
        const [{ usageToday }] = await db
            .select({ usageToday: count() })
            .from(analyses)
            .where(and(eq(analyses.userId, userId), gte(analyses.createdAt, today)));

        // Last 5 analyses for recent list
        const recentRows = await db
            .select({
                id: analyses.id,
                inputText: analyses.inputText,
                createdAt: analyses.createdAt,
                score: results.score,
                label: results.label,
                summary: results.summary,
            })
            .from(analyses)
            .leftJoin(results, eq(results.analysisId, analyses.id))
            .where(eq(analyses.userId, userId))
            .orderBy(desc(analyses.createdAt))
            .limit(5);

        // Score distribution for trend (last 14 analyses)
        const trendRows = await db
            .select({
                score: results.score,
                createdAt: analyses.createdAt,
            })
            .from(analyses)
            .leftJoin(results, eq(results.analysisId, analyses.id))
            .where(eq(analyses.userId, userId))
            .orderBy(desc(analyses.createdAt))
            .limit(14);

        // Top emotion across all analyses
        const emotionRows = await db
            .select({ emotions: results.emotions })
            .from(results)
            .leftJoin(analyses, eq(analyses.id, results.analysisId))
            .where(eq(analyses.userId, userId))
            .limit(50);

        const emotionTotals: Record<string, number> = {};
        emotionRows.forEach(r => {
            if (r.emotions && typeof r.emotions === 'object') {
                Object.entries(r.emotions as Record<string, number>).forEach(([k, v]) => {
                    emotionTotals[k] = (emotionTotals[k] || 0) + v;
                });
            }
        });
        const topEmotion = Object.entries(emotionTotals).sort((a, b) => b[1] - a[1])[0]?.[0] ?? 'joy';

        return res.json({
            data: {
                totalAnalyses: Number(total),
                avgScore: Math.round(Number(avgScore) || 0),
                usageToday: Number(usageToday),
                topEmotion,
                recentAnalyses: recentRows,
                trendData: trendRows.reverse().map(r => r.score ?? 50),
            },
        });
    } catch (err: any) {
        console.error('Dashboard stats error:', err);
        return res.status(500).json({ error: 'STATS_FAILED', message: err.message });
    }
});

export default router;
