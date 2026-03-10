import helmet from 'helmet';
import cors, { CorsOptions } from 'cors';
import { Request, Response, NextFunction } from 'express';
import { env } from '../config/env';

// ── Helmet ───────────────────────────────────────────────────────────────────
// Sets 11 security-related HTTP headers (XSS, clickjacking, MIME sniffing, etc.)
export const helmetMiddleware = helmet();

// ── CORS ─────────────────────────────────────────────────────────────────────
const allowedOrigins = new Set([env.FRONTEND_URL, 'http://localhost:3000']);

const corsOptions: CorsOptions = {
    origin: (origin, callback) => {
        // Allow same-origin / curl / Postman (no origin header)
        if (!origin) return callback(null, true);

        if (allowedOrigins.has(origin)) {
            callback(null, true);
        } else {
            callback(new Error('CORS_BLOCKED'));
        }
    },
    credentials: true,
    methods: ['GET', 'POST', 'PATCH', 'DELETE', 'OPTIONS'],
};

// Wrap cors() so we can return our own 403 JSON on blocked origins
export const corsMiddleware = (req: Request, res: Response, next: NextFunction) => {
    cors(corsOptions)(req, res, (err) => {
        if (err?.message === 'CORS_BLOCKED') {
            return res.status(403).json({ error: 'CORS_BLOCKED', code: 'CORS_BLOCKED', status: 403 });
        }
        next(err);
    });
};
