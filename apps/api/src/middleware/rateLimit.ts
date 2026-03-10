import { Request, Response, NextFunction } from 'express';
import { redis } from '../services/cache';

// ── Rate limit factory ────────────────────────────────────────────────────────
interface RateLimitOptions {
    windowMs: number;  // window size in milliseconds
    max: number;  // max requests per window
    keyPrefix: string;  // e.g. "rl:analyze"
}

export const rateLimit = ({ windowMs, max, keyPrefix }: RateLimitOptions) =>
    async (req: Request, res: Response, next: NextFunction) => {
        // Identity: authenticated userId takes priority over IP
        const identity = req.userId ?? req.ip ?? 'anon';
        const windowBucket = Math.floor(Date.now() / windowMs);
        const key = `${keyPrefix}:${identity}:${windowBucket}`;

        try {
            const current = await redis.incr(key);

            // Set TTL only on the first increment (avoids race conditions)
            if (current === 1) {
                await redis.pexpire(key, windowMs);
            }

            const remaining = Math.max(0, max - current);
            const resetAt = (windowBucket + 1) * windowMs;

            res.setHeader('X-RateLimit-Limit', max);
            res.setHeader('X-RateLimit-Remaining', remaining);
            res.setHeader('X-RateLimit-Reset', Math.ceil(resetAt / 1000));

            if (current > max) {
                const retryAfter = Math.ceil((resetAt - Date.now()) / 1000);
                res.setHeader('Retry-After', retryAfter);
                return res.status(429).json({
                    error: 'RATE_LIMIT_EXCEEDED',
                    code: 'RATE_LIMIT_EXCEEDED',
                    status: 429,
                    retryAfter,
                    message: 'Too many requests. Please slow down.',
                });
            }
        } catch (redisErr) {
            // Redis failure → FAIL OPEN on rate limiting only
            // Never let a Redis outage take down the API
            console.error('[RateLimit] Redis error — failing open:', redisErr);
        }

        return next();
    };

// ── Pre-configured limiters ───────────────────────────────────────────────────
export const generalLimiter = rateLimit({
    windowMs: 60 * 1000,        // 1 minute
    max: 60,
    keyPrefix: 'rl:general',
});

export const analyzeLimiter = rateLimit({
    windowMs: 60 * 1000,        // 1 minute
    max: 10,
    keyPrefix: 'rl:analyze',
});

export const batchLimiter = rateLimit({
    windowMs: 60 * 60 * 1000,   // 1 hour
    max: 5,
    keyPrefix: 'rl:batch',
});

export const authLimiter = rateLimit({
    windowMs: 15 * 60 * 1000,   // 15 minutes
    max: 10,
    keyPrefix: 'rl:auth',
});

export const apiKeyLimiter = rateLimit({
    windowMs: 60 * 1000,        // 1 minute
    max: 30,
    keyPrefix: 'rl:apikey',
});
