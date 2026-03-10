# PULSE_ — Sentiment Intelligence Platform

> Built by **[Ankit Kumar](https://github.com/arsonic-dev)**

A production-grade, full-stack sentiment analysis platform. Paste any text, upload a CSV of thousands of reviews, or call the REST API — PULSE_ returns structured sentiment scores, emotion vectors, keyword extraction, and AI-generated insights in under a second.

---

## ✨ Live Demo

> 🔗 _Coming soon after deployment_

---

## 🖼️ Screenshots

| Landing Page | Dashboard Overview | Batch Analysis |
|---|---|---|
| _screenshot_ | _screenshot_ | _screenshot_ |

---

## 🚀 Features

- **Real-time Analysis** — Single text → sentiment score + 6 emotions + keywords in < 1s
- **Batch CSV Upload** — Upload thousands of rows; get back an enriched CSV with scores
- **Interactive Dashboard** — Overview KPIs, trend charts, analysis history, project organisation
- **3D Visuals** — Rotating globe (Three.js) + morphing sentiment blob on the landing page
- **API Access** — Generate `pk_live_` API keys; call PULSE_ from your own applications
- **Auth** — Google OAuth + email/password via Clerk; JWT-protected backend
- **Security** — Helmet, CORS, Zod input validation, Redis rate limiting, env validation

---

## 🏗️ Architecture

```
pulse-sentiment/
├── apps/
│   ├── web/              # Next.js 14 (App Router) — frontend + dashboard
│   └── api/              # Express + TypeScript — REST API
├── packages/
│   └── shared/           # Shared TypeScript types
└── package.json          # pnpm monorepo (Turborepo)
```

### Tech Stack

| Layer | Technology |
|-------|-----------|
| Frontend | Next.js 14, Tailwind CSS, Clerk, TanStack Query |
| 3D Visuals | Three.js (Globe + Morphing Blob) |
| Backend | Node.js, Express, TypeScript |
| AI Engine | Google Gemini 1.5 Flash + Groq |
| Database | PostgreSQL (Neon) via Drizzle ORM |
| Cache | Redis (Upstash) — deduplication + rate limiting |
| Auth | Clerk (JWT, webhooks, Google OAuth) |
| Validation | Zod (env + request body) |
| Security | Helmet, CORS, sliding-window rate limiter |

---

## 🗂️ API Reference

All routes are under `/api/v1/`. Protected routes require a `Bearer <clerk-jwt>` header.

| Method | Endpoint | Auth | Description |
|--------|----------|------|-------------|
| `POST` | `/analyze` | Optional | Analyse a single text |
| `GET` | `/analyses` | Required | Paginated analysis history |
| `GET` | `/analyses/:id` | Required | Single analysis detail |
| `DELETE` | `/analyses/:id` | Required | Delete an analysis |
| `GET` | `/projects` | Required | List projects |
| `POST` | `/projects` | Required | Create a project |
| `PATCH` | `/projects/:id` | Required | Update a project |
| `DELETE` | `/projects/:id` | Required | Delete a project |
| `GET` | `/keys` | Required | List API keys |
| `POST` | `/keys` | Required | Generate a new API key |
| `DELETE` | `/keys/:id` | Required | Revoke an API key |
| `GET` | `/dashboard/stats` | Required | Dashboard KPIs + trend |

### Example — Analyse Text

```bash
curl -X POST https://your-api-url.com/api/v1/analyze \
  -H "Content-Type: application/json" \
  -d '{"text": "This product completely changed how I work. Absolutely love it!"}'
```

**Response:**
```json
{
  "data": {
    "score": 94,
    "label": "very positive",
    "confidence": 0.97,
    "emotions": { "joy": 0.88, "surprise": 0.31, "anger": 0.02 },
    "keywords": ["product", "changed", "love"],
    "summary": "Strongly positive review expressing joy and satisfaction."
  },
  "meta": { "fromCache": false }
}
```

---

## 🛠️ Local Development

### Prerequisites
- Node.js 20+
- pnpm 9+
- A [Neon](https://neon.tech) PostgreSQL database
- An [Upstash](https://upstash.com) Redis instance
- A [Clerk](https://clerk.com) application
- A [Google AI Studio](https://aistudio.google.com) API key

### Setup

```bash
# 1. Clone the repo
git clone https://github.com/arsonic-dev/pulse-sentiment.git
cd pulse-sentiment

# 2. Install dependencies
pnpm install

# 3. Set up environment variables
cp apps/api/.env.example apps/api/.env
cp apps/web/.env.local.example apps/web/.env.local
# Fill in your keys

# 4. Push database schema
pnpm --filter @pulse/api db:push

# 5. Run both apps in parallel
pnpm dev
```

**Frontend:** `http://localhost:3000`
**API:** `http://localhost:8081`
**Health check:** `http://localhost:8081/health`

---

## 🔐 Environment Variables

### `apps/api/.env`

```env
NODE_ENV=development
PORT=8081
DATABASE_URL=postgresql://...
REDIS_URL=rediss://...
GEMINI_API_KEY=...
GROQ_API_KEY=...
CLERK_SECRET_KEY=sk_...
CLERK_WEBHOOK_SECRET=whsec_...
FRONTEND_URL=http://localhost:3000
```

### `apps/web/.env.local`

```env
NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY=pk_...
CLERK_SECRET_KEY=sk_...
NEXT_PUBLIC_CLERK_SIGN_IN_URL=/sign-in
NEXT_PUBLIC_CLERK_SIGN_UP_URL=/sign-up
NEXT_PUBLIC_API_URL=http://localhost:8081
```

---

## 🗺️ Roadmap

- [x] Landing page with 3D globe + blob
- [x] Real-time sentiment analysis
- [x] Dashboard (Overview, Analyze, History, Projects, API Keys, Settings)
- [x] Clerk authentication
- [x] PostgreSQL persistence
- [x] Redis caching + rate limiting
- [x] Security hardening (Helmet, Zod, CORS)
- [ ] BullMQ batch CSV worker
- [ ] Stripe plan upgrades
- [ ] Deploy (Vercel + Railway)
- [ ] Custom domain

---

## 📄 License

MIT © 2026 [Ankit Kumar](https://github.com/arsonic-dev)

---

<div align="center">
  <sub>Built with ❤️ by Ankit Kumar — <a href="https://github.com/arsonic-dev">@arsonic-dev</a></sub>
</div>
