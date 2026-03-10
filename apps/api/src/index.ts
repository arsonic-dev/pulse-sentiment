// ─── 1. ENV VALIDATION — must be the very first import ───────────────────────
import './config/env';
import { env } from './config/env';

// ─── 2. Core imports ──────────────────────────────────────────────────────────
import express from 'express';
import dns from 'node:dns';

// ─── 3. Security middleware ───────────────────────────────────────────────────
import { helmetMiddleware, corsMiddleware } from './middleware/security';
import { errorHandler, notFoundHandler } from './middleware/errorHandler';
import { generalLimiter, analyzeLimiter } from './middleware/rateLimit';

// ─── 4. Routes ────────────────────────────────────────────────────────────────
import analyzeRouter from './routes/analyze';
import analysesRouter from './routes/analyses';
import projectsRouter from './routes/projects';
import dashboardRouter from './routes/dashboard';
import keysRouter from './routes/keys';
import batchRouter from './routes/batch';
import { webhookRouter } from './routes/webhooks';
import { startAnalysisWorker } from './workers/analysisWorker';

// ─── 5. DB (health check only) ────────────────────────────────────────────────
import { db } from './db';
import { users } from './db/schema';

// Fix for resolving localhost IPv6 vs IPv4 on Windows
dns.setDefaultResultOrder('ipv4first');

const app = express();

// ══════════════════════════════════════════════════════════════════════════════
// MIDDLEWARE ORDER — DO NOT CHANGE
// ══════════════════════════════════════════════════════════════════════════════

// [2] Helmet — security headers
app.use(helmetMiddleware);

// [3] CORS — origin allowlist
app.use(corsMiddleware);

// [4] Body parsers — hard 10kb cap prevents memory exhaustion
app.use(express.json({ limit: '10kb' }));
app.use(express.urlencoded({ extended: false, limit: '10kb' }));

// [6] General rate limiter — all /api/v1/* routes
app.use('/api/v1', generalLimiter);

// [7] Route-specific tighter limiters
app.use('/api/v1/analyze', analyzeLimiter);

// ── Routes ────────────────────────────────────────────────────────────────────
app.use('/api/v1/analyze', analyzeRouter);
app.use('/api/v1/analyses', analysesRouter);
app.use('/api/v1/projects', projectsRouter);
app.use('/api/v1/dashboard', dashboardRouter);
app.use('/api/v1/keys', keysRouter);
app.use('/api/v1/analyze/batch', batchRouter);

// Webhook — raw body parser, must remain independent
app.use('/api/v1/webhooks', webhookRouter);

// ── Health check (not rate-limited) ──────────────────────────────────────────
app.get('/health', async (_req, res) => {
    try {
        await db.select().from(users).limit(1);
        res.json({ status: 'ok', database: 'connected', ts: new Date().toISOString() });
    } catch (err: unknown) {
        const message = err instanceof Error ? err.message : 'Unknown error';
        res.status(500).json({ status: 'error', message });
    }
});

// [10] 404 — must be after all routes, before errorHandler
app.use(notFoundHandler);

// [11] Global error handler — must be LAST
app.use(errorHandler);

// ── Start ─────────────────────────────────────────────────────────────────────
const PORT = env.PORT;
app.listen(PORT, () => {
    console.log(`PULSE API running on http://localhost:${PORT} [${env.NODE_ENV}]`);
    console.log(`[Config] Allowed Frontend URL: ${env.FRONTEND_URL}`);
    console.log(`[Config] Incoming Port: ${process.env.PORT}`);

    // Start background processing worker
    startAnalysisWorker();
    console.log('[Worker] Analysis worker started successfully.');
});
