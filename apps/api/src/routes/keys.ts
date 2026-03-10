import { Router, Request, Response } from 'express';
import { db } from '../db';
import { apiKeys } from '../db/schema';
import { requireAuth } from '../middleware/auth';
import { validate, apiKeySchema } from '../middleware/validate';
import { eq, and } from 'drizzle-orm';
import { createHash, randomBytes } from 'crypto';

const router = Router();

function generateKey(): { raw: string; hash: string; prefix: string } {
    const raw = 'pk_live_' + randomBytes(24).toString('hex');
    const hash = createHash('sha256').update(raw).digest('hex');
    const prefix = raw.slice(0, 16); // "pk_live_" + 8 chars
    return { raw, hash, prefix };
}

// GET /api/v1/keys — list keys (never return hash or full key)
router.get('/', requireAuth, async (req: Request, res: Response) => {
    try {
        const rows = await db
            .select({
                id: apiKeys.id,
                name: apiKeys.name,
                keyPrefix: apiKeys.keyPrefix,
                callsToday: apiKeys.callsToday,
                lastUsed: apiKeys.lastUsed,
                createdAt: apiKeys.createdAt,
            })
            .from(apiKeys)
            .where(eq(apiKeys.userId, req.userId!));

        return res.json({ data: rows });
    } catch (err: any) {
        return res.status(500).json({ error: 'FETCH_FAILED', message: err.message });
    }
});

// POST /api/v1/keys — generate a new key
router.post('/', requireAuth, validate(apiKeySchema), async (req: Request, res: Response) => {
    const { name } = req.body;

    // Limit: 5 keys per user (free plan)
    const existing = await db.select({ id: apiKeys.id }).from(apiKeys).where(eq(apiKeys.userId, req.userId!));
    if (existing.length >= 5) {
        return res.status(403).json({ error: 'LIMIT_REACHED', message: 'Maximum 5 API keys per account. Delete one to add another.' });
    }

    const { raw, hash, prefix } = generateKey();

    try {
        const [row] = await db.insert(apiKeys).values({
            userId: req.userId!,
            name: name.trim(),
            keyHash: hash,
            keyPrefix: prefix,
        }).returning({
            id: apiKeys.id,
            name: apiKeys.name,
            keyPrefix: apiKeys.keyPrefix,
            createdAt: apiKeys.createdAt,
        });

        // Return the raw key ONCE — never stored, never retrievable again
        return res.status(201).json({
            data: { ...row, rawKey: raw },
            meta: { warning: 'Save this key now. It will never be shown again.' },
        });
    } catch (err: any) {
        return res.status(500).json({ error: 'CREATE_FAILED', message: err.message });
    }
});

// DELETE /api/v1/keys/:id — revoke a key
router.delete('/:id', requireAuth, async (req: Request, res: Response) => {
    try {
        const deleted = await db
            .delete(apiKeys)
            .where(and(eq(apiKeys.id, req.params.id), eq(apiKeys.userId, req.userId!)))
            .returning({ id: apiKeys.id });

        if (!deleted.length) return res.status(404).json({ error: 'NOT_FOUND' });
        return res.json({ data: { deleted: true } });
    } catch (err: any) {
        return res.status(500).json({ error: 'DELETE_FAILED', message: err.message });
    }
});

export default router;
