/**
 * env.ts — Validate ALL environment variables at startup.
 * This file must be the very first import in index.ts.
 * If anything is missing or malformed, process.exit(1) immediately.
 */

import { z } from 'zod';
import dotenv from 'dotenv';
dotenv.config();

const envSchema = z.object({
    NODE_ENV: z.enum(['development', 'production', 'test']).default('development'),
    DATABASE_URL: z.string().url('DATABASE_URL must be a valid URL'),
    REDIS_URL: z.string().url('REDIS_URL must be a valid URL'),
    GEMINI_API_KEY: z.string().min(10, 'GEMINI_API_KEY must be at least 10 chars'),
    GROQ_API_KEY: z.string().min(10, 'GROQ_API_KEY must be at least 10 chars'),
    CLERK_SECRET_KEY: z.string().startsWith('sk_', 'CLERK_SECRET_KEY must start with "sk_"'),
    CLERK_WEBHOOK_SECRET: z.string().startsWith('whsec_', 'CLERK_WEBHOOK_SECRET must start with "whsec_"'),
    // FRONTEND_URL used as CORS origin (per arch decision)
    FRONTEND_URL: z.string().url('FRONTEND_URL must be a valid URL').default('http://localhost:3000'),
    PORT: z.coerce.number().int().positive().default(8081),
});

const parsed = envSchema.safeParse(process.env);

if (!parsed.success) {
    console.error('\n━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
    console.error('❌  PULSE API — ENVIRONMENT VALIDATION FAILED');
    console.error('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
    parsed.error.issues.forEach(issue => {
        console.error(`  • ${issue.path.join('.')}: ${issue.message}`);
    });
    console.error('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n');
    process.exit(1);
}

export const env = parsed.data;
