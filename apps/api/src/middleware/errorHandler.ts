import { Request, Response, NextFunction } from 'express';
import { env } from '../config/env';

// ── Code → HTTP status mapping ───────────────────────────────────────────────
const STATUS_MAP: Record<string, number> = {
    VALIDATION_ERROR: 400,
    UNAUTHORIZED: 401,
    CORS_BLOCKED: 403,
    PLAN_LIMIT: 403,
    NOT_FOUND: 404,
    RATE_LIMIT_EXCEEDED: 429,
    QUOTA_EXCEEDED: 429,
    FILE_TYPE_INVALID: 400,
    AI_UNAVAILABLE: 503,
};

interface AppError extends Error {
    code?: string;
    status?: number;
    details?: unknown;
}

// ── Global error handler (must be registered LAST) ───────────────────────────
export const errorHandler = (
    err: AppError,
    _req: Request,
    res: Response,
    _next: NextFunction,
) => {
    // Always log full error internally
    console.error('[PULSE ERROR]', {
        code: err.code,
        message: err.message,
        stack: env.NODE_ENV !== 'production' ? err.stack : undefined,
    });

    const code = err.code ?? 'INTERNAL_ERROR';
    const status = err.status ?? STATUS_MAP[code] ?? 500;

    const body: Record<string, unknown> = { error: code, code, status };

    // Never expose stack traces or internal messages in production
    if (env.NODE_ENV !== 'production') {
        body.message = err.message;
        if (err.details) body.details = err.details;
    }

    return res.status(status).json(body);
};

// ── 404 handler (must be registered AFTER all routes, BEFORE errorHandler) ───
export const notFoundHandler = (_req: Request, res: Response) => {
    return res.status(404).json({
        error: 'NOT_FOUND',
        code: 'NOT_FOUND',
        status: 404,
    });
};
