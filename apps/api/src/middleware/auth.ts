import { Request, Response, NextFunction } from 'express';
import { verifyToken } from '@clerk/backend';
import { db } from '../db';
import { users } from '../db/schema';
import { eq } from 'drizzle-orm';

declare global {
    namespace Express {
        interface Request {
            userId?: string;
            userPlan?: string;
        }
    }
}

const CLERK_SECRET_KEY = process.env.CLERK_SECRET_KEY!;

export async function requireAuth(req: Request, res: Response, next: NextFunction) {
    try {
        const token = req.headers.authorization?.replace('Bearer ', '');
        if (!token) {
            return res.status(401).json({ error: 'UNAUTHORIZED', message: 'Missing auth token.' });
        }

        const payload = await verifyToken(token, { secretKey: CLERK_SECRET_KEY });
        req.userId = payload.sub;

        const rows = await db.select({ plan: users.plan }).from(users).where(eq(users.id, payload.sub)).limit(1);
        req.userPlan = rows[0]?.plan ?? 'free';

        next();
    } catch (err: any) {
        return res.status(401).json({ error: 'UNAUTHORIZED', message: 'Invalid or expired token.' });
    }
}

export async function softAuth(req: Request, res: Response, next: NextFunction) {
    try {
        const token = req.headers.authorization?.replace('Bearer ', '');
        if (token) {
            const payload = await verifyToken(token, { secretKey: CLERK_SECRET_KEY });
            req.userId = payload.sub;
        }
    } catch {
        // Ignore — anonymous request
    }
    next();
}
