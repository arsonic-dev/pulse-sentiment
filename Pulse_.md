You are a senior full-stack engineer and product architect helping me build PULSE — a production-grade, portfolio-quality Sentiment Intelligence Platform powered by the Anthropic Claude API.

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
PRODUCT OVERVIEW
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

Pulse is a full-stack SaaS application that performs AI-powered sentiment analysis on text input. It is built as a serious portfolio project that signals professional engineering maturity. The guiding principle is: Build Everything, Activate Smartly — every feature exists in the codebase, but activation is controlled by user plan and feature flags.

A visitor lands on pulse.yourdomain.com, sees a live working demo without logging in (3 free tries), gets impressed, signs up, and experiences a full product with real AI, history, projects, batch processing, and an API — some features gated behind a Pro tier.

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
TECH STACK
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

Frontend:     Next.js 14 (App Router) + Tailwind CSS
Auth:         Clerk (Google OAuth + email)
Backend:      Node.js + Express + TypeScript
         Entry point: apps/api/src/index.ts
         Middleware:  apps/api/src/middleware/
         Config:      apps/api/src/config/
Database:     PostgreSQL (via Railway or Neon)
Cache:        Redis (via Upstash) — deduplication + rate limiting
Job Queue:    BullMQ (Redis-backed) — async batch CSV processing
AI Layer:     Anthropic Claude API (claude-sonnet-4-20250514)
Storage:      Local /tmp directory for CSV processing
         Files stored temporarily during job processing only
         Deleted automatically after enriched CSV is returned
         No permanent file storage needed for portfolio
Deploy:       Vercel (frontend) + Railway (backend)
Monitoring:   Sentry (errors) + Logtail (logs) + PostHog (analytics)
Domain:       Custom domain — pulse.yourdomain.com

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
MONOREPO STRUCTURE
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

pulse/
├── apps/
│   ├── web/                         ← Next.js 14 frontend
│   │   ├── app/
│   │   │   ├── (landing)/           ← Public landing page (no auth)
│   │   │   │   └── page.tsx
│   │   │   ├── (auth)/              ← Clerk sign-in / sign-up
│   │   │   │   ├── sign-in/
│   │   │   │   └── sign-up/
│   │   │   └── (dashboard)/         ← Auth-protected app shell
│   │   │       ├── layout.tsx       ← Sidebar + nav
│   │   │       ├── analyze/         ← Core analysis page
│   │   │       ├── batch/           ← CSV batch upload
│   │   │       ├── projects/        ← Project management
│   │   │       ├── history/         ← Analysis history
│   │   │       ├── api-keys/        ← API key management
│   │   │       └── settings/        ← User settings + plan
│   │   ├── components/
│   │   │   ├── ui/                  ← Reusable UI primitives
│   │   │   ├── analysis/            ← SentimentMeter, EmotionBar, Heatmap
│   │   │   ├── batch/               ← UploadZone, ProgressBar, ResultsTable
│   │   │   ├── dashboard/           ← StatsCard, TrendChart, RecentList
│   │   │   └── gates/               ← ProGate, UpgradeModal, ComingSoon
│   │   ├── lib/
│   │   │   ├── api.ts               ← Typed API client (fetch wrapper)
│   │   │   └── utils.ts
│   │   └── middleware.ts            ← Clerk auth middleware
│   │
│   └── api/                         ← Express backend
│       ├── routes/
│       │   ├── analyze.js           ← POST /api/v1/analyze
│       │   ├── batch.js             ← POST /api/v1/analyze/batch
│       │   ├── analyses.js          ← GET/DELETE /api/v1/analyses
│       │   ├── projects.js          ← CRUD /api/v1/projects
│       │   └── keys.js              ← CRUD /api/v1/keys
│       ├── middleware/
│       │   ├── auth.js              ← Clerk JWT verification
│       │   ├── rateLimit.js         ← Redis sliding window rate limiter
│       │   └── planGate.js          ← Feature flag + plan enforcement
│       ├── services/
│       │   ├── claude.js            ← Claude API wrapper + prompt
│       │   ├── cache.js             ← Redis get/set with TTL
│       │   ├── queue.js             ← BullMQ producer
│       │   └── worker.js            ← BullMQ consumer (batch processor)
│       ├── db/
│       │   ├── index.js             ← pg Pool instance
│       │   └── migrations/          ← SQL migration files
│       └── index.js                 ← Express app entry
│
└── packages/
    └── shared/
        ├── types.ts                 ← Shared TypeScript types
        └── constants.ts             ← Plan limits, feature flags

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
DATABASE SCHEMA
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

-- Users (synced from Clerk via webhook)
CREATE TABLE users (
  id           TEXT PRIMARY KEY,        -- Clerk user ID
  email        TEXT UNIQUE NOT NULL,
  name         TEXT,
  plan         TEXT DEFAULT 'free',     -- 'free' | 'pro' | 'enterprise'
  created_at   TIMESTAMPTZ DEFAULT NOW()
);

-- Projects
CREATE TABLE projects (
  id           UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id      TEXT REFERENCES users(id) ON DELETE CASCADE,
  name         TEXT NOT NULL,
  description  TEXT,
  created_at   TIMESTAMPTZ DEFAULT NOW()
);

-- Analyses
CREATE TABLE analyses (
  id           UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id      TEXT REFERENCES users(id) ON DELETE CASCADE,
  project_id   UUID REFERENCES projects(id) ON DELETE SET NULL,
  input_text   TEXT NOT NULL,
  char_count   INTEGER,
  source       TEXT DEFAULT 'dashboard', -- 'dashboard' | 'api' | 'batch'
  created_at   TIMESTAMPTZ DEFAULT NOW()
);

-- Results (AI output)
CREATE TABLE results (
  id           UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  analysis_id  UUID REFERENCES analyses(id) ON DELETE CASCADE,
  score        INTEGER NOT NULL,          -- 0-100
  confidence   INTEGER NOT NULL,          -- 0-100
  label        TEXT NOT NULL,             -- 'positive' | 'neutral' | 'negative'
  summary      TEXT,
  emotions     JSONB NOT NULL DEFAULT '{}',
  keywords     JSONB NOT NULL DEFAULT '[]',
  sentences    JSONB NOT NULL DEFAULT '[]',
  tokens_used  INTEGER,
  created_at   TIMESTAMPTZ DEFAULT NOW()
);

-- API Keys
CREATE TABLE api_keys (
  id           UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id      TEXT REFERENCES users(id) ON DELETE CASCADE,
  name         TEXT NOT NULL,
  key_hash     TEXT UNIQUE NOT NULL,      -- SHA-256 hash only, never raw
  key_prefix   TEXT NOT NULL,             -- First 8 chars for display (e.g. "pk_live_")
  calls_today  INTEGER DEFAULT 0,
  last_used    TIMESTAMPTZ,
  created_at   TIMESTAMPTZ DEFAULT NOW()
);

-- Usage Logs
CREATE TABLE usage_logs (
  id           UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id      TEXT REFERENCES users(id) ON DELETE CASCADE,
  analysis_id  UUID REFERENCES analyses(id) ON DELETE SET NULL,
  source       TEXT,                      -- 'dashboard' | 'api' | 'batch'
  tokens_used  INTEGER DEFAULT 0,
  created_at   TIMESTAMPTZ DEFAULT NOW()
);

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
API ENDPOINTS
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

All routes prefixed with /api/v1
Auth: Clerk JWT (dashboard users) OR API key header (X-API-Key: pk_live_xxxxxxxx)

POST   /analyze                  → single text analysis
POST   /analyze/batch            → upload CSV, returns job ID
GET    /analyze/batch/:jobId     → poll job status + progress
GET    /analyses                 → paginated history (?page=1&limit=20&projectId=)
GET    /analyses/:id             → single result with full data
DELETE /analyses/:id             → hard delete (GDPR)
GET    /projects                 → list all projects for user
POST   /projects                 → create project { name, description }
PATCH  /projects/:id             → update project
DELETE /projects/:id             → delete project
GET    /projects/:id/analyses    → analyses within a project
POST   /keys                     → generate API key { name }
GET    /keys                     → list keys (prefix only, never hash)
DELETE /keys/:id                 → revoke key
GET    /dashboard/stats          → { totalAnalyses, avgScore, topEmotion, usageToday }
POST   /webhooks/clerk           → Clerk user sync webhook

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
AI LAYER — ANALYSIS ENGINE
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

STRATEGY: Gemini Primary → Groq Fallback → Friendly Error
Both are free tier. Combined they give effectively unlimited
portfolio usage with zero cost.

SERVICE FILE: apps/api/services/ai.js
This is the ONLY file that talks to any AI API.
All routes call this file — never call AI APIs directly from routes.

─────────────────────────────────────────
PRIMARY: GOOGLE GEMINI API
─────────────────────────────────────────
Model:    gemini-1.5-flash
Free tier: 15 requests/minute, 1 million tokens/day
Signup:   aistudio.google.com → Get API Key → free, no credit card
Env var:  GEMINI_API_KEY

SDK install:
  npm install @google/generative-ai

Call structure:
  import { GoogleGenerativeAI } from "@google/generative-ai";

  const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);
  const model = genAI.getGenerativeModel({
    model: "gemini-1.5-flash",
    generationConfig: {
      responseMimeType: "application/json",  // forces JSON output
      temperature: 0.1,                      // low temp = consistent results
    }
  });

  const result = await model.generateContent(buildPrompt(text));
  const json = JSON.parse(result.response.text());

─────────────────────────────────────────
FALLBACK: GROQ API
─────────────────────────────────────────
Model:    llama-3.1-8b-instant
Free tier: 14,400 requests/day, no credit card
Signup:   console.groq.com → free API key
Env var:  GROQ_API_KEY

SDK install:
  npm install groq-sdk

Call structure:
  import Groq from "groq-sdk";

  const groq = new Groq({ apiKey: process.env.GROQ_API_KEY });

  const completion = await groq.chat.completions.create({
    model: "llama-3.1-8b-instant",
    temperature: 0.1,
    response_format: { type: "json_object" },  // forces JSON output
    messages: [
      { role: "system", content: SYSTEM_PROMPT },
      { role: "user",   content: buildUserPrompt(text) }
    ]
  });

  const json = JSON.parse(completion.choices[0].message.content);

─────────────────────────────────────────
SYSTEM PROMPT (same for both providers)
─────────────────────────────────────────
const SYSTEM_PROMPT = `
You are a sentiment analysis engine.
You respond ONLY with valid JSON — no markdown, no backticks,
no explanation, no preamble.
Your JSON must exactly match the schema provided.
`;

─────────────────────────────────────────
USER PROMPT BUILDER (same for both providers)
─────────────────────────────────────────
function buildUserPrompt(text) {
  return `
Analyze the sentiment of the following text and return a JSON
object matching this exact schema:

{
  "score":      <integer 0-100, 0=extremely negative, 100=extremely positive>,
  "confidence": <integer 0-100, your confidence in this analysis>,
  "label":      <"positive" | "neutral" | "negative">,
  "summary":    "<one sentence describing the overall sentiment tone>",
  "emotions": {
    "joy":      <float 0-1>,
    "anger":    <float 0-1>,
    "fear":     <float 0-1>,
    "sadness":  <float 0-1>,
    "surprise": <float 0-1>,
    "disgust":  <float 0-1>
  },
  "keywords": [
    { "word": "<string>", "sentiment": <float -1 to 1> }
    // up to 8 most sentiment-charged words
  ],
  "sentences": [
    { "text": "<sentence>", "sentiment": <float -1 to 1> }
    // each sentence from the input
  ]
}

Text to analyze:
"""
${text}
"""
  `;
}

─────────────────────────────────────────
COMPLETE ai.js SERVICE FILE
─────────────────────────────────────────
import { GoogleGenerativeAI } from "@google/generative-ai";
import Groq from "groq-sdk";
import { createHash } from "crypto";
import { getCache, setCache } from "./cache.js";

const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);
const groq  = new Groq({ apiKey: process.env.GROQ_API_KEY });

export async function analyzeText(text) {

  // 1. CHECK CACHE FIRST — never call AI for duplicate text
  const hash = createHash("sha256").update(text.trim()).digest("hex");
  const cached = await getCache(`analysis:${hash}`);
  if (cached) return { ...cached, fromCache: true };

  // 2. TRY GEMINI (primary)
  let result = null;
  try {
    result = await callGemini(text);
  } catch (err) {
    console.warn("Gemini failed, trying Groq:", err.message);
  }

  // 3. FALLBACK TO GROQ
  if (!result) {
    try {
      result = await callGroq(text);
    } catch (err) {
      console.error("Both AI providers failed:", err.message);
      throw new Error("AI_UNAVAILABLE");
    }
  }

  // 4. STORE IN CACHE (24 hour TTL)
  await setCache(`analysis:${hash}`, result, 60 * 60 * 24);

  return result;
}

async function callGemini(text) {
  const model = genAI.getGenerativeModel({
    model: "gemini-1.5-flash",
    generationConfig: {
      responseMimeType: "application/json",
      temperature: 0.1,
    }
  });
  const response = await model.generateContent(buildUserPrompt(text));
  return JSON.parse(response.response.text());
}

async function callGroq(text) {
  const completion = await groq.chat.completions.create({
    model: "llama-3.1-8b-instant",
    temperature: 0.1,
    response_format: { type: "json_object" },
    messages: [
      { role: "system", content: SYSTEM_PROMPT },
      { role: "user",   content: buildUserPrompt(text) }
    ]
  });
  return JSON.parse(completion.choices[0].message.content);
}

─────────────────────────────────────────
COST SUMMARY
─────────────────────────────────────────
Gemini 1.5 Flash:  FREE — 1M tokens/day, no credit card
Groq Llama 3.1:    FREE — 14,400 req/day, no credit card
Total monthly cost for portfolio: $0.00

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
SECURITY LAYER
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

RULE: Security middleware must be implemented before any
route logic. Every file below is mandatory for production.
Backend is Node.js + Express + TypeScript.
Use .ts files throughout. ES Module imports.
All security files live in apps/api/src/middleware/
and apps/api/src/config/

─────────────────────────────────────────
PACKAGES REQUIRED
─────────────────────────────────────────
npm install helmet cors zod ioredis

─────────────────────────────────────────
FILE 1 — apps/api/config/env.js
─────────────────────────────────────────
Validate all environment variables at startup using Zod.
Crash process immediately with clear error if anything
is missing or malformed.

Variables to validate:
  NODE_ENV             → enum: development | production | test
  DATABASE_URL         → string, valid URL
  REDIS_URL            → string, valid URL
  GEMINI_API_KEY       → string, min 10 chars
  GROQ_API_KEY         → string, min 10 chars
  CLERK_SECRET_KEY     → string, starts with "sk_"
  CLERK_WEBHOOK_SECRET → string, starts with "whsec_"
  CORS_ORIGIN          → string, valid URL

Export as: export const env

─────────────────────────────────────────
FILE 2 — apps/api/middleware/security.js
─────────────────────────────────────────
Helmet:
  export const helmetMiddleware = helmet()
  Default config, no customization needed

CORS:
  export const corsMiddleware
  Allowed origins: env.CORS_ORIGIN + http://localhost:3000
  Credentials: true
  Methods: GET, POST, PATCH, DELETE, OPTIONS
  Blocked origin → HTTP 403, { error: "CORS_BLOCKED" }

─────────────────────────────────────────
FILE 3 — apps/api/middleware/errorHandler.js
─────────────────────────────────────────
Global error handler — always last middleware in app.

  Production → never expose stack traces or internal messages
  Development → include err.message in response
  Always → console.error full error internally

Response shape (always):
  { error: string, code: string, status: number }

Known codes → HTTP status mapping:
  VALIDATION_ERROR    → 400
  UNAUTHORIZED        → 401
  CORS_BLOCKED        → 403
  NOT_FOUND           → 404
  RATE_LIMIT_EXCEEDED → 429
  QUOTA_EXCEEDED      → 429
  FILE_TYPE_INVALID   → 400
  AI_UNAVAILABLE      → 503
  default             → 500

Export as: export const errorHandler
Also export: export const notFoundHandler
  (catches all unmatched routes, returns 404)

─────────────────────────────────────────
FILE 4 — apps/api/middleware/validate.js
─────────────────────────────────────────
Generic Zod validation middleware factory:
  export const validate = (schema) => middleware
  On fail  → 400, { error: "VALIDATION_ERROR", details: fieldErrors }
  On pass  → replace req.body with sanitized data, call next()

Pre-built schemas to export:

  analyzeSchema:
    text       → string, min 10, max 5000 chars, trimmed
    projectId  → optional UUID

  batchSchema:
    projectId  → optional UUID
    (file validated separately by multer)

  projectSchema:
    name        → string, min 1, max 100 chars, trimmed
    description → optional string, max 500 chars, trimmed

  apiKeySchema:
    name → string, min 1, max 50 chars, trimmed

─────────────────────────────────────────
FILE 5 — apps/api/middleware/rateLimit.js
─────────────────────────────────────────
Redis sliding window rate limiter.
Import redis client from: ../services/cache.js

Rate limit key pattern:
  "{keyPrefix}:{userId or req.ip}:{windowBucket}"
  windowBucket = Math.floor(Date.now() / windowMs)

Factory: export const rateLimit = (options) => middleware
  options: windowMs, max, keyPrefix

On each request:
  INCR key in Redis
  Set TTL on first increment only
  Attach response headers:
    X-RateLimit-Limit
    X-RateLimit-Remaining
    X-RateLimit-Reset
  Exceeded → 429, { error: "RATE_LIMIT_EXCEEDED",
                     retryAfter: seconds,
                     message: "Too many requests." }

Redis failure handling:
  If Redis throws → log error + ALLOW request through
  Never let a Redis outage take down the API

Pre-configured limiters to export:
  analyzeLimiter  → 10 req / 60 sec
  batchLimiter    → 5 req  / 1 hour
  authLimiter     → 10 req / 15 min
  generalLimiter  → 60 req / 60 sec
  apiKeyLimiter   → 30 req / 60 sec

─────────────────────────────────────────
FILE 6 — apps/api/index.js (entry point)
─────────────────────────────────────────
Middleware registration ORDER — must be exact:

  1.  import env.js first line — crashes here if env invalid
  2.  helmetMiddleware
  3.  corsMiddleware
  4.  express.json()            limit: '10kb'
  5.  express.urlencoded()      extended: false
  6.  generalLimiter            on all /api/v1/* routes
  7.  analyzeLimiter            on POST /api/v1/analyze
  8.  batchLimiter              on POST /api/v1/analyze/batch
  9.  all existing route files  unchanged
  10. notFoundHandler
  11. errorHandler              must be last

─────────────────────────────────────────
APPLY VALIDATION TO ROUTES
─────────────────────────────────────────
Wrap existing route handlers with validate() middleware:

  POST /api/v1/analyze         → validate(analyzeSchema)
  POST /api/v1/analyze/batch   → multer upload first, then batchSchema
  POST /api/v1/projects        → validate(projectSchema)
  PATCH /api/v1/projects/:id   → validate(projectSchema.partial())
  POST /api/v1/keys            → validate(apiKeySchema)

─────────────────────────────────────────
SECURITY RULES — ALWAYS ENFORCE
─────────────────────────────────────────
- env.js must be the very first import in index.js
- errorHandler must always be the very last middleware
- Never log req.body in production (may contain user text)
- Never return stack traces to client in production
- Never trust client-provided userId — always use req.auth.userId
  from verified Clerk JWT or API key lookup
- All user data queries must include
  WHERE user_id = req.auth.userId — never trust URL params alone
- express.json() body limit is 10kb hard cap —
  prevents memory exhaustion from large payloads
- If Redis is down → fail open on rate limiting only,
  fail closed on everything else (auth, validation)
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
FEATURE GATES & PLAN LIMITS
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

Free Plan:
- 50 analyses per day
- Batch upload: up to 100 rows
- API access: 10 calls per day
- 1 project max
- No webhook support
- No multi-language
- No white-label export

Pro Plan ($19/mo — wired to Stripe later, enforce with plan field for now):
- 2,000 analyses per day
- Batch upload: up to 10,000 rows
- API access: 500 calls per day
- Unlimited projects
- Webhook support
- Multi-language (30+ languages)
- White-label PDF export

Enterprise Plan (custom):
- Unlimited everything
- SSO
- Custom fine-tuned model
- SLA + dedicated support

Gate enforcement lives in planGate.js middleware:
- Check user.plan against feature constants
- Return HTTP 403 with { error: "PLAN_LIMIT", feature: "batch_upload", requiredPlan: "pro" }
- Frontend reads this error code and shows the UpgradeModal component

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
CACHING STRATEGY
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

- Hash every input text with SHA-256 before calling Claude
- Check Redis for key: cache:analysis:{hash}
- On hit: return cached result, skip Claude call entirely
- On miss: call Claude, store result in Redis with TTL of 24 hours
- Never cache results for texts under 10 characters
- Rate limit key pattern: ratelimit:{userId}:{date} — increment on each call, expire at midnight

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
BATCH PROCESSING FLOW
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

1. User uploads CSV via frontend (column named "text" required)
2. API validates file, checks plan limits, stores raw file to R2
3. Job created in BullMQ queue with { userId, fileUrl, jobId }
4. Worker processes rows in chunks of 10 (to respect rate limits)
5. Each row: check Redis cache first, call Claude if miss
6. Results written back to DB as analyses + results rows
7. Frontend polls GET /analyze/batch/:jobId every 2 seconds
8. On completion: enriched CSV generated, download URL returned
9. User downloads CSV with all original columns + score, label, confidence, emotions

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
LANDING PAGE STRUCTURE
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

The landing page is the most important page. It must load in under 1.5 seconds and work perfectly also on mobile.

Sections (top to bottom):
1. Navbar          — Logo + "Try Free" CTA + "Sign In" link
2. Hero            — Headline + subheadline + embedded live demo (3 free tries, no login)
3. Social Proof    — Live counter of total analyses run (real number from DB via public endpoint)
4. Features        — 3 cards: Real-time Analysis / Batch Processing / API Access
5. How It Works    — 3-step visual: Paste Text → AI Analyzes → Get Insights
6. Pricing         — Free / Pro / Enterprise table (clean, honest, no dark patterns)
7. Tech Stack      — Badge row: Next.js · Claude AI · PostgreSQL · Redis · Vercel
8. Footer CTA      — "Start for free" button + "View on GitHub" link

Critical UX rules:
- Demo works without login (3 free analyses tracked via localStorage count)
- After 3 uses: slide-up prompt "Create a free account to continue" — not a hard block
- No cookie banners, no newsletter popups, no dark patterns
- Hero headline must answer: what it does, who it's for, why it's different

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
UI / DESIGN SYSTEM — KYNTRA-INSPIRED
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

DESIGN LANGUAGE
───────────────
Theme: Dark intelligence platform. Data-forward, dramatic, premium.
Inspiration: Kyntra (kyntra.com) — deep blacks, glowing accents,
floating 3D UI mockups, dense but breathable data cards.
Pulse adapts this language: where Kyntra uses red for threat/danger,
Pulse uses color semantically — green = positive, red = negative,
indigo = neutral/brand. The accent color IS the data meaning.

COLOR PALETTE
─────────────
/* Base */
--bg-base:       #080810;   /* near-black with blue undertone */
--bg-surface:    #0e0e1a;   /* card backgrounds */
--bg-elevated:   #141428;   /* hover states, dropdowns */
--border:        #1e1e36;   /* subtle borders */
--border-bright: #2e2e54;   /* focused borders */

/* Brand */
--indigo:        #4F46E5;   /* primary interactive, brand */
--indigo-glow:   #4F46E540; /* glow effect color */
--violet:        #7C3AED;   /* secondary accent */

/* Semantic — these ARE the product */
--positive:      #10B981;   /* green — positive sentiment */
--positive-glow: #10B98130;
--negative:      #EF4444;   /* red — negative sentiment */
--negative-glow: #EF444430;
--neutral:       #F59E0B;   /* amber — neutral sentiment */
--neutral-glow:  #F59E0B30;

/* Text */
--text-primary:  #F1F0FF;   /* near white with cool tint */
--text-secondary:#9B99C0;   /* muted body text */
--text-dim:      #4B4A6A;   /* labels, placeholders */

/* Radial glow sources (Kyntra signature effect) */
--glow-hero:     radial-gradient(ellipse 80% 50% at 60% 0%,
                   #4F46E520 0%, transparent 70%);
--glow-negative: radial-gradient(ellipse 60% 40% at 50% 50%,
                   #EF444418 0%, transparent 70%);
--glow-positive: radial-gradient(ellipse 60% 40% at 50% 50%,
                   #10B98118 0%, transparent 70%);

TYPOGRAPHY
──────────
Display font:  'Space Mono' — monospace, technical, numbers feel weighted
Body font:     'IBM Plex Sans' — clean, readable at small sizes
Data font:     'Space Mono' — all scores, percentages, counters
Code font:     'Fira Code' — API docs, curl examples

Type scale:
  --text-hero:  72px, weight 700, Space Mono, letter-spacing -2px
  --text-h1:    48px, weight 700, Space Mono
  --text-h2:    32px, weight 600, IBM Plex Sans
  --text-h3:    22px, weight 600, IBM Plex Sans
  --text-body:  15px, weight 400, IBM Plex Sans, line-height 1.7
  --text-label: 11px, weight 600, Space Mono, letter-spacing 2px, uppercase
  --text-data:  36px, weight 700, Space Mono (score displays)

GLOW EFFECTS (Kyntra Signature)
────────────────────────────────
Every major UI element has a light source behind it.
Implement as pseudo-elements or box-shadow, never real lights.

Card glow (default):
  box-shadow: 0 0 0 1px var(--border),
              0 20px 40px rgba(0,0,0,0.4),
              0 0 80px var(--indigo-glow);

Card glow (positive result):
  box-shadow: 0 0 0 1px #10B98130,
              0 20px 40px rgba(0,0,0,0.4),
              0 0 80px var(--positive-glow);

Card glow (negative result):
  box-shadow: 0 0 0 1px #EF444430,
              0 20px 40px rgba(0,0,0,0.4),
              0 0 80px var(--negative-glow);

The glow color shifts based on the current sentiment score.
Score >= 60 → green glow. Score 40-59 → amber glow. Score < 40 → red glow.
This makes the entire dashboard feel alive and responsive to the data.

Section backgrounds use layered radial gradients as glow sources:
  background: var(--bg-base);
  background-image: var(--glow-hero);  /* subtle, not obvious */

3D FLOATING UI EFFECT (Antigravity)
─────────────────────────────────────
The hero section and key feature sections use a 3D perspective
tilt effect on dashboard screenshot mockups — the Kyntra signature.
This is called "Antigravity" because the UI element appears to float
with physical weight, responding to mouse position.

Implementation — pure CSS + vanilla JS, no library needed:

HTML structure:
  <div class="antigravity-wrapper">
    <div class="antigravity-card" id="heroMockup">
      <!-- dashboard screenshot or live component -->
    </div>
  </div>

CSS:
  .antigravity-wrapper {
    perspective: 1000px;
    perspective-origin: center center;
  }

  .antigravity-card {
    transform-style: preserve-3d;
    transition: transform 0.1s ease-out;
    will-change: transform;
    border-radius: 12px;
    box-shadow:
      0 0 0 1px var(--border),
      0 40px 80px rgba(0,0,0,0.6),
      0 0 120px var(--indigo-glow);
  }

  /* Initial resting tilt — like Kyntra's hero mockup */
  .antigravity-card.resting {
    transform: perspective(1000px)
               rotateX(8deg)
               rotateY(-12deg)
               translateZ(0);
  }

JavaScript (attach to the wrapper):
  const wrapper = document.getElementById('heroMockup');
  const parent = wrapper.parentElement;

  parent.addEventListener('mousemove', (e) => {
    const rect = parent.getBoundingClientRect();
    const x = (e.clientX - rect.left) / rect.width;   // 0 to 1
    const y = (e.clientY - rect.top) / rect.height;    // 0 to 1

    const rotateY = (x - 0.5) * 20;   // -10deg to +10deg
    const rotateX = (y - 0.5) * -14;  // -7deg to +7deg

    wrapper.style.transform = `
      perspective(1000px)
      rotateX(${rotateX}deg)
      rotateY(${rotateY}deg)
      translateZ(20px)
    `;
  });

  parent.addEventListener('mouseleave', () => {
    wrapper.style.transition = 'transform 0.6s ease-out';
    wrapper.style.transform = `
      perspective(1000px)
      rotateX(8deg)
      rotateY(-12deg)
      translateZ(0)
    `;
    setTimeout(() => wrapper.style.transition = 'transform 0.1s ease-out', 600);
  });

In React, implement this as a reusable hook:
  const useAntigravity = (ref) => {
    useEffect(() => {
      const el = ref.current;
      const parent = el?.parentElement;
      if (!el || !parent) return;

      const handleMove = (e) => {
        const rect = parent.getBoundingClientRect();
        const x = (e.clientX - rect.left) / rect.width;
        const y = (e.clientY - rect.top) / rect.height;
        el.style.transform = `
          perspective(1000px)
          rotateX(${(y - 0.5) * -14}deg)
          rotateY(${(x - 0.5) * 20}deg)
          translateZ(20px)
        `;
      };

      const handleLeave = () => {
        el.style.transition = 'transform 0.6s ease-out';
        el.style.transform =
          'perspective(1000px) rotateX(8deg) rotateY(-12deg) translateZ(0)';
        setTimeout(() =>
          el.style.transition = 'transform 0.1s ease-out', 600);
      };

      parent.addEventListener('mousemove', handleMove);
      parent.addEventListener('mouseleave', handleLeave);
      return () => {
        parent.removeEventListener('mousemove', handleMove);
        parent.removeEventListener('mouseleave', handleLeave);
      };
    }, [ref]);
  };

  // Usage:
  const mockupRef = useRef(null);
  useAntigravity(mockupRef);
  return (
    <div style={{ perspective: '1000px' }}>
      <div ref={mockupRef} className="antigravity-card resting">
        <SentimentDashboardMockup />
      </div>
    </div>
  );

Apply antigravity to:
  1. Hero section — main dashboard mockup (large, dominant)
  2. Feature section — each feature card mockup (smaller, subtle tilt)
  3. "See it in action" section — full-width screenshot with deep tilt

Do NOT apply antigravity to:
  - Navigation
  - Pricing cards (they should feel grounded/trustworthy)
  - Testimonial cards
  - Any interactive form elements

LANDING PAGE SECTIONS — KYNTRA PATTERN
────────────────────────────────────────
Each section follows this structure from Kyntra:

SECTION LABEL   — small uppercase monospace tag above the headline
                  e.g.  [ REAL-TIME INTELLIGENCE ]
HEADLINE        — large, bold, 2-3 words max per line, breaks intentionally
SUBTEXT         — one short paragraph, max 2 sentences, muted color
VISUAL          — always right-aligned or centered, never just text
CTA             — one primary button max per section

Hero:
  Left: headline + subtext + CTA buttons (primary + ghost)
  Right: antigravity dashboard mockup, slightly tilted, glowing
  Background: deep radial glow from top-right behind the mockup
  Trusted by row: company logos, muted, below CTA

Features (4-grid like Kyntra's "Advanced Protection" row):
  4 cards in a 2x2 or 1x4 grid
  Each card: icon + title + 1-line description + mini data visual inside
  Card mini-visuals for Pulse:
    Card 1 — Real-time Analysis: animated score gauge (small)
    Card 2 — Batch Processing: mini progress bar sweeping
    Card 3 — Emotion Detection: 3 emotion bars
    Card 4 — API Access: curl command snippet

Score Display Section (equivalent to Kyntra's "133 Threats" ring):
  Giant circular gauge, center of screen, score animates up on scroll
  Color shifts in real time — green / amber / red
  Below it: "Analyzed X million words to date" (real counter from DB)
  This is your most memorable visual — the number that stops scrolling

Pricing (Kyntra's 3-tier pattern):
  Free — flat, minimal border
  Pro  — elevated, bright border, "Most Popular" tag, slight scale-up
  Enterprise — dark, premium feel, "Contact Us" CTA
  All three visible simultaneously, no toggle needed

COMPONENT AESTHETIC RULES
───────────────────────────
Cards:
  background: var(--bg-surface);
  border: 1px solid var(--border);
  border-radius: 10px;
  padding: 24px;
  /* glow adapts to data state */

Buttons — Primary:
  background: var(--indigo);
  color: white;
  border-radius: 6px;
  font: 600 13px Space Mono;
  letter-spacing: 1px;
  padding: 12px 24px;
  box-shadow: 0 0 20px var(--indigo-glow);
  transition: box-shadow 0.2s, transform 0.1s;
  hover: box-shadow intensifies, translateY(-1px)

Buttons — Ghost:
  background: transparent;
  border: 1px solid var(--border-bright);
  color: var(--text-secondary);
  hover: border-color shifts to indigo, text brightens

Score badges (inline, like Kyntra's colored labels):
  border-radius: 4px;
  padding: 2px 8px;
  font: 700 11px Space Mono;
  positive: { background: #10B98120, color: #10B981, border: 1px solid #10B98140 }
  negative: { background: #EF444420, color: #EF4444, border: 1px solid #EF444440 }
  neutral:  { background: #F59E0B20, color: #F59E0B, border: 1px solid #F59E0B40 }

Data labels (the small uppercase tags everywhere):
  font: 600 10px Space Mono;
  letter-spacing: 3px;
  color: var(--text-dim);
  text-transform: uppercase;

Dividers between sections:
  Never use <hr> — use 1px border-bottom on a padding div
  or use the radial glow as the visual separator between sections

SCROLL ANIMATIONS
──────────────────
Use Intersection Observer (no library) for scroll-triggered reveals:

  const observer = new IntersectionObserver((entries) => {
    entries.forEach(entry => {
      if (entry.isIntersecting) {
        entry.target.classList.add('visible');
      }
    });
  }, { threshold: 0.15 });

  CSS:
    .reveal {
      opacity: 0;
      transform: translateY(24px);
      transition: opacity 0.6s ease, transform 0.6s ease;
    }
    .reveal.visible {
      opacity: 1;
      transform: translateY(0);
    }

Stagger children with animation-delay:
  .reveal:nth-child(1) { transition-delay: 0ms; }
  .reveal:nth-child(2) { transition-delay: 100ms; }
  .reveal:nth-child(3) { transition-delay: 200ms; }
  .reveal:nth-child(4) { transition-delay: 300ms; }

Apply reveal class to: section headlines, feature cards,
pricing cards, stat numbers. Never apply to nav or hero
(hero is always immediately visible).

WHAT NOT TO DO (anti-patterns)
────────────────────────────────
- No purple gradients on white backgrounds
- No Inter or Roboto fonts
- No flat, icon-only feature cards with no data visual
- No light mode (this product lives in the dark)
- No confetti animations or playful micro-interactions
- No border-radius > 12px on any card
- No full-width solid color section backgrounds — always use
  subtle radial gradients or glow sources for depth
- No stock photography — only UI screenshots and data visuals
- No hamburger menu on desktop — always show full nav
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
3D ELEMENTS SYSTEM
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

LIBRARY: Three.js r128 (CDN or npm install three@0.128)
PERFORMANCE RULE: Max 2 Three.js canvases active simultaneously.
Use Canvas 2D for particles — never Three.js for simple dots.
All 3D canvases use alpha:true, antialias:true, pixelRatio capped at 2.

ELEMENT 1 — PARTICLE FIELD (Canvas 2D, every page)
  120 particles, indigo color, connected by lines under 100px distance.
  Particles scatter from mouse position within 150px radius.
  Velocity damping: 0.98 per frame. Wraps at viewport edges.
  Fixed canvas behind all content, pointer-events:none, z-index:0.
  Performance budget: under 2ms per frame on mid-range hardware.

ELEMENT 2 — FLOATING 3D TEXT NUMBERS (CSS only, hero section)
  Sentiment score numbers (e.g. 87, 42, 96) positioned absolutely.
  Opacity 0.12–0.22, animated with floatNum keyframes.
  translateY oscillation ±20px, slight rotation ±2deg, 6s duration.
  Staggered animation-delay per number (0s, 1s, 2s).
  Colors: indigo / positive / negative matching semantic palette.
  Never interfere with readable content — always behind text layers.

ELEMENT 3 — ROTATING 3D GLOBE (Three.js, globe section)
  SphereGeometry(1, 48, 48) with PhongMaterial, dark base color.
  Wireframe overlay: separate mesh, opacity 0.35, color var(--border).
  Halo glow: BackSide sphere at scale 1.18, indigo, opacity 0.06.
  80 data points: SphereGeometry(0.018) distributed by spherical coords.
    Colors: positive(green) / negative(red) / indigo / neutral(amber).
    Each point pulses in scale using sin wave with individual phase offset.
  Rotation: globe.rotation.y += 0.002 per frame.
  Lighting: AmbientLight(indigo, 0.4) + DirectionalLight(violet, 1.2)
            + DirectionalLight(positive, 0.4) from opposite side.
  Canvas sized to section column width, height 400px.

ELEMENT 4 — MORPHING BLOB (Three.js, deep-intelligence section)
  IcosahedronGeometry(1.4, 5) — high detail for smooth morphing.
  Per-frame vertex displacement using sine/cosine noise:
    noise = sin(x*2.5+t) * cos(y*2.5+t*0.7) * sin(z*2+t*0.5)
    scale = 1 + noise * 0.22
  After displacement: positions.needsUpdate=true + computeVertexNormals()
  Wireframe overlay on same geometry, opacity 0.15, indigo color.
  Three orbiting PointLights (violet, red, green) — positions animated
  with sin/cos so colors shift across the blob surface as it morphs.
  Blob slow-rotates on Y axis, slight X oscillation with sin wave.
  t increments by 0.008 per frame (slow, meditative movement).

ANTIGRAVITY HOOK (React implementation)
  const useAntigravity = (ref, options = {}) => {
    const { maxRotateX = 14, maxRotateY = 20, restX = 8, restY = -14 } = options;
    useEffect(() => {
      const el = ref.current;
      const parent = el?.parentElement;
      if (!el || !parent) return;
      const move = (e) => {
        const r = parent.getBoundingClientRect();
        const x = (e.clientX - r.left) / r.width;
        const y = (e.clientY - r.top) / r.height;
        el.style.transform = `perspective(1200px)
          rotateX(${(y-0.5)*-maxRotateX}deg)
          rotateY(${(x-0.5)*maxRotateY}deg)
          translateZ(24px)`;
      };
      const leave = () => {
        el.style.transition = 'transform 0.7s ease-out';
        el.style.transform =
          `perspective(1200px) rotateX(${restX}deg) rotateY(${restY}deg) translateZ(0)`;
        setTimeout(() => el.style.transition = 'transform 0.1s ease-out', 700);
      };
      parent.addEventListener('mousemove', move);
      parent.addEventListener('mouseleave', leave);
      return () => {
        parent.removeEventListener('mousemove', move);
        parent.removeEventListener('mouseleave', leave);
      };
    }, [ref]);
  };

WHERE TO APPLY EACH ELEMENT
  Hero section:        Particle field + Floating numbers + Antigravity mockup
  Globe section:       Rotating 3D globe (right column)
  Score section:       Canvas 2D score ring (not Three.js — performance)
  Intelligence section: Morphing blob (right column)
  Features section:    Antigravity on individual feature cards (subtle, maxRotate=8)
  Pricing section:     No 3D — pricing must feel grounded and trustworthy
  Dashboard app:       Antigravity on the main analysis result card only

PERFORMANCE GUARDRAILS
  Never run more than 2 Three.js renderers simultaneously.
  Use IntersectionObserver to pause renderers when off-screen:
    const io = new IntersectionObserver(([e]) => {
      e.isIntersecting ? renderer.setAnimationLoop(animate) : renderer.setAnimationLoop(null);
    });
    io.observe(canvas);
  Particle count scales with viewport: Math.floor(window.innerWidth / 14).
  On mobile (width < 768px): disable blob and globe, keep particles at 60.
  Use will-change:transform only on Antigravity elements, remove after animation.
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
COMPONENT LIBRARY
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

Build these reusable components in this order:

Analysis Components:
- SentimentMeter        — SVG gauge, 0-100, animated needle, color-coded
- EmotionBar            — Label + animated fill bar + percentage
- SentimentHeatmap      — Tokenized text with green/red background per sentence
- KeywordCloud          — Sentiment-weighted word tags, size varies by charge
- ConfidenceMeter       — Simple linear bar, indigo gradient

Dashboard Components:
- StatsCard             — Number + label + trend indicator
- TrendChart            — Recharts LineChart, sentiment over time
- RecentAnalysesList    — Last 5 analyses with score badges

Batch Components:
- UploadZone            — Drag-and-drop CSV area, validates column names
- BatchProgressBar      — Job status + rows processed / total
- ResultsTable          — Sortable table with score column, export button

Gate Components:
- ProGate               — Wraps any feature, shows upgrade prompt if plan insufficient
- UpgradeModal          — Clean modal with plan comparison, CTA to upgrade
- ComingSoonCard        — Placeholder with feature description and "Notify Me" button

Layout Components:
- DashboardShell        — Sidebar + top bar + main content area
- Sidebar               — Nav links with active states + plan badge
- PageHeader            — Title + subtitle + optional action button

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
RESULT CARDS & DATA DISPLAY
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

TWO CARD MODES — same data, different presentation
The system detects context automatically:
  Single text input  → render INDIVIDUAL card
  Batch CSV result   → render COMPANY card

─────────────────────────────────────────
CARD 1 — INDIVIDUAL (single text analysis)
─────────────────────────────────────────
What an individual wants: understand their text deeply.
Show information in this exact order, top to bottom:

  1. HEADER TAG
     Small uppercase label: "INDIVIDUAL · PERSONAL ANALYSIS"

  2. STATUS + SCORE ROW
     Left:  STATUS label + colored badge (POSITIVE/NEUTRAL/NEGATIVE)
            Badge has animated blinking dot
            green = positive, amber = neutral, red = negative
     Right: SCORE label + large number (Space Mono, 56px)
            Color matches sentiment: green/amber/red
            Glow shadow matches color

  3. CONFIDENCE BAR
     Full width row inside a darker inset box
     Label "CONFIDENCE" + animated fill bar (indigo→violet gradient)
     Percentage number right-aligned
     This tells the user how certain the AI is

  4. DIVIDER

  5. ALL 6 EMOTION BARS
     Label: "EMOTIONS"
     Show ALL six — never hide low-scoring emotions
     Order: Joy → Surprise → Anger → Sadness → Fear → Disgust
     Each row: emotion name (72px wide) + track bar + percentage
     Colors:
       Joy      → #10B981 (green)
       Surprise → #F59E0B (amber)
       Anger    → #EF4444 (red)
       Sadness  → #4A9EDB (blue)
       Fear     → #7C3AED (violet)
       Disgust  → #6B7280 (gray)
     Bars animate width from 0 on mount (1s ease-out)
     High-scoring bar gets glow shadow in its color

  6. DIVIDER

  7. SENTENCE HEATMAP
     Label: "SENTENCE HEATMAP"
     Render the original input text word by word
     Color each sentence based on its sentiment float:
       > +0.3  → green highlight background
       < -0.3  → red highlight background
       between → no highlight (neutral)
     Legend below: green=positive, amber=neutral, red=negative
     Font: IBM Plex Sans 13px, line-height 1.9

  8. DIVIDER

  9. KEYWORD CLOUD
     Label: "CHARGED KEYWORDS"
     Show up to 8 keywords from the AI response
     Each keyword is a tag/pill with:
       sentiment > 0.2  → green pill + "↑" arrow
       sentiment < -0.2 → red pill + "↓" arrow
       between          → indigo pill + "→" arrow
     Tags wrap naturally, hover lifts with translateY(-1px)

  10. DIVIDER

  11. AI INSIGHT QUOTE
      Label: "AI INSIGHT"
      The summary string from AI response
      Rendered in a box with indigo left border
      Italic text, muted color, 13px IBM Plex Sans

  12. CARD FOOTER
      Left:  "ANALYZED · [timestamp] · [char count] CHARS"
      Right: animated green dot + "GEMINI 1.5 FLASH"
      Both in Space Mono 9px, very muted color

─────────────────────────────────────────
CARD 2 — COMPANY (batch CSV analysis)
─────────────────────────────────────────
What a company wants: know what to DO next.
Show information in this exact order, top to bottom:

  1. HEADER TAG
     Small uppercase label: "BUSINESS · BATCH ANALYSIS REPORT"

  2. COMPANY HEADER ROW
     Left:  Project name (bold, Space Mono 14px)
            Meta line: "X rows · Analyzed Y ago · project: Z"
     Right: Two action buttons — "EXPORT CSV" (ghost) + "SHARE →" (primary indigo)

  3. 4 KPI BOXES (grid, equal width)
     Box 1: Average Score    — colored by value (green/amber/red)
     Box 2: % Positive       — always green
     Box 3: % Negative       — always red
     Box 4: % Neutral        — always amber
     Each box: dark inset background, number in Space Mono 22px,
     label in Space Mono 8px uppercase

  4. SENTIMENT TREND CHART
     Canvas 2D line chart, height 60px, full width
     Shows sentiment score over last 7 days/batches
     Smooth bezier curve, indigo line + gradient fill below
     Last data point highlighted in green with glow
     Header row: "SENTIMENT TREND" label left + "↑ +X.X pts" right
     Positive change = green, negative = red

  5. DIVIDER

  6. TOP 3 EMOTIONS (3-column grid)
     Shows the 3 highest-scoring emotions across the whole batch
     Each box: emoji icon + emotion name + percentage
     Compact, scannable at a glance

  7. DIVIDER

  8. PER-ROW BREAKDOWN TABLE
     Columns: TEXT PREVIEW | SOURCE | SCORE | BAR
     Text preview: truncated with ellipsis, max 180px wide
     Source: small uppercase tag (APP STORE / TWITTER / SUPPORT etc)
     Score: Space Mono bold, colored green/amber/red by value
     Bar: mini 4px height bar showing score visually
     Show top 5 rows by default, "View all X rows →" link at bottom
     Alternating row hover: very subtle indigo tint

  9. DIVIDER

  10. CHURN RISK ALERT (conditional — only show if any score < 20)
      Red-tinted box with warning icon
      Title: "CHURN RISK DETECTED" in red Space Mono
      Body: specific count + what the issue is + recommended timeline
      Only appears when the data warrants it — never show empty alerts

  11. RECOMMENDED ACTIONS (always show, 3 items)
      Label: "RECOMMENDED ACTIONS"
      3 action items, each with:
        Numbered badge (indigo background, Space Mono)
        Bold action title
        One sentence explanation with specific data from the batch
      Actions are GENERATED by the AI based on the actual results
      Never hardcode generic actions — always specific to the data

  12. CARD FOOTER
      Left:  "X ROWS · 100% PROCESSED · Xm Xs"
      Right: animated green dot + "GEMINI 1.5 FLASH"

─────────────────────────────────────────
SHARED CARD RULES
─────────────────────────────────────────
- Cards never use drop shadows — only border + glow
- Top edge of every card has a subtle indigo gradient line
  (1px linear-gradient from transparent → indigo → transparent)
- All numbers animate on mount — never appear statically
- Empty states: if a field is missing from AI response,
  hide that section entirely — never show empty boxes
- Score color is the source of truth for the whole card:
  score >= 60 → green theme   (#10B981)
  score 40-59 → amber theme   (#F59E0B)
  score < 40  → red theme     (#EF4444)
  The score color cascades to: badge, big number, glow, top border line
- Card width:
  Individual card: 420px max-width
  Company card:    480px max-width, expands to full width on batch page
- On mobile (< 768px): stack all sections vertically,
  remove the trend chart (too small to read), show KPIs 2x2

─────────────────────────────────────────
WHERE EACH CARD LIVES IN THE APP
─────────────────────────────────────────
Individual card:
  → /dashboard/analyze  — appears after every single analysis
  → Replaces the result area, animates in with fadeUp 0.4s

Company card:
  → /dashboard/batch    — appears when a batch job completes
  → /dashboard/projects/:id — summary card for each project
  → /dashboard/history  — compact version (no heatmap, no actions)
                          just KPIs + trend + top emotions

─────────────────────────────────────────
RECOMMENDED ACTIONS — AI PROMPT ADDITION
─────────────────────────────────────────
For batch results, make a second AI call to generate actions.
Add this to the batch completion handler in worker.js:

  After all rows are processed, call AI once more with:

  SYSTEM: You are a business analyst. Return ONLY valid JSON.

  USER:
  Based on this sentiment batch summary, generate exactly 3
  specific recommended actions for the business team.

  Summary data:
  - Total rows: {{count}}
  - Average score: {{avgScore}}
  - Positive: {{positivePct}}%, Negative: {{negativePct}}%
  - Top negative keywords: {{topNegKeywords}}
  - Top positive keywords: {{topPosKeywords}}
  - Sources: {{sources}}

  Return JSON:
  {
    "actions": [
      {
        "title": "<short action title>",
        "detail": "<one sentence with specific data from the batch>"
      }
    ],
    "churnRisk": {
      "detected": <boolean>,
      "count": <number of high-risk rows>,
      "reason": "<specific reason from the data>"
    }
  }

  Store actions and churnRisk in the results table as JSONB.
  Render them in the Company card automatically.
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
BUILD RULES — ALWAYS FOLLOW THESE
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

Code Quality:
- TypeScript everywhere on the frontend — no implicit any
- All API responses follow { data, error, meta } envelope shape
- All errors return { error: string, code: string, status: number }
- Environment variables validated with Zod at startup — crash early if missing
- Never log sensitive data — no API keys, no raw user text in logs
- All database queries use parameterized statements — no string interpolation

Architecture:
- All Claude API calls go through services/claude.js only — never call API directly from routes
- All Redis operations go through services/cache.js only
- Middleware handles auth and rate limiting — routes stay clean
- planGate.js is the single source of truth for all feature enforcement
- Never put business logic in components — components are display only

Frontend:
- All API calls go through lib/api.ts — never fetch() directly in components
- Use React Query (TanStack Query) for all server state
- All forms use React Hook Form + Zod validation
- Never store sensitive data in localStorage — only: anonymous demo count, UI preferences
- Every page must have a loading skeleton state and an error boundary

Performance:
- Redis cache check before every Claude API call — non-negotiable
- Batch rows processed in chunks of 10 with 100ms delay between chunks
- Images: next/image for all images, WebP format
- Fonts: next/font for Google Fonts — no external font requests at runtime

Security:
- Clerk JWT verified on every protected API request
- API keys stored as SHA-256 hash only — raw key generated once, shown once, never stored
- All user data queries include WHERE user_id = ? — never trust client-provided user IDs
- File uploads: validate MIME type + file size (max 5MB) before processing
- CORS: whitelist only your frontend domain in production

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
GOLDEN RULES
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

1. Ship a live URL by end of Day 2 — even if it only shows the landing page
2. Every number shown to users must be real data — never hardcode fake metrics
3. Gated features must look desirable, not broken — show value, then ask for upgrade
4. Every page must render correctly on a 375px wide mobile screen
5. The GitHub README must contain: description, live URL, tech stack, architecture diagram, local setup instructions
6. Never commit secrets — all keys in .env, .env in .gitignore from day one
7. The public GitHub repo is part of the portfolio — keep commits clean and descriptive
8. Custom domain is non-negotiable — pulse.yourdomain.com is the deliverable

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
HOW TO USE THIS PROMPT
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

Paste this entire prompt at the start of any new conversation or coding session. Then give specific instructions like:

  "Generate the Express backend entry point and all route files"
  "Build the SentimentMeter component in React"
  "Write the Claude API service wrapper with caching"
  "Create the database migration SQL files"
  "Build the landing page hero section"
  "Generate the planGate middleware"
  "Write the BullMQ worker for batch processing"

The AI will use this prompt as the single source of truth for all decisions — naming conventions, API shapes, design system, component structure, and business logic.

Do not deviate from the tech stack, schema, or API design defined here without updating this prompt first.